const mysql = require('mysql2/promise');

async function migrateDatabase() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('🚀 Iniciando optimización de la Base de Datos MySQL (tournamentspro)...');

  // 1. Modificar tabla `competitions` para agregar campos requeridos y transfer_market_mode
  console.log('📦 Optimizando la tabla `competitions`...');
  await pool.query(`
    ALTER TABLE competitions
    ADD COLUMN IF NOT EXISTS organization_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS season_id VARCHAR(36) NULL,
    ADD COLUMN IF NOT EXISTS prize_pool VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS transfer_market_mode ENUM('ABIERTO', 'CERRADO', 'SIN_MERCADO') DEFAULT 'ABIERTO'
  `).catch(err => console.log('Notice competitions alter:', err.message));

  // 2. Optimizar tabla `matches`
  console.log('⚽ Optimizando la tabla `matches`...');
  await pool.query(`
    ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS competition_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS home_team_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS away_team_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS home_team_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS away_team_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS scheduled_time DATETIME NULL,
    ADD COLUMN IF NOT EXISTS stage ENUM('GROUP', 'PLAYOFF') DEFAULT 'GROUP',
    ADD COLUMN IF NOT EXISTS round_name VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS next_match_slot ENUM('HOME', 'AWAY') NULL
  `).catch(err => console.log('Notice matches alter:', err.message));

  // 3. Crear tabla `match_reports` para el acta de partidos
  console.log('📄 Creando / verificando tabla `match_reports`...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_reports (
      id VARCHAR(36) PRIMARY KEY,
      match_id VARCHAR(150) NOT NULL,
      reported_by_user_id VARCHAR(36) NOT NULL,
      score_home INT NOT NULL,
      score_away INT NOT NULL,
      proof_url VARCHAR(255) NULL,
      status ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_report_match (match_id),
      INDEX idx_report_user (reported_by_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Crear tabla `match_player_stats` para estadísticas de rendimiento por jugador
  console.log('📊 Creando / verificando tabla `match_player_stats`...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_player_stats (
      id VARCHAR(36) PRIMARY KEY,
      match_id VARCHAR(150) NOT NULL,
      team_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      goals INT DEFAULT 0,
      assists INT DEFAULT 0,
      yellow_cards INT DEFAULT 0,
      red_cards INT DEFAULT 0,
      rating DECIMAL(3,1) DEFAULT 6.0,
      is_mvp TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY idx_match_player (match_id, user_id),
      INDEX idx_stats_match (match_id),
      INDEX idx_stats_team (team_id),
      INDEX idx_stats_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Actualizar `transfer_applications` para soportar Traspasos Extraordinarios (Aprobación por Organizador)
  console.log('🔄 Optimizando tabla `transfer_applications` para Traspasos Extraordinarios...');
  await pool.query(`
    ALTER TABLE transfer_applications
    ADD COLUMN IF NOT EXISTS is_extraordinary TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS organizer_approval_status ENUM('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR') DEFAULT 'NINGUNO'
  `).catch(err => console.log('Notice transfer_applications alter:', err.message));

  // 6. Eliminar tabla obsoleta `tournament_teams` de manera segura
  console.log('🧹 Limpiando tabla obsoleta `tournament_teams`...');
  await pool.query(`DROP TABLE IF EXISTS tournament_teams`);

  console.log('✅ Base de datos optimizada exitosamente.');
  await pool.end();
}

migrateDatabase().catch((err) => {
  console.error('❌ Error optimizando BD:', err);
  process.exit(1);
});
