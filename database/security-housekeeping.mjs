import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
import {
  buildSecurityHousekeepingPlan,
  readSecurityRetentionConfig,
} from './security-housekeeping-core.mjs';

const { loadEnvConfig } = nextEnv;
const databaseDirectory = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.dirname(databaseDirectory));

const checkOnly = process.argv.includes('--check');
const config = readSecurityRetentionConfig();
const plan = buildSecurityHousekeepingPlan(new Date(), config);

if (checkOnly) {
  console.log(`Housekeeping válido: ${plan.length} operaciones configuradas.`);
  process.exit(0);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tournamentspro',
});

try {
  let total = 0;
  for (const operation of plan) {
    const [result] = await connection.execute(operation.sql, operation.params);
    total += result.affectedRows;
    console.log(`${operation.name}: ${result.affectedRows} filas eliminadas.`);
  }
  console.log(`Housekeeping completado: ${total} filas eliminadas.`);
} finally {
  await connection.end();
}
