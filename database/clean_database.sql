-- ========================================================================
-- Script de Limpieza y Purga Integral de Base de Datos - TournamentsPro
-- ========================================================================
-- Este script elimina de forma segura y completa todos los datos dinámicos
-- de usuarios, equipos, organizaciones, competencias, partidos y actividad,
-- preservando intacta la infraestructura vital del sistema (games, reglamentos
-- y el Administrador principal).
--
-- Compatible con MySQL 8.x / MariaDB / phpMyAdmin (Hostinger, XAMPP, etc.)
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tablas de Comunicación y Notificaciones
TRUNCATE TABLE `chat_messages`;
DELETE FROM `chat_threads` WHERE `id` NOT IN ('ct-admin-broadcast', 'ct-org-support');

-- 2. Tablas de Partidos, Estadísticas y Reportes
TRUNCATE TABLE `match_player_stats`;
TRUNCATE TABLE `match_reports`;
TRUNCATE TABLE `matches`;

-- 3. Tablas de Competencias, Roster y Temporadas
TRUNCATE TABLE `tournament_rosters`;
TRUNCATE TABLE `competition_teams`;
TRUNCATE TABLE `transfer_windows`;
TRUNCATE TABLE `competitions`;
TRUNCATE TABLE `seasons`;

-- 4. Mercado de Fichajes y Postulaciones
TRUNCATE TABLE `transfer_market_posts`;
TRUNCATE TABLE `transfer_offers`;
TRUNCATE TABLE `transfer_applications`;
TRUNCATE TABLE `transfer_history_logs`;

-- 5. Equipos, Miembros y Vacantes
TRUNCATE TABLE `team_vacancies`;
TRUNCATE TABLE `team_members`;
TRUNCATE TABLE `teams`;

-- 6. Organizaciones
TRUNCATE TABLE `organizations`;

-- 7. Seguridad y Sesiones
TRUNCATE TABLE `auth_sessions`;
TRUNCATE TABLE `security_rate_limits`;
TRUNCATE TABLE `security_audit_log`;

-- 8. Limpieza de Usuarios (conserva el Administrador principal)
DELETE FROM `users` WHERE `id` != 'admin-1';
UPDATE `users` SET `organization_id` = NULL WHERE `id` = 'admin-1';

-- 9. Asegurar hilos oficiales del sistema
INSERT IGNORE INTO `chat_threads` (
  `id`, `channel_type`, `game_slug`, `title`, `participant_a_id`, `participant_a_name`, `participant_a_role`,
  `participant_b_id`, `participant_b_name`, `participant_b_role`, `last_message_text`
) VALUES
  ('ct-admin-broadcast', 'ANUNCIO_ADMIN', 'eafc26', 'Anuncios Globales de Administración', 'admin-1', 'Administrador Principal', 'Administrador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Canal oficial de boletines, comunicados de sanciones y actualizaciones del sistema.'),
  ('ct-org-support', 'SOPORTE_ORGANIZADOR', 'eafc26', 'Canal Oficial de Organizadores & Arbitraje', 'admin-1', 'Administrador Principal', 'Administrador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Mesa de ayuda directa habilitada para consultas de torneo y reporte de partidos.');

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================================
-- Verificación final de registros
-- ========================================================================
SELECT 'users' AS tabla, COUNT(*) AS total FROM `users`
UNION ALL
SELECT 'organizations', COUNT(*) FROM `organizations`
UNION ALL
SELECT 'teams', COUNT(*) FROM `teams`
UNION ALL
SELECT 'competitions', COUNT(*) FROM `competitions`
UNION ALL
SELECT 'matches', COUNT(*) FROM `matches`
UNION ALL
SELECT 'games (preservada)', COUNT(*) FROM `games`;
