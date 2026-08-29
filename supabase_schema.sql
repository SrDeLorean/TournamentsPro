-- =============================================================================
-- TOURNAMENTSPRO - ESQUEMA OFICIAL DE BASE DE DATOS RELACIONAL (PostgreSQL / Supabase)
-- Versión 2.0 - Optimizado con índices, constraints y integridad referencial
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA: users (Atletas, Capitanes, Organizadores y Admins)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NULL, 
  google_id TEXT NULL UNIQUE,
  name TEXT NOT NULL,
  gamertag TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Jugador' CHECK (role IN ('Jugador', 'Capitan', 'Organizador', 'Administrador')),
  primary_game_slug TEXT NOT NULL DEFAULT 'eafc26',
  platform TEXT NOT NULL DEFAULT 'CROSSPLAY' CHECK (platform IN ('PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY')),
  position TEXT NOT NULL DEFAULT 'DFC',
  secondary_position TEXT NULL,
  rank_badge TEXT NULL DEFAULT 'División 1',
  rating DECIMAL(3,1) NOT NULL DEFAULT 9.0,
  status TEXT NOT NULL DEFAULT 'Activo',
  avatar_url TEXT NULL,
  organization_id TEXT NULL,
  is_banned INT NOT NULL DEFAULT 0,
  ban_reason TEXT NULL,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_users_org ON users (organization_id);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_game ON users (primary_game_slug);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_banned ON users (is_banned);

-- -----------------------------------------------------------------------------
-- 2. TABLA: organizations (Organizaciones Madre / Clubes Multidisciplina)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  logo_url TEXT NULL,
  banner_url TEXT NULL,
  description TEXT NULL,
  country TEXT DEFAULT 'Venezuela',
  allowed_games JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_org_owner ON organizations (owner_id);

ALTER TABLE users ADD CONSTRAINT fk_users_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE organizations ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 3. TABLA: games (Catálogo de Disciplinas eSports y Configuración Dinámica)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  team_size INT NOT NULL DEFAULT 11,
  max_roster_members INT NOT NULL DEFAULT 45,
  max_squad_cap INT NOT NULL DEFAULT 20,
  max_transfers_per_window INT NOT NULL DEFAULT 3,
  post_expiration_days INT NOT NULL DEFAULT 7,
  positions_json JSONB NULL,
  brand_color TEXT NOT NULL DEFAULT '#00F0FF',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (slug)
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: teams (Escuadras por Disciplina Específica)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  organization_id TEXT NULL,
  captain_id TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'CROSSPLAY' CHECK (platform IN ('PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY')),
  members_count INT NOT NULL DEFAULT 1,
  max_members INT NOT NULL DEFAULT 45,
  color TEXT NOT NULL DEFAULT '#00F0FF',
  logo_text TEXT NOT NULL DEFAULT 'TP',
  description TEXT NULL,
  vacant_positions JSONB NULL,
  logo_url TEXT NULL,
  banner_url TEXT NULL,
  status TEXT DEFAULT 'Activo',
  club_id_ea TEXT NULL,
  is_banned INT NOT NULL DEFAULT 0,
  ban_reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_team_name_per_game UNIQUE (name, game_slug),
  CONSTRAINT fk_teams_game FOREIGN KEY (game_slug) REFERENCES games (slug) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_teams_captain FOREIGN KEY (captain_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_teams_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_teams_game ON teams (game_slug);
CREATE INDEX idx_teams_org ON teams (organization_id);
CREATE INDEX idx_teams_captain ON teams (captain_id);
CREATE INDEX idx_teams_banned ON teams (is_banned);
CREATE INDEX idx_teams_status ON teams (status);

-- -----------------------------------------------------------------------------
-- 5. TABLA: team_members (Integrantes de Plantilla General de Club)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  jersey_number INT NULL,
  tactical_position TEXT NOT NULL,
  role_in_team TEXT NOT NULL DEFAULT 'Jugador' CHECK (role_in_team IN ('Capitan', 'Jugador', 'DT / Analyst')),
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_team_user UNIQUE (team_id, user_id),
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_tm_user ON team_members (user_id);
CREATE INDEX idx_tm_team ON team_members (team_id);

-- -----------------------------------------------------------------------------
-- 6. TABLA: team_vacancies (Reclutamiento de Posiciones Abiertas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_vacancies (
  id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  position_required TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABIERTA' CHECK (status IN ('ABIERTA', 'CERRADA')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_vac_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_vac_team ON team_vacancies (team_id);
CREATE INDEX idx_vac_game ON team_vacancies (game_slug);
CREATE INDEX idx_vac_status ON team_vacancies (status);

-- -----------------------------------------------------------------------------
-- 7. TABLA: seasons (Temporadas por Organización)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  organization_id TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  status TEXT NOT NULL DEFAULT 'Planificada' CHECK (status IN ('Planificada', 'Activa', 'Finalizada', 'Archivada')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_seasons_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_seasons_org ON seasons (organization_id);
CREATE INDEX idx_seasons_status ON seasons (status);

-- -----------------------------------------------------------------------------
-- 8. TABLA: competitions (Torneos y Competencias Oficiales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitions (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organization_id TEXT NULL,
  season_id TEXT NULL,
  prize_pool TEXT NULL,
  transfer_market_mode TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (transfer_market_mode IN ('ABIERTO', 'CERRADO', 'SIN_MERCADO')),
  mode_format TEXT NOT NULL DEFAULT '11v11',
  status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Activo', 'Finalizado', 'Deshabilitado')),
  fecha_limite_inscripcion TIMESTAMPTZ NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_termino TIMESTAMPTZ NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comp_game FOREIGN KEY (game_slug) REFERENCES games (slug) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comp_organizer FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comp_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_comp_season FOREIGN KEY (season_id) REFERENCES seasons (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_comp_game ON competitions (game_slug);
CREATE INDEX idx_comp_organizer ON competitions (organizer_id);
CREATE INDEX idx_comp_org ON competitions (organization_id);
CREATE INDEX idx_comp_season ON competitions (season_id);
CREATE INDEX idx_comp_status ON competitions (status);
CREATE INDEX idx_comp_dates ON competitions (fecha_inicio, fecha_termino);

-- -----------------------------------------------------------------------------
-- 9. TABLA: competition_teams (Equipos Inscritos en una Competencia)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competition_teams (
  id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_tag TEXT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'CONFIRMADO' CHECK (status IN ('INSCRITO', 'CONFIRMADO', 'RETIRADO')),
  PRIMARY KEY (id),
  CONSTRAINT uk_comp_team UNIQUE (competition_id, team_id),
  CONSTRAINT fk_ct_comp FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ct_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_ct_team ON competition_teams (team_id);
CREATE INDEX idx_ct_status ON competition_teams (status);

-- -----------------------------------------------------------------------------
-- 10. TABLA: tournament_rosters (Plantilla Oficial Inscrita por Torneo Específico)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_rosters (
  id TEXT NOT NULL,
  tournament_id TEXT NOT NULL, 
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tactical_position TEXT NOT NULL,
  roster_role TEXT NOT NULL DEFAULT 'TITULAR' CHECK (roster_role IN ('TITULAR', 'SUPLENTE', 'RESERVA')),
  registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_tourn_team_user UNIQUE (tournament_id, team_id, user_id),
  CONSTRAINT fk_tr_tourn FOREIGN KEY (tournament_id) REFERENCES competitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tr_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_tr_tourn ON tournament_rosters (tournament_id);
CREATE INDEX idx_tr_team ON tournament_rosters (team_id);
CREATE INDEX idx_tr_user ON tournament_rosters (user_id);

-- -----------------------------------------------------------------------------
-- 11. TABLA: matches (Partidos / Encuentros)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  matchday_number INT NOT NULL DEFAULT 1,
  matchday INT NOT NULL DEFAULT 1,
  stage TEXT NOT NULL DEFAULT 'GROUP' CHECK (stage IN ('GROUP', 'PLAYOFF', 'FINAL')),
  group_name TEXT NULL,
  round_name TEXT NULL,
  next_match_id TEXT NULL,
  next_match_slot TEXT NULL CHECK (next_match_slot IN ('HOME', 'AWAY', 'VUELTA_TARGET')),
  home_team_id TEXT NULL,
  away_team_id TEXT NULL,
  team_home_id TEXT NULL,
  team_away_id TEXT NULL,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  score_home INT NULL,
  score_away INT NULL,
  reported_score_home INT NULL,
  reported_score_away INT NULL,
  winner_team_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'EN_CURSO', 'POR_REVISAR', 'TERMINADO', 'FINALIZADO', 'CANCELADO', 'DISPUTADO')),
  scheduled_time TIMESTAMPTZ NULL,
  scheduled_at TIMESTAMPTZ NULL,
  proof_url TEXT NULL,
  reported_by_user_id TEXT NULL,
  match_report_id TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_matches_tourn FOREIGN KEY (tournament_id) REFERENCES competitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_matches_comp FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_matches_home FOREIGN KEY (home_team_id) REFERENCES teams (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_matches_away FOREIGN KEY (away_team_id) REFERENCES teams (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_matches_next FOREIGN KEY (next_match_id) REFERENCES matches (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_matches_tourn ON matches (tournament_id);
CREATE INDEX idx_matches_comp ON matches (competition_id);
CREATE INDEX idx_matches_matchday ON matches (matchday_number);
CREATE INDEX idx_matches_stage ON matches (stage);
CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_matches_home ON matches (home_team_id);
CREATE INDEX idx_matches_away ON matches (away_team_id);
CREATE INDEX idx_matches_scheduled ON matches (scheduled_at);
CREATE INDEX idx_matches_next ON matches (next_match_id);

-- -----------------------------------------------------------------------------
-- 12. TABLA: match_reports (Actas de Partido)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_reports (
  id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  reported_by_user_id TEXT NOT NULL,
  score_home INT NOT NULL,
  score_away INT NOT NULL,
  proof_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  reviewed_by TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_report_match UNIQUE (match_id),
  CONSTRAINT fk_report_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reported_by_user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_report_reporter ON match_reports (reported_by_user_id);
CREATE INDEX idx_report_status ON match_reports (status);

-- -----------------------------------------------------------------------------
-- 13. TABLA: match_player_stats (Estadísticas de Jugadores por Partido)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_player_stats (
  id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  goals INT NOT NULL DEFAULT 0,
  assists INT NOT NULL DEFAULT 0,
  yellow_cards INT NOT NULL DEFAULT 0,
  red_cards INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 6.0,
  is_mvp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_stats_match_user UNIQUE (match_id, user_id),
  CONSTRAINT fk_stats_match FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_stats_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_stats_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_stats_match ON match_player_stats (match_id);
CREATE INDEX idx_stats_team ON match_player_stats (team_id);
CREATE INDEX idx_stats_user ON match_player_stats (user_id);

-- -----------------------------------------------------------------------------
-- 14. TABLA: transfer_applications (Mercado de Traspasos & Solicitudes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_applications (
  id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  applicant_user_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  position TEXT NOT NULL,
  pitch_message TEXT NULL,
  application_type TEXT NOT NULL DEFAULT 'POSTULACION_JUGADOR' CHECK (application_type IN ('POSTULACION_JUGADOR', 'OFERTA_CLUB')),
  status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'ACEPTADO', 'RECHAZADO')),
  is_extraordinary INT NOT NULL DEFAULT 0,
  organizer_approval_status TEXT NOT NULL DEFAULT 'NINGUNO' CHECK (organizer_approval_status IN ('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR')),
  processed_by TEXT NULL,
  processed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ta_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ta_user FOREIGN KEY (applicant_user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_ta_team ON transfer_applications (team_id);
CREATE INDEX idx_ta_user ON transfer_applications (applicant_user_id);
CREATE INDEX idx_ta_game ON transfer_applications (game_slug);
CREATE INDEX idx_ta_status ON transfer_applications (status);
CREATE INDEX idx_ta_extraordinary ON transfer_applications (is_extraordinary);
CREATE INDEX idx_ta_org_status ON transfer_applications (organizer_approval_status);

-- -----------------------------------------------------------------------------
-- 15. TABLA: conversations & messages (Centro de Mensajería Directa)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT NOT NULL,
  participant1_id TEXT NOT NULL,
  participant2_id TEXT NOT NULL,
  game_slug TEXT NOT NULL DEFAULT 'eafc26',
  topic TEXT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_conv_participants UNIQUE (participant1_id, participant2_id, game_slug),
  CONSTRAINT fk_conv_p1 FOREIGN KEY (participant1_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_conv_p2 FOREIGN KEY (participant2_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_conv_p1 ON conversations (participant1_id);
CREATE INDEX idx_conv_p2 ON conversations (participant2_id);
CREATE INDEX idx_conv_game ON conversations (game_slug);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  is_read INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_msg_conv ON messages (conversation_id);
CREATE INDEX idx_msg_sender ON messages (sender_id);
CREATE INDEX idx_msg_read ON messages (is_read);

-- -----------------------------------------------------------------------------
-- 17. TABLA: transfer_windows (Ventanas de Fichaje por Competencia)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_windows (
  id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (status IN ('ABIERTO', 'CERRADO', 'EXTRAORDINARIO')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tw_comp FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_tw_comp ON transfer_windows (competition_id);
CREATE INDEX idx_tw_status ON transfer_windows (status);

-- -----------------------------------------------------------------------------
-- 18. TABLA: transfer_offers (Ofertas de Contrato & Postulaciones)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_offers (
  id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  team_id TEXT NOT NULL,
  player_user_id TEXT NOT NULL,
  offered_by_user_id TEXT NOT NULL,
  position TEXT NOT NULL,
  pitch_message TEXT NULL,
  offer_type TEXT NOT NULL DEFAULT 'OFERTA_CLUB' CHECK (offer_type IN ('OFERTA_CLUB', 'POSTULACION_JUGADOR')),
  status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO')),
  is_extraordinary INT NOT NULL DEFAULT 0,
  organizer_approval_status TEXT NOT NULL DEFAULT 'NINGUNO' CHECK (organizer_approval_status IN ('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR')),
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_to_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_to_player FOREIGN KEY (player_user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_to_team ON transfer_offers (team_id);
CREATE INDEX idx_to_player ON transfer_offers (player_user_id);
CREATE INDEX idx_to_status ON transfer_offers (status);
CREATE INDEX idx_to_org_status ON transfer_offers (organizer_approval_status);

-- -----------------------------------------------------------------------------
-- 19. TABLA: transfer_history_logs (Historial de Fichajes para Auditoría)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_history_logs (
  id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  organization_id TEXT NULL,
  player_user_id TEXT NOT NULL,
  from_team_id TEXT NULL,
  from_team_name TEXT NULL,
  to_team_id TEXT NOT NULL,
  to_team_name TEXT NOT NULL,
  approved_by_user_id TEXT NOT NULL,
  transfer_type TEXT NOT NULL DEFAULT 'LIBRE' CHECK (transfer_type IN ('LIBRE', 'TRASPASO_DIRECTO', 'EXTRAORDINARIO')),
  signed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_thl_player FOREIGN KEY (player_user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_thl_to_team FOREIGN KEY (to_team_id) REFERENCES teams (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_thl_player ON transfer_history_logs (player_user_id);
CREATE INDEX idx_thl_org ON transfer_history_logs (organization_id);
CREATE INDEX idx_thl_to_team ON transfer_history_logs (to_team_id);

-- -----------------------------------------------------------------------------
-- 20. TABLA: transfer_market_posts (Publicaciones del Mercado de Traspasos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_market_posts (
  id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'JUGADOR_BUSCA_CLUB' CHECK (type IN ('JUGADOR_BUSCA_CLUB', 'CLUB_RECLUTA_JUGADOR')),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_gamertag TEXT NOT NULL,
  team_id TEXT NULL,
  team_name TEXT NULL,
  position TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'CROSSPLAY',
  status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'COMPLETADO', 'CADUCADO')),
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tmp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_tmp_game ON transfer_market_posts (game_slug);
CREATE INDEX idx_tmp_type ON transfer_market_posts (type);
CREATE INDEX idx_tmp_user ON transfer_market_posts (user_id);
CREATE INDEX idx_tmp_status ON transfer_market_posts (status);
CREATE INDEX idx_tmp_expires ON transfer_market_posts (expires_at);

-- -----------------------------------------------------------------------------
-- 21. TABLA: chat_threads (Hilos de Conversación eSports)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'DIRECTO' CHECK (channel_type IN ('DIRECTO', 'SQUAD_EQUIPO', 'SOPORTE_ORGANIZADOR', 'ANUNCIO_ADMIN')),
  game_slug TEXT NOT NULL DEFAULT 'eafc26',
  title TEXT NULL,
  participant_a_id TEXT NOT NULL,
  participant_a_name TEXT NOT NULL,
  participant_a_role TEXT NOT NULL DEFAULT 'Jugador',
  participant_b_id TEXT NOT NULL,
  participant_b_name TEXT NOT NULL,
  participant_b_role TEXT NOT NULL DEFAULT 'Jugador',
  last_message_text TEXT NULL,
  last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_ct_part_a ON chat_threads (participant_a_id);
CREATE INDEX idx_ct_part_b ON chat_threads (participant_b_id);
CREATE INDEX idx_ct_channel ON chat_threads (channel_type);
CREATE INDEX idx_ct_game ON chat_threads (game_slug);

-- -----------------------------------------------------------------------------
-- 22. TABLA: chat_messages (Mensajes de Conversación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'Jugador',
  message_text TEXT NOT NULL,
  is_read INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cm_thread FOREIGN KEY (thread_id) REFERENCES chat_threads (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_cm_thread ON chat_messages (thread_id);
CREATE INDEX idx_cm_sender ON chat_messages (sender_id);



-- -----------------------------------------------------------------------------
-- 23. TABLA: security_rate_limits (Rate Limiting)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_rate_limits (
  rate_key TEXT NOT NULL,
  action_name TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (rate_key, action_name)
);
CREATE INDEX idx_security_rate_limits_expires ON security_rate_limits (expires_at);

-- -----------------------------------------------------------------------------
-- 24. TABLA: auth_sessions (Control de Sesiones de Usuarios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  ip_hash TEXT NULL,
  user_agent_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id)
);
CREATE INDEX idx_auth_sessions_user_active ON auth_sessions (user_id, revoked_at, expires_at);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions (expires_at);

-- -----------------------------------------------------------------------------
-- 25. TABLA: security_audit_log (Registro de Auditoría de Seguridad)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_audit_log (
  id TEXT NOT NULL,
  request_id TEXT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NULL,
  organization_id TEXT NULL,
  outcome TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
  metadata_json JSONB NULL,
  ip_hash TEXT NULL,
  user_agent_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
CREATE INDEX idx_security_audit_actor ON security_audit_log (actor_user_id, created_at);
CREATE INDEX idx_security_audit_resource ON security_audit_log (resource_type, resource_id, created_at);
CREATE INDEX idx_security_audit_org ON security_audit_log (organization_id, created_at);

-- -----------------------------------------------------------------------------
-- 26. COLUMNAS ADICIONALES (MIGRACIONES)
-- -----------------------------------------------------------------------------
ALTER TABLE games ADD COLUMN IF NOT EXISTS stats_schema JSONB NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS ui_config JSONB NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS foto TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS biografia TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitch TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_profiles JSONB NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS founded_year TEXT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) NOT NULL DEFAULT 4.95;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS redes_sociales JSONB NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Activo';

ALTER TABLE teams ADD COLUMN IF NOT EXISTS redes_sociales JSONB NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS encargados_json JSONB NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ NULL;

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS format TEXT NULL;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS match_mode TEXT NOT NULL DEFAULT 'PartidoUnico';
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS group_count INT NULL;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS qualifiers_per_group INT NULL;

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS organization_name TEXT NULL;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_in_team_check;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS round INT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_tag TEXT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_tag TEXT NULL;


ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_status_check;

ALTER TABLE matches ALTER COLUMN scheduled_time TYPE TIME;
