const mysql = require('mysql2/promise');

async function fixMatchesSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  const [columns] = await connection.query(`SHOW COLUMNS FROM matches`);
  const fieldNames = columns.map(c => c.Field);
  console.log('Columnas actuales en `matches`:', fieldNames.join(', '));

  // Add missing columns if they don't exist
  const missingCols = [
    { name: 'home_team_id', sql: 'ALTER TABLE matches ADD COLUMN home_team_id VARCHAR(100) DEFAULT NULL' },
    { name: 'away_team_id', sql: 'ALTER TABLE matches ADD COLUMN away_team_id VARCHAR(100) DEFAULT NULL' },
    { name: 'home_team_name', sql: 'ALTER TABLE matches ADD COLUMN home_team_name VARCHAR(255) DEFAULT NULL' },
    { name: 'away_team_name', sql: 'ALTER TABLE matches ADD COLUMN away_team_name VARCHAR(255) DEFAULT NULL' },
    { name: 'scheduled_time', sql: 'ALTER TABLE matches ADD COLUMN scheduled_time DATETIME DEFAULT NULL' },
  ];

  for (const col of missingCols) {
    if (!fieldNames.includes(col.name)) {
      try {
        console.log(`⚡ Agregando columna \`${col.name}\`...`);
        await connection.query(col.sql);
        console.log(`✓ Columna \`${col.name}\` agregada.`);
      } catch (e) {
        console.warn(`Nota agregando \`${col.name}\`:`, e.message);
      }
    }
  }

  await connection.end();
  console.log('🚀 Esquema de `matches` asegurado.');
}

fixMatchesSchema().catch(console.error);
