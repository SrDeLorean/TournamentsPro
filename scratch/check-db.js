const mysql = require('mysql2/promise');

async function main() {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'tournamentspro' });
    const [orgs] = await conn.query('SELECT * FROM organizations');
    console.log('Total Orgs in DB:', orgs.length);
    console.log('Orgs sample:', orgs.map(o => ({ id: o.id, name: o.name })));
    
    const [comps] = await conn.query('SELECT id, name, game_slug, status, organization_id, organizer_id FROM competitions');
    console.log('Total Competitions in DB:', comps.length);
    console.log('Competitions sample:', comps);
    
    const [eafcOrgs] = await conn.query(`
      SELECT o.*, COUNT(c.id) as comp_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      LEFT JOIN competitions c ON (c.organization_id = o.id OR c.organizer_id = u.id) 
        AND c.game_slug = 'eafc26' 
        AND c.status != 'Borrador'
      GROUP BY o.id
      HAVING comp_count > 0
      ORDER BY comp_count DESC
    `);
    console.log('EAFC26 Orgs with comp_count > 0:', eafcOrgs.length);
    
    const [allEafcOrgs] = await conn.query(`
      SELECT o.*, COUNT(c.id) as comp_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      LEFT JOIN competitions c ON (c.organization_id = o.id OR c.organizer_id = u.id) 
        AND c.game_slug = 'eafc26' 
        AND c.status != 'Borrador'
      GROUP BY o.id
      ORDER BY comp_count DESC
    `);
    console.log('All EAFC26 Orgs (without HAVING comp_count > 0):', allEafcOrgs.length, allEafcOrgs.map(o => ({ id: o.id, name: o.name, comp_count: o.comp_count })));

    await conn.end();
  } catch(e) {
    console.error('DB Error:', e.message);
  }
}

main();
