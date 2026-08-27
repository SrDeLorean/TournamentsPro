import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
import { compareState, decideMigrationStrategy, splitMigrationsAroundBaseline, validateBaselineSql } from './migration-core.mjs';

const { loadEnvConfig } = nextEnv;

const databaseDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(databaseDirectory);
const migrationsDirectory = path.join(databaseDirectory, 'migrations');
const baselinePath = path.join(databaseDirectory, 'baseline.sql');
const mode = process.argv[2] ?? 'migrate';
const baselineThroughVersion = '0005';

loadEnvConfig(projectDirectory);

async function loadMigrations() {
  const fileNames = (await readdir(migrationsDirectory))
    .filter((fileName) => /^\d{4}_[a-z0-9_-]+\.sql$/i.test(fileName))
    .sort((left, right) => left.localeCompare(right));

  const versions = new Set();
  const migrations = [];

  for (const fileName of fileNames) {
    const version = fileName.slice(0, 4);
    if (versions.has(version)) {
      throw new Error(`La versión de migración ${version} está duplicada.`);
    }
    versions.add(version);

    const sql = await readFile(path.join(migrationsDirectory, fileName), 'utf8');
    if (!sql.trim()) throw new Error(`La migración ${fileName} está vacía.`);

    migrations.push({
      version,
      name: fileName,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    });
  }

  return migrations;
}

async function loadBaseline() {
  const sql = await readFile(baselinePath, 'utf8');
  validateBaselineSql(sql);
  return {
    name: path.basename(baselinePath),
    sql,
    checksum: createHash('sha256').update(sql).digest('hex'),
  };
}

function connectionOptions() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
    multipleStatements: true,
  };
}

async function readAppliedMigrations(connection) {
  const [tables] = await connection.execute(
    `SELECT COUNT(*) AS total
       FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'schema_migrations'`
  );

  if (Number(tables[0]?.total ?? 0) === 0) return [];

  const [rows] = await connection.execute(
    'SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version ASC'
  );
  return rows;
}

async function readTableNames(connection) {
  const [rows] = await connection.execute(
    'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()'
  );
  return rows.map((row) => String(row.table_name ?? row.TABLE_NAME));
}

async function verify(connection, migrations, baseline) {
  const appliedRows = await readAppliedMigrations(connection);
  const { drift, pending } = compareState(migrations, appliedRows);

  if (drift.length > 0) {
    throw new Error(`Se detectó drift en migraciones: ${drift.join(', ')}`);
  }
  if (pending.length > 0) {
    throw new Error(`Hay ${pending.length} migración(es) pendiente(s): ${pending.map((item) => item.name).join(', ')}`);
  }

  const [baselineRows] = await connection.execute(
    `SELECT name, checksum, state FROM schema_baselines WHERE id = 1`
  );
  if (baselineRows.length > 0
      && (baselineRows[0].name !== baseline.name || baselineRows[0].checksum !== baseline.checksum)) {
    throw new Error(`Se detectó drift en el baseline ${baseline.name}.`);
  }
  if (baselineRows.length > 0 && baselineRows[0].state !== 'APPLIED') {
    throw new Error(`El baseline ${baseline.name} no terminó de aplicarse.`);
  }

  console.log(`Esquema verificado: ${appliedRows.length} migración(es), sin drift.`);
}

async function migrate(connection, migrations, baseline) {
  const [lockRows] = await connection.execute(
    "SELECT GET_LOCK('tournamentspro_schema_migrations', 30) AS acquired"
  );
  if (Number(lockRows[0]?.acquired) !== 1) {
    throw new Error('No fue posible obtener el bloqueo exclusivo de migraciones.');
  }

  try {
    const tableNamesBeforeMetadata = await readTableNames(connection);
    const appliedBeforeMetadata = await readAppliedMigrations(connection);
    const strategy = decideMigrationStrategy(tableNamesBeforeMetadata, appliedBeforeMetadata);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(32) NOT NULL,
        name VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (version),
        UNIQUE KEY uk_schema_migrations_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_baselines (
        id TINYINT UNSIGNED NOT NULL,
        name VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        state ENUM('STARTED', 'APPLIED') NOT NULL DEFAULT 'STARTED',
        installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [baselineStateRows] = await connection.execute(
      'SELECT name, checksum, state FROM schema_baselines WHERE id = 1'
    );
    if (baselineStateRows[0]?.state === 'STARTED') {
      throw new Error(
        `Se encontró un bootstrap incompleto (${baselineStateRows[0].name}). `
        + 'Revise o recree esta base vacía antes de reintentar; no se ejecutarán upgrades sobre un esquema parcial.'
      );
    }

    if (strategy === 'bootstrap') {
      console.log(`Aplicando baseline ${baseline.name}...`);
      await connection.execute(
        "INSERT INTO schema_baselines (id, name, checksum, state) VALUES (1, ?, ?, 'STARTED')",
        [baseline.name, baseline.checksum]
      );
      await connection.query(baseline.sql);
      await connection.execute(
        "UPDATE schema_baselines SET state = 'APPLIED' WHERE id = 1",
      );
      const { reconciled: reconciledMigrations, pending: postBaselineMigrations } = splitMigrationsAroundBaseline(
        migrations,
        baselineThroughVersion,
      );
      for (const migration of reconciledMigrations) {
        await connection.execute(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
          [migration.version, migration.name, migration.checksum]
        );
      }
      for (const migration of postBaselineMigrations) {
        console.log(`Aplicando ${migration.name} después del baseline...`);
        await connection.query(migration.sql);
        await connection.execute(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
          [migration.version, migration.name, migration.checksum]
        );
      }
      console.log(
        `Bootstrap completo: baseline + ${reconciledMigrations.length} migración(es) reconciliadas`
        + ` + ${postBaselineMigrations.length} migración(es) aplicada(s).`,
      );
      return;
    }

    const appliedRows = await readAppliedMigrations(connection);
    const { drift, pending } = compareState(migrations, appliedRows);
    if (drift.length > 0) {
      throw new Error(`Se detectó drift en migraciones: ${drift.join(', ')}`);
    }

    for (const migration of pending) {
      console.log(`Aplicando ${migration.name}...`);
      await connection.query(migration.sql);
      await connection.execute(
        'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
        [migration.version, migration.name, migration.checksum]
      );
    }

    console.log(`Migraciones completas: ${pending.length} aplicada(s).`);
  } finally {
    await connection.execute("SELECT RELEASE_LOCK('tournamentspro_schema_migrations')");
  }
}

async function main() {
  const migrations = await loadMigrations();
  const baseline = await loadBaseline();

  if (mode === '--check-files') {
    console.log(`Baseline válido y archivos de migración válidos: ${migrations.length}.`);
    return;
  }
  if (mode !== 'migrate' && mode !== 'verify') {
    throw new Error('Uso: node database/migrate.mjs [migrate|verify|--check-files]');
  }

  const connection = await mysql.createConnection(connectionOptions());
  try {
    if (mode === 'verify') await verify(connection, migrations, baseline);
    else await migrate(connection, migrations, baseline);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
