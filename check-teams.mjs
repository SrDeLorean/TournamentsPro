import mysql from 'mysql2/promise';

async function checkTeams() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tournamentspro',
  });

  const [teams] = await connection.query('SELECT id, name, tag, game_slug FROM teams WHERE name LIKE ?', ['%EA FC 24 Team 10%']);
  console.log('Teams:', teams);
  
  const [games] = await connection.query('SELECT slug, name FROM games');
  console.log('Games:', games);

  await connection.end();
}

checkTeams().catch(console.error);
