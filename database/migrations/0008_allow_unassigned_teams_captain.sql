-- Migración 0008: Usuario centinela y compatibilidad para escuadras sin capitán oficial asignado
INSERT INTO `users` (
  `id`, `email`, `name`, `gamertag`, `role`, `primary_game_slug`,
  `platform`, `position`, `rank_badge`, `rating`, `status`
) VALUES (
  'usr-sin-capitan',
  'sistema-sin-capitan@torneosesport.com',
  'Sin Capitán Asignado',
  'SinCapitan',
  'Jugador',
  'eafc26',
  'CROSSPLAY',
  'DFC',
  'División 1',
  5.0,
  'Inactivo'
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
