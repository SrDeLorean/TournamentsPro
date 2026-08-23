const mysql = require('mysql2/promise');

async function main() {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'tournamentspro' });
    const compId = 'comp-1785370537096';
    const orgId = 'org-1785364183292';
    const gameSlug = 'eafc26';
    
    console.log('Testing query 1 (strict INNER JOIN):');
    const [q1] = await conn.query(`
      SELECT c.*, o.name as org_name, o.logo_url as org_logo, o.banner_url as org_banner 
      FROM competitions c 
      JOIN organizations o ON c.organization_id = o.id 
      WHERE c.id = ? AND c.organization_id = ? AND c.game_slug = ? AND c.status != 'Borrador'
    `, [compId, orgId, gameSlug]);
    console.log('Q1 Result:', q1);

    console.log('\nTesting query 2 (LEFT JOIN with organizer_id fallback):');
    const [q2] = await conn.query(`
      SELECT c.*, 
             COALESCE(o.name, u_org.name, 'Organización Oficial') as org_name, 
             COALESCE(o.logo_url, u_org.logo_url) as org_logo, 
             COALESCE(o.banner_url, u_org.banner_url) as org_banner 
      FROM competitions c 
      LEFT JOIN users u ON c.organizer_id = u.id
      LEFT JOIN organizations o ON c.organization_id = o.id 
      LEFT JOIN organizations u_org ON u.organization_id = u_org.id
      WHERE (c.id = ? OR c.id LIKE ?) 
        AND (c.organization_id = ? OR u.organization_id = ? OR ? = 'all')
        AND c.game_slug = ?
    `, [compId, `${compId}%`, orgId, orgId, orgId, gameSlug]);
    console.log('Q2 Result:', q2);

    await conn.end();
  } catch(e) {
    console.error('DB Error:', e.message);
  }
}

main();
