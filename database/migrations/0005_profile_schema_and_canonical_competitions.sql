-- Completa las columnas consumidas por el runtime y evita cascadas destructivas
-- desde usuarios responsables. competition_id queda como fuente canónica para matches;
-- tournament_id se conserva sincronizado durante la transición por compatibilidad.

ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('Jugador', 'Capitan', 'Capitán', 'Organizador', 'Administrador') NOT NULL DEFAULT 'Jugador',
  ADD COLUMN IF NOT EXISTS `foto` TEXT NULL AFTER `avatar_url`,
  ADD COLUMN IF NOT EXISTS `banner_url` TEXT NULL AFTER `foto`,
  ADD COLUMN IF NOT EXISTS `biografia` TEXT NULL AFTER `banner_url`,
  ADD COLUMN IF NOT EXISTS `bio` TEXT NULL AFTER `biografia`,
  ADD COLUMN IF NOT EXISTS `country` VARCHAR(80) NULL AFTER `bio`,
  ADD COLUMN IF NOT EXISTS `birth_date` DATE NULL AFTER `country`,
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(50) NULL AFTER `birth_date`,
  ADD COLUMN IF NOT EXISTS `instagram` VARCHAR(255) NULL AFTER `phone`,
  ADD COLUMN IF NOT EXISTS `facebook` VARCHAR(255) NULL AFTER `instagram`,
  ADD COLUMN IF NOT EXISTS `twitch` VARCHAR(255) NULL AFTER `facebook`,
  ADD COLUMN IF NOT EXISTS `youtube` VARCHAR(255) NULL AFTER `twitch`,
  ADD COLUMN IF NOT EXISTS `tiktok` VARCHAR(255) NULL AFTER `youtube`,
  ADD COLUMN IF NOT EXISTS `discord` VARCHAR(255) NULL AFTER `tiktok`,
  ADD COLUMN IF NOT EXISTS `twitter` VARCHAR(255) NULL AFTER `discord`,
  ADD COLUMN IF NOT EXISTS `website` TEXT NULL AFTER `twitter`,
  ADD COLUMN IF NOT EXISTS `whatsapp` VARCHAR(100) NULL AFTER `website`,
  ADD COLUMN IF NOT EXISTS `game_profiles` JSON NULL AFTER `whatsapp`;

ALTER TABLE `organizations`
  ADD COLUMN IF NOT EXISTS `founded_year` VARCHAR(4) NULL AFTER `allowed_games`,
  ADD COLUMN IF NOT EXISTS `rating` DECIMAL(3,2) NOT NULL DEFAULT 4.95 AFTER `founded_year`,
  ADD COLUMN IF NOT EXISTS `website` TEXT NULL AFTER `rating`,
  ADD COLUMN IF NOT EXISTS `redes_sociales` JSON NULL AFTER `website`,
  ADD COLUMN IF NOT EXISTS `status` VARCHAR(30) NOT NULL DEFAULT 'Activa' AFTER `redes_sociales`;

ALTER TABLE `teams`
  ADD COLUMN IF NOT EXISTS `redes_sociales` JSON NULL AFTER `banner_url`,
  ADD COLUMN IF NOT EXISTS `encargados_json` JSON NULL AFTER `redes_sociales`;

UPDATE `matches`
SET `competition_id` = `tournament_id`
WHERE (`competition_id` IS NULL OR `competition_id` = '')
  AND `tournament_id` IS NOT NULL;

UPDATE `matches`
SET `tournament_id` = `competition_id`
WHERE `competition_id` IS NOT NULL
  AND (`tournament_id` IS NULL OR `tournament_id` = '' OR `tournament_id` <> `competition_id`);

ALTER TABLE `organizations`
  DROP FOREIGN KEY IF EXISTS `fk_org_owner`,
  ADD CONSTRAINT `fk_org_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `teams`
  DROP FOREIGN KEY IF EXISTS `fk_teams_captain`,
  ADD CONSTRAINT `fk_teams_captain` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `competitions`
  DROP FOREIGN KEY IF EXISTS `fk_comp_organizer`,
  ADD CONSTRAINT `fk_comp_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
