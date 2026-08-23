const mysql = require('mysql2/promise');

async function checkMatchesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  const [columns] = await connection.query(`SHOW COLUMNS FROM matches`);
  console.log('Columnas de la tabla `matches` en MySQL:');
  columns.forEach(col => console.log(` - ${col.Field} (${col.Type})`));

  // Add matchday_number column if missing
  const matchdayColExists = columns.some(col => col.Field === 'matchday_number' || col.Field === 'jornada');
  if (!columns.some(col => col.Field === 'matchday_number')) {
    console.log('⚡ Agregando columna `matchday_number` a la tabla `matches`...');
    await connection.query(`ALTER TABLE matches ADD COLUMN matchday_number INT DEFAULT 1 AFTER competition_id`);
    console.log('✓ Columna `matchday_number` agregada.');
  }

  await connection.end();
}

checkMatchesTable().catch(console.error);
