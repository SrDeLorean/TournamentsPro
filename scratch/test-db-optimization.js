const mysql = require('mysql2/promise');

async function testDatabaseIntegrity() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
  });

  console.log('🧪 Verificando integridad de la BD optimizada...');

  // Check columns in competitions
  const [colsComp] = await pool.query('DESCRIBE competitions');
  const compFields = colsComp.map((c) => c.Field);
  console.log('Competitions fields:', compFields.filter(f => ['organization_id', 'season_id', 'prize_pool', 'transfer_market_mode'].includes(f)));

  // Check columns in transfer_applications
  const [colsTransfers] = await pool.query('DESCRIBE transfer_applications');
  const transferFields = colsTransfers.map((c) => c.Field);
  console.log('Transfer applications fields:', transferFields.filter(f => ['is_extraordinary', 'organizer_approval_status'].includes(f)));

  // Check match_reports and match_player_stats
  const [reports] = await pool.query('SHOW TABLES LIKE "match_reports"');
  const [stats] = await pool.query('SHOW TABLES LIKE "match_player_stats"');
  console.log('Tabla match_reports existe:', reports.length > 0);
  console.log('Tabla match_player_stats existe:', stats.length > 0);

  await pool.end();
}

testDatabaseIntegrity().catch(console.error);
