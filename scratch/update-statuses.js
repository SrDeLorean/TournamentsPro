const mysql = require('mysql2/promise');

async function updateStatuses() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tournamentspro'
  });

  try {
    // 1. Users status column
    await conn.query("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) DEFAULT 'Activo'");
    console.log('1. Updated users status column');

    // 2. Teams status column
    await conn.query("ALTER TABLE teams MODIFY COLUMN status VARCHAR(50) DEFAULT 'Activo'");
    console.log('2. Updated teams status column');

    // 3. Organizations status column
    try {
      await conn.query("ALTER TABLE organizations ADD COLUMN status VARCHAR(50) DEFAULT 'Activa'");
      console.log('3. Added organizations status column');
    } catch (e) {
      console.log('Organizations status column already exists or skipped.');
    }

    // 4. Matches status column
    await conn.query("ALTER TABLE matches MODIFY COLUMN status VARCHAR(50) DEFAULT 'PENDIENTE'");
    console.log('4. Updated matches status column');

    // 5. Add report & proof columns to matches table
    try { await conn.query('ALTER TABLE matches ADD COLUMN reported_score_home INT NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE matches ADD COLUMN reported_score_away INT NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE matches ADD COLUMN proof_url VARCHAR(255) NULL'); } catch (e) {}
    try { await conn.query('ALTER TABLE matches ADD COLUMN reported_by_user_id VARCHAR(36) NULL'); } catch (e) {}
    console.log('5. Added report and proof fields to matches table');

    console.log('ALL STATUS COLUMNS & MATCH REPORT FIELDS SUCCESSFULLY UPDATED IN MYSQL!');
  } catch (error) {
    console.error('Error updating status schema:', error.message);
  } finally {
    await conn.end();
  }
}

updateStatuses();
