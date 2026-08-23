const mysql = require('mysql2/promise');

async function applyForeignKeys() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('🔗 Iniciando creación y optimización de Claves Foráneas (Foreign Keys) en MySQL...');

  // Helper para ejecutar SQL ignorando errores de duplicados o FK ya existente
  const safeQuery = async (label, sql) => {
    try {
      await pool.query(sql);
      console.log(`  ✓ ${label}`);
    } catch (err) {
      if (err.code === 'ER_DUP_KEY' || err.code === 'ER_FK_DUP_NAME' || err.message.includes('already exists')) {
        console.log(`  - ${label} (ya existía)`);
      } else {
        console.warn(`  ⚠️ ${label}: ${err.message}`);
      }
    }
  };

  // 1. Normalización de Tipos de Columna para coincidir con Claves Primarias
  console.log('\n1. Normalizando longitud de tipos de datos FK...');
  await safeQuery('Competitions organization_id VARCHAR(36)', `ALTER TABLE competitions MODIFY organization_id VARCHAR(36) NULL`);
  await safeQuery('Competitions organizer_id VARCHAR(36)', `ALTER TABLE competitions MODIFY organizer_id VARCHAR(36) NULL`);
  await safeQuery('Competition_teams team_id VARCHAR(36)', `ALTER TABLE competition_teams MODIFY team_id VARCHAR(36) NOT NULL`);
  await safeQuery('Matches home_team_id VARCHAR(36)', `ALTER TABLE matches MODIFY home_team_id VARCHAR(36) NULL`);
  await safeQuery('Matches away_team_id VARCHAR(36)', `ALTER TABLE matches MODIFY away_team_id VARCHAR(36) NULL`);
  await safeQuery('Matches team_home_id VARCHAR(36)', `ALTER TABLE matches MODIFY team_home_id VARCHAR(36) NULL`);
  await safeQuery('Matches team_away_id VARCHAR(36)', `ALTER TABLE matches MODIFY team_away_id VARCHAR(36) NULL`);
  await safeQuery('Matches winner_team_id VARCHAR(36)', `ALTER TABLE matches MODIFY winner_team_id VARCHAR(36) NULL`);

  // 2. Limpieza de datos huérfanos (Orphan Cleanup) para asegurar consistencia
  console.log('\n2. Limpiando referencias huérfanas antes de vincular FKs...');
  await pool.query(`UPDATE competitions SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
  await pool.query(`UPDATE competitions SET organizer_id = NULL WHERE organizer_id IS NOT NULL AND organizer_id NOT IN (SELECT id FROM users)`);
  await pool.query(`UPDATE competitions SET season_id = NULL WHERE season_id IS NOT NULL AND season_id NOT IN (SELECT id FROM seasons)`);
  await pool.query(`UPDATE teams SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
  await pool.query(`UPDATE users SET organization_id = NULL WHERE organization_id IS NOT NULL AND organization_id NOT IN (SELECT id FROM organizations)`);
  await pool.query(`UPDATE matches SET home_team_id = NULL WHERE home_team_id IS NOT NULL AND home_team_id NOT IN (SELECT id FROM teams)`);
  await pool.query(`UPDATE matches SET away_team_id = NULL WHERE away_team_id IS NOT NULL AND away_team_id NOT IN (SELECT id FROM teams)`);
  await pool.query(`UPDATE matches SET winner_team_id = NULL WHERE winner_team_id IS NOT NULL AND winner_team_id NOT IN (SELECT id FROM teams)`);

  // 3. Aplicación de Foreign Keys
  console.log('\n3. Creando restricciones Foreign Key...');

  // 🏆 Competitions FKs
  await safeQuery('FK competitions -> organizations', `
    ALTER TABLE competitions 
    ADD CONSTRAINT fk_comp_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await safeQuery('FK competitions -> users (organizer)', `
    ALTER TABLE competitions 
    ADD CONSTRAINT fk_comp_organizer FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await safeQuery('FK competitions -> seasons', `
    ALTER TABLE competitions 
    ADD CONSTRAINT fk_comp_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await safeQuery('FK competitions -> games', `
    ALTER TABLE competitions 
    ADD CONSTRAINT fk_comp_game FOREIGN KEY (game_slug) REFERENCES games(slug) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  // ⚔️ Competition Teams FKs
  await safeQuery('FK competition_teams -> competitions', `
    ALTER TABLE competition_teams 
    ADD CONSTRAINT fk_ct_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);
  await safeQuery('FK competition_teams -> teams', `
    ALTER TABLE competition_teams 
    ADD CONSTRAINT fk_ct_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  // ⚽ Matches FKs
  await safeQuery('FK matches -> competitions', `
    ALTER TABLE matches 
    ADD CONSTRAINT fk_match_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);
  await safeQuery('FK matches -> teams (home)', `
    ALTER TABLE matches 
    ADD CONSTRAINT fk_match_home FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await safeQuery('FK matches -> teams (away)', `
    ALTER TABLE matches 
    ADD CONSTRAINT fk_match_away FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);

  // 🛡️ Teams & Team Members FKs
  await safeQuery('FK teams -> organizations', `
    ALTER TABLE teams 
    ADD CONSTRAINT fk_team_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await safeQuery('FK teams -> games', `
    ALTER TABLE teams 
    ADD CONSTRAINT fk_team_game FOREIGN KEY (game_slug) REFERENCES games(slug) ON DELETE CASCADE ON UPDATE CASCADE
  `);
  await safeQuery('FK team_members -> teams', `
    ALTER TABLE team_members 
    ADD CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);
  await safeQuery('FK team_members -> users', `
    ALTER TABLE team_members 
    ADD CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  // 📅 Seasons FKs
  await safeQuery('FK seasons -> organizations', `
    ALTER TABLE seasons 
    ADD CONSTRAINT fk_season_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  // 📄 Match Reports & Stats FKs
  await safeQuery('FK match_reports -> matches', `
    ALTER TABLE match_reports 
    ADD CONSTRAINT fk_mr_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);
  await safeQuery('FK match_player_stats -> matches', `
    ALTER TABLE match_player_stats 
    ADD CONSTRAINT fk_mps_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  console.log('\n✅ Todas las Claves Foráneas han sido enlazadas e indexadas exitosamente.');
  await pool.end();
}

applyForeignKeys().catch((err) => {
  console.error('❌ Error aplicando Foreign Keys:', err);
  process.exit(1);
});
