const mysql = require('mysql2/promise');

async function testSeasonsAndCompetitions() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
  });

  console.log('🧪 Verificando columnas de fecha y tabla temporadas...');

  const [colsComp] = await pool.query('DESCRIBE competitions');
  const fields = colsComp.map((c) => c.Field);
  console.log('Fechas en competitions:', fields.filter((f) => f.includes('fecha')));

  const [seasons] = await pool.query('SELECT * FROM seasons');
  console.log('Seasonscount:', seasons.length);

  await pool.end();
}

testSeasonsAndCompetitions().catch(console.error);
