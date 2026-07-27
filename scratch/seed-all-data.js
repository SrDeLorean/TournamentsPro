const mysql = require('mysql2/promise');

async function seedAll() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tournamentspro'
  });

  try {
    console.log('🌱 Cleaning previous seed data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    try { await conn.query('ALTER TABLE tournaments ADD COLUMN organization_id VARCHAR(36) NULL'); } catch(e){}
    try { await conn.query('ALTER TABLE tournaments ADD COLUMN season_id VARCHAR(36) NULL'); } catch(e){}
    try { await conn.query('ALTER TABLE tournaments ADD COLUMN format VARCHAR(50) DEFAULT "LIGA"'); } catch(e){}
    try { await conn.query('ALTER TABLE tournaments ADD COLUMN groups_count INT DEFAULT 1'); } catch(e){}
    try { await conn.query('ALTER TABLE tournaments ADD COLUMN qualifiers_per_group INT DEFAULT 2'); } catch(e){}
    await conn.query('TRUNCATE TABLE matches');
    await conn.query('TRUNCATE TABLE tournament_teams');
    await conn.query('TRUNCATE TABLE tournaments');
    await conn.query('TRUNCATE TABLE seasons');
    await conn.query('TRUNCATE TABLE team_members');
    await conn.query('TRUNCATE TABLE teams');
    await conn.query('TRUNCATE TABLE organizations');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('1️⃣ Seeding Users with roles & statuses...');
    // Roles: Administrador, Organizador, Jugador
    // Statuses: Activo, Inactivo, Suspendido, Baneado, Pendiente_Verificacion
    const users = [
      ['usr-admin', 'Admin General', 'admin@tournamentspro.com', 'AdminPro', 'Administrador', 'eafc26', 'DFC', 99, 'Activo', 0, null, null],
      ['usr-org1', 'Carlos Organizador', 'org@sanlorenzo.com', 'OrgCarlos', 'Organizador', 'eafc26', 'MCO', 90, 'Activo', 0, null, 'org-1'],
      ['usr-org2', 'Elena Kru Manager', 'org@kruesports.gg', 'ElenaKRU', 'Organizador', 'valorant', 'Duelista', 92, 'Activo', 0, null, 'org-2'],
      ['usr-cap1', 'Sebastian DeLorean', 'srdelorean@tournamentspro.com', 'SrDeLorean', 'Jugador', 'eafc26', 'DC', 94, 'Activo', 0, null, null],
      ['usr-cap2', 'Mateo Capitán FC', 'mateo@sangrenueva.com', 'MateoPro', 'Jugador', 'eafc26', 'DFC', 88, 'Activo', 0, null, null],
      ['usr-play3', 'Lucas AWPer', 'lucas@csgo.com', 'LucasAWP', 'Jugador', 'csgo', 'AWPer', 91, 'Activo', 0, null, null],
      ['usr-banned1', 'Usuario Infracción', 'banned@cheater.com', 'Cheater99', 'Jugador', 'valorant', 'Iniciador', 70, 'Baneado', 1, 'Uso de hacks no autorizados', null],
      ['usr-pend1', 'Rookie En Espera', 'rookie@gmail.com', 'Rookie2026', 'Jugador', 'eafc26', 'LD', 75, 'Pendiente_Verificacion', 0, null, null],
    ];

    for (const u of users) {
      await conn.query(
        `INSERT INTO users (id, name, email, gamertag, role, primary_game_slug, position, rating, status, is_banned, ban_reason, organization_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        u
      );
    }

    console.log('2️⃣ Seeding Organizations & allowed games...');
    const orgs = [
      ['org-1', 'San Lorenzo eSports', 'SL', 'usr-org1', '["eafc26", "valorant", "csgo"]', 'Activa'],
      ['org-2', 'KRÜ eSports Club', 'KRU', 'usr-org2', '["valorant", "lol"]', 'Activa'],
    ];

    for (const o of orgs) {
      await conn.query(
        `INSERT INTO organizations (id, name, tag, owner_id, allowed_games, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        o
      );
    }

    console.log('3️⃣ Seeding Teams & Squads...');
    const teams = [
      ['team-sl-eafc', 'San Lorenzo FC', 'SLFC', 'eafc26', 'org-1', 'usr-cap1', 'SrDeLorean', 'CROSSPLAY', 11, 22, '#00FF87', 'SLFC', 'Escuadra oficial de EA FC 26', 'Activo', 0, null],
      ['team-sangre', 'Sangre Nueva FC', 'SNFC', 'eafc26', 'org-1', 'usr-cap2', 'MateoPro', 'CROSSPLAY', 11, 22, '#00F0FF', 'SNFC', 'Club histórico de la liga', 'Activo', 0, null],
      ['team-kru-val', 'KRÜ Valorant', 'KRU', 'valorant', 'org-2', 'usr-org2', 'ElenaKRU', 'PC', 5, 10, '#FF4654', 'KRU', 'Escuadra profesional de Valorant', 'Activo', 0, null],
      ['team-banned-club', 'Cheaters eSports', 'CHTR', 'valorant', 'org-2', 'usr-banned1', 'Cheater99', 'PC', 5, 10, '#FF0000', 'CHTR', 'Club en sanción disciplinaria', 'Baneado', 1, 'Conducta antideportiva'],
    ];

    for (const t of teams) {
      await conn.query(
        `INSERT INTO teams (id, name, tag, game_slug, organization_id, captain_id, captain_name, platform, members_count, max_members, color, logo_text, description, status, is_banned, ban_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t
      );
    }

    console.log('4️⃣ Seeding Seasons & Tournaments...');
    await conn.query(
      `INSERT INTO seasons (id, name, organization_id, start_date, end_date, status)
       VALUES ('season-2026-1', 'Temporada Apertura 2026', 'org-1', '2026-08-01', '2026-12-15', 'Activa')`
    );

    const tournaments = [
      ['tourn-eafc-liga', 'Liga EA SPORTS FC 26 Apertura', 'season-2026-1', 'org-1', 'usr-org1', 'eafc26', 'LIGA', 1, 0, 'En_Juego'],
      ['tourn-val-masters', 'Copa VALORANT Champions Masters', 'season-2026-1', 'org-2', 'usr-org2', 'valorant', 'GRUPOS_PLAYOFFS', 2, 2, 'Inscripciones_Abiertas'],
    ];

    for (const tr of tournaments) {
      await conn.query(
        `INSERT INTO tournaments (id, name, season_id, organization_id, organizer_id, game_slug, format, groups_count, qualifiers_per_group, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tr
      );
    }

    console.log('5️⃣ Associating Teams to Tournaments...');
    await conn.query(`INSERT INTO tournament_teams (id, tournament_id, team_id) VALUES ('tt-1', 'tourn-eafc-liga', 'team-sl-eafc')`);
    await conn.query(`INSERT INTO tournament_teams (id, tournament_id, team_id) VALUES ('tt-2', 'tourn-eafc-liga', 'team-sangre')`);

    console.log('6️⃣ Seeding Matches in various status states...');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const matches = [
      ['match-1', 'tourn-eafc-liga', 'season-2026-1', 1, 1, 'team-sl-eafc', 'team-sangre', 2, 1, now, 'TERMINADO', 'Grupo A', null, 'team-sl-eafc', 2, 1, null, 'usr-cap1'],
      ['match-2', 'tourn-eafc-liga', 'season-2026-1', 1, 2, 'team-sangre', 'team-sl-eafc', null, null, now, 'POR_REVISAR', 'Grupo A', null, null, 3, 2, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 'usr-cap2'],
      ['match-3', 'tourn-eafc-liga', 'season-2026-1', 2, 3, 'team-sl-eafc', 'team-sangre', null, null, now, 'PENDIENTE', 'Grupo A', null, null, null, null, null, null],
      ['match-playoff-1', 'tourn-eafc-liga', 'season-2026-1', 3, 4, null, null, null, null, now, 'TBD', 'Gran Final', null, null, null, null, null, null],
    ];

    for (const m of matches) {
      await conn.query(
        `INSERT INTO matches (id, tournament_id, season_id, round, matchday, team_home_id, team_away_id, score_home, score_away, scheduled_at, status, group_name, next_match_id, winner_team_id, reported_score_home, reported_score_away, proof_url, reported_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m
      );
    }

    console.log('✅ ALL SEED DATA SUCCESSFULLY IMPORTED INTO MYSQL!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await conn.end();
  }
}

seedAll();
