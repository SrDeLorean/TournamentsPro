import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tournamentspro',
};

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
  if (typeof str === 'number') return str;
  if (typeof str === 'object') {
    if (str instanceof Date) return `'${str.toISOString()}'`;
    return `'${JSON.stringify(str).replace(/'/g, "''")}'`;
  }
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function exportData() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Conectado a MySQL local.');

  const [tablesResult] = await connection.execute('SHOW TABLES');
  const tableNames = tablesResult.map(row => Object.values(row)[0]);

  const priority = ['games', 'users', 'organizations', 'teams', 'seasons', 'competitions', 'team_members', 'competition_teams', 'matches', 'match_events'];
  
  const sortedTables = tableNames.sort((a, b) => {
    const idxA = priority.indexOf(a);
    const idxB = priority.indexOf(b);
    if (idxA > -1 && idxB > -1) return idxA - idxB;
    if (idxA > -1) return -1;
    if (idxB > -1) return 1;
    return 0;
  });

  const sqlStatements = [];
  sqlStatements.push('-- Supabase Data Migration\n');

  for (const tableName of sortedTables) {
    if (tableName === 'schema_migrations' || tableName === 'schema_baselines') continue;

    const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');

    // Agrupar inserts en bloques pequeños
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const valuesList = batch.map(row => {
        const values = columns.map(col => escapeSqlString(row[col]));
        return `(${values.join(', ')})`;
      }).join(',\n  ');
      
      sqlStatements.push(`INSERT INTO "${tableName}" (${columnList})\nVALUES\n  ${valuesList};`);
    }
    sqlStatements.push('\n');
  }

  await connection.end();
  
  const outputPath = path.join(process.cwd(), 'supabase_data.sql');
  fs.writeFileSync(outputPath, sqlStatements.join('\n'));
  console.log('¡Archivo supabase_data.sql generado con éxito!');
}

exportData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
