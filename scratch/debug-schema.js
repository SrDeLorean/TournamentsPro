const mysql = require('mysql2/promise');

async function checkUsersSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  const [users] = await connection.query(`SELECT id, name, email, role FROM users LIMIT 5`);
  console.log('Usuarios existentes en DB:', users);

  const [cols] = await connection.query(`DESCRIBE users`);
  console.log('Estructura `users`:', cols);

  const [teamCols] = await connection.query(`DESCRIBE teams`);
  console.log('Estructura `teams`:', teamCols);

  await connection.end();
}

checkUsersSchema().catch(console.error);
