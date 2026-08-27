-- Fase expandir: organization_games pasa a ser la relación normalizada para las
-- disciplinas habilitadas. organizations.allowed_games se conserva durante la
-- transición para mantener compatibilidad con versiones anteriores del runtime.

CREATE TABLE IF NOT EXISTS `organization_games` (
  `organization_id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`organization_id`, `game_slug`),
  INDEX `idx_organization_games_game` (`game_slug`, `organization_id`),
  CONSTRAINT `fk_organization_games_org`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_organization_games_game`
    FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `organization_games` (`organization_id`, `game_slug`)
SELECT `o`.`id`, `g`.`slug`
FROM `organizations` AS `o`
JOIN `games` AS `g`
  ON JSON_CONTAINS(COALESCE(`o`.`allowed_games`, JSON_ARRAY()), JSON_QUOTE(`g`.`slug`));
