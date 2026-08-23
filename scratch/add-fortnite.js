const mysql = require('mysql2/promise');

async function addFortnite() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', database: 'tournamentspro' });
  await pool.query(`
    INSERT INTO games (slug, name, category, team_size, max_roster_members, brand_color)
    VALUES ('fortnite', 'Fortnite Battle Royale', 'Battle Royale', 4, 4, '#FACC15')
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `);
  console.log('✅ Juego Fortnite listo en BD MySQL.');
  await pool.end();
}

addFortnite().catch(console.error);
