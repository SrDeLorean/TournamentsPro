const mysql = require('mysql2/promise');

async function checkFKs() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
  });

  const [fks] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'tournamentspro' AND REFERENCED_TABLE_NAME IS NOT NULL 
    ORDER BY TABLE_NAME, CONSTRAINT_NAME
  `);

  console.log('🔗 CLAVES FORÁNEAS ACTIVAS EN LA BD MYSQL (tournamentspro):');
  fks.forEach((f) => {
    console.log(`  ✓ ${f.TABLE_NAME}.${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME} [${f.CONSTRAINT_NAME}]`);
  });

  await pool.end();
}

checkFKs().catch(console.error);
