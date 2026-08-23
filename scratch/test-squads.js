const mysql = require('mysql2/promise');

async function testSquadQueries() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
  });

  console.log('🧪 Verificando consultas de escuadras y jugadores disponibles...');

  // 1. Check free users not in team_members
  const [freeUsers] = await pool.query(`
    SELECT u.id, u.name, u.gamertag, u.email, u.position
    FROM users u
    WHERE u.id NOT IN (SELECT DISTINCT user_id FROM team_members)
    LIMIT 5
  `);
  console.log('Libres disponibles:', freeUsers.length, freeUsers);

  // 2. Check team_members
  const [members] = await pool.query(`
    SELECT tm.id, tm.team_id, tm.user_id, u.name as user_name
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    LIMIT 5
  `);
  console.log('Miembros en escuadras:', members.length, members);

  await pool.end();
}

testSquadQueries().catch(console.error);
