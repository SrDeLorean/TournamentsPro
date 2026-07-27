const mysql = require('mysql2/promise');

async function alterTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tournamentspro',
  });

  const cols = [
    { name: 'website', def: 'VARCHAR(255) DEFAULT NULL' },
    { name: 'founded_year', def: 'VARCHAR(50) DEFAULT "2020"' },
    { name: 'rating', def: 'VARCHAR(20) DEFAULT "4.95"' },
    { name: 'redes_sociales', def: 'TEXT DEFAULT NULL' },
  ];

  for (const c of cols) {
    try {
      await connection.query(`ALTER TABLE organizations ADD COLUMN ${c.name} ${c.def}`);
      console.log(`Added column ${c.name} to organizations!`);
    } catch (e) {
      console.log(`Column ${c.name} already exists:`, e.message);
    }
  }

  // Populate sample ratings and logo/banner for initial orgs
  try {
    await connection.query(
      `UPDATE organizations SET 
        logo_url = COALESCE(logo_url, '/images/default/logo-default.png'),
        banner_url = COALESCE(banner_url, '/images/default/banner-default.jpg'),
        country = COALESCE(country, 'Venezuela'),
        founded_year = COALESCE(founded_year, '2019'),
        rating = COALESCE(rating, '4.98')
       WHERE logo_url IS NULL OR banner_url IS NULL`
    );
    console.log('Sample orgs enriched!');
  } catch (e) {
    console.error('Error populating sample orgs:', e);
  }

  await connection.end();
}

alterTable();
