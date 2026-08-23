const mysql = require('mysql2/promise');

async function alterMatchesBracket() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  const [columns] = await connection.query(`SHOW COLUMNS FROM matches`);
  const fields = columns.map(c => c.Field);
  console.log('Columnas actuales en `matches`:', fields.join(', '));

  const missingCols = [
    { name: 'stage', sql: "ALTER TABLE matches ADD COLUMN stage ENUM('GROUP', 'PLAYOFF') DEFAULT 'GROUP'" },
    { name: 'group_name', sql: "ALTER TABLE matches ADD COLUMN group_name VARCHAR(20) DEFAULT NULL" },
    { name: 'round_name', sql: "ALTER TABLE matches ADD COLUMN round_name VARCHAR(50) DEFAULT NULL" },
    { name: 'next_match_id', sql: "ALTER TABLE matches ADD COLUMN next_match_id VARCHAR(100) DEFAULT NULL" },
    { name: 'next_match_slot', sql: "ALTER TABLE matches ADD COLUMN next_match_slot ENUM('HOME', 'AWAY') DEFAULT 'HOME'" },
  ];

  for (const col of missingCols) {
    if (!fields.includes(col.name)) {
      try {
        console.log(`⚡ Agregando columna \`${col.name}\`...`);
        await connection.query(col.sql);
        console.log(`✓ Columna \`${col.name}\` agregada.`);
      } catch (err) {
        console.warn(`Nota agregando \`${col.name}\`:`, err.message);
      }
    }
  }

  await connection.end();
  console.log('🚀 Alter de `matches` completado exitosamente.');
}

alterMatchesBracket().catch(console.error);
