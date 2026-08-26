const forbiddenBaselineStatements = [
  { pattern: /\bCREATE\s+DATABASE\b/i, label: 'CREATE DATABASE' },
  { pattern: /(?:^|;)\s*USE\s+[`\w-]+/im, label: 'USE' },
];

export function validateBaselineSql(sql) {
  if (!sql.trim()) throw new Error('El baseline está vacío.');
  for (const forbidden of forbiddenBaselineStatements) {
    if (forbidden.pattern.test(sql)) {
      throw new Error(`El baseline no puede contener ${forbidden.label}.`);
    }
  }
}

export function decideMigrationStrategy(tableNames, appliedRows) {
  if (appliedRows.length > 0) return 'upgrade';
  const metadataTables = new Set(['schema_migrations', 'schema_baselines']);
  const applicationTables = tableNames.filter((tableName) => !metadataTables.has(tableName));
  return applicationTables.length === 0 ? 'bootstrap' : 'upgrade';
}

export function compareState(migrations, appliedRows) {
  const appliedByVersion = new Map(appliedRows.map((row) => [String(row.version), row]));
  const knownVersions = new Set(migrations.map((migration) => migration.version));
  const drift = [];
  const pending = [];

  for (const migration of migrations) {
    const applied = appliedByVersion.get(migration.version);
    if (!applied) {
      pending.push(migration);
    } else if (applied.name !== migration.name || applied.checksum !== migration.checksum) {
      drift.push(migration.name);
    }
  }

  for (const row of appliedRows) {
    if (!knownVersions.has(String(row.version))) {
      drift.push(`versión aplicada sin archivo local: ${row.version}`);
    }
  }

  return { drift, pending };
}
