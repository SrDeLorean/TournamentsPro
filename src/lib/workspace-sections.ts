export const ATHLETE_WORKSPACE_SECTIONS = [
  'resumen',
  'ficha',
  'estadisticas',
  'ofertas',
  'equipos',
  'historial',
  'mensajes',
  'ajustes',
] as const;

export type AthleteWorkspaceSection = (typeof ATHLETE_WORKSPACE_SECTIONS)[number];

export const CLUB_WORKSPACE_SECTIONS = [
  'resumen',
  'ficha',
  'plantilla',
  'fichajes',
  'matchday',
  'estadisticas',
  'historial',
  'mensajes',
  'ajustes',
] as const;

export type ClubWorkspaceSection = (typeof CLUB_WORKSPACE_SECTIONS)[number];

export function isAthleteWorkspaceSection(section: string): section is AthleteWorkspaceSection {
  return (ATHLETE_WORKSPACE_SECTIONS as readonly string[]).includes(section);
}

export function isClubWorkspaceSection(section: string): section is ClubWorkspaceSection {
  return (CLUB_WORKSPACE_SECTIONS as readonly string[]).includes(section);
}
