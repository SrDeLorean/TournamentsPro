const mysql = require('mysql2/promise');

async function fixMatchesIdColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  console.log('⚡ Modificando columna `id` en `matches` a VARCHAR(150)...');
  await connection.query(`ALTER TABLE matches MODIFY COLUMN id VARCHAR(150) NOT NULL`);
  console.log('✓ Columna `id` ajustada a VARCHAR(150).');

  await connection.end();
}

fixMatchesIdColumn().catch(console.error);
