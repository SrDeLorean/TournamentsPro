-- Compatibilidad con columnas y estados que ya utiliza el runtime.

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `banned_at` DATETIME NULL AFTER `ban_reason`;

ALTER TABLE `teams`
  ADD COLUMN IF NOT EXISTS `banned_at` DATETIME NULL AFTER `ban_reason`;

ALTER TABLE `competitions`
  MODIFY COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'Borrador';

ALTER TABLE `matches`
  ADD COLUMN IF NOT EXISTS `round` INT NULL AFTER `competition_id`,
  ADD COLUMN IF NOT EXISTS `home_team_tag` VARCHAR(10) NULL AFTER `home_team_name`,
  ADD COLUMN IF NOT EXISTS `away_team_tag` VARCHAR(10) NULL AFTER `away_team_name`,
  MODIFY COLUMN `scheduled_time` TIME NULL,
  MODIFY COLUMN `status` ENUM('PROGRAMADO', 'PENDIENTE', 'EN_CURSO', 'POR_REVISAR', 'TERMINADO', 'FINALIZADO', 'CANCELADO', 'DISPUTADO') NOT NULL DEFAULT 'PENDIENTE';
