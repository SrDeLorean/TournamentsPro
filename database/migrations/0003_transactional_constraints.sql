-- Columnas requeridas por las operaciones transaccionales y sus claves de idempotencia.

ALTER TABLE `team_members`
  ADD COLUMN IF NOT EXISTS `organization_name` VARCHAR(150) NULL AFTER `user_id`,
  MODIFY COLUMN `role_in_team` ENUM('Capitan', 'Capitán', 'Encargado', 'Jugador', 'DT / Analyst', 'Manager', 'Co-Capitán') NOT NULL DEFAULT 'Jugador',
  ADD INDEX IF NOT EXISTS `idx_tm_user` (`user_id`),
  ADD INDEX IF NOT EXISTS `idx_tm_team` (`team_id`);

ALTER TABLE `competitions`
  ADD COLUMN IF NOT EXISTS `format` VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS `match_mode` ENUM('PartidoUnico', 'IdaVuelta') NOT NULL DEFAULT 'PartidoUnico',
  ADD COLUMN IF NOT EXISTS `group_count` INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `qualifiers_per_group` INT NOT NULL DEFAULT 2;

ALTER TABLE `transfer_offers`
  MODIFY COLUMN `status` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO', 'CONCLUIDO') NOT NULL DEFAULT 'PENDIENTE',
  ADD INDEX IF NOT EXISTS `idx_to_player_status` (`player_user_id`, `status`),
  ADD INDEX IF NOT EXISTS `idx_to_team_status` (`team_id`, `status`);

ALTER TABLE `transfer_applications`
  ADD INDEX IF NOT EXISTS `idx_ta_process_state` (`id`, `status`, `organizer_approval_status`);

ALTER TABLE `competition_teams`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_comp_team` (`competition_id`, `team_id`);

ALTER TABLE `match_reports`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_report_match` (`match_id`);

ALTER TABLE `match_player_stats`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_stats_match_user` (`match_id`, `user_id`);

ALTER TABLE `matches`
  ADD INDEX IF NOT EXISTS `idx_matches_comp_status` (`competition_id`, `status`),
  ADD INDEX IF NOT EXISTS `idx_matches_next` (`next_match_id`);
