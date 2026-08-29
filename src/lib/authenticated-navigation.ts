export type AuthenticatedNavItemId =
  | 'athlete-dashboard'
  | 'profile'
  | 'stats'
  | 'offers'
  | 'teams'
  | 'athlete-history'
  | 'messages'
  | 'athlete-settings'
  | 'club-dashboard'
  | 'club-profile'
  | 'roster'
  | 'recruitment'
  | 'matchday'
  | 'club-stats'
  | 'club-history'
  | 'club-messages'
  | 'club-settings';

export interface AuthenticatedNavItem {
  id: AuthenticatedNavItemId;
  label: string;
  shortLabel: string;
  href: string;
}

type ManagedTeam = TeamData & {
  game_slug?: string;
  captain_id?: string;
  captain_name?: string;
  encargados?: unknown;
  encargados_json?: unknown;
};

export function findManagedTeamForUser(
  teams: TeamData[],
  user: UserProfile | null,
  gameSlug: string,
) {
  if (!user) return undefined;
  const userName = user.name?.toLowerCase();
  const gamerTag = user.gamertag?.toLowerCase();

  return (teams as ManagedTeam[]).find((team) => {
    const teamGame = team.game_slug || team.gameSlug || 'eafc26';
    const captainName = (team.captain_name || team.captainName || '').toLowerCase();
    if (teamGame !== gameSlug) return false;
    if (
      team.captain_id === user.id ||
      captainName === userName ||
      captainName === gamerTag ||
      team.id === user.teamId
    ) return true;

    const managers = team.encargados || team.encargados_json;
    if (!managers) return false;
    try {
      const entries = typeof managers === 'string' ? JSON.parse(managers) : managers;
      return Array.isArray(entries) && entries.some((entry: unknown) => {
        if (typeof entry === 'string') {
          return entry === user.id || entry.toLowerCase() === userName || entry.toLowerCase() === gamerTag;
        }
        if (!entry || typeof entry !== 'object') return false;
        const manager = entry as { id?: string; name?: string; gamertag?: string };
        return (
          manager.id === user.id ||
          manager.name?.toLowerCase() === userName ||
          manager.gamertag?.toLowerCase() === gamerTag
        );
      });
    } catch {
      return false;
    }
  });
}

export function getAthleteNavigation(gameSlug: string, userId: string): AuthenticatedNavItem[] {
  void userId;
  const base = `/${gameSlug}/atleta`;
  return [
    { id: 'athlete-dashboard', label: 'Resumen del atleta', shortLabel: 'Resumen', href: base },
    {
      id: 'profile',
      label: 'Mi ficha de atleta',
      shortLabel: 'Mi ficha',
      href: `${base}/ficha`,
    },
    { id: 'stats', label: 'Estadísticas', shortLabel: 'Stats', href: `${base}/estadisticas` },
    { id: 'offers', label: 'Ofertas y fichajes', shortLabel: 'Ofertas', href: `${base}/ofertas` },
    { id: 'teams', label: 'Mis equipos', shortLabel: 'Equipos', href: `${base}/equipos` },
    { id: 'athlete-history', label: 'Historial competitivo', shortLabel: 'Historial', href: `${base}/historial` },
    { id: 'messages', label: 'Mensajes', shortLabel: 'Chat', href: `${base}/mensajes` },
    {
      id: 'athlete-settings',
      label: 'Ajustes de perfil',
      shortLabel: 'Ajustes',
      href: `${base}/ajustes`,
    },
  ];
}

export function getClubNavigation(gameSlug: string, teamId: string): AuthenticatedNavItem[] {
  void teamId;
  const base = `/${gameSlug}/club`;
  return [
    { id: 'club-dashboard', label: 'Panel del club', shortLabel: 'Panel', href: base },
    { id: 'club-profile', label: 'Ficha pública', shortLabel: 'Ficha', href: `${base}/ficha` },
    { id: 'roster', label: 'Plantilla', shortLabel: 'Plantilla', href: `${base}/plantilla` },
    { id: 'recruitment', label: 'Vacantes y fichajes', shortLabel: 'Fichajes', href: `${base}/fichajes` },
    { id: 'matchday', label: 'Convocatorias', shortLabel: 'Matchday', href: `${base}/matchday` },
    { id: 'club-stats', label: 'Estadísticas del club', shortLabel: 'Stats', href: `${base}/estadisticas` },
    { id: 'club-history', label: 'Historial del club', shortLabel: 'Historial', href: `${base}/historial` },
    { id: 'club-messages', label: 'Chat del club', shortLabel: 'Chat', href: `${base}/mensajes` },
    { id: 'club-settings', label: 'Ajustes del club', shortLabel: 'Ajustes', href: `${base}/ajustes` },
  ];
}

export function isAuthenticatedNavItemActive(pathname: string, item: AuthenticatedNavItem) {
  if (item.id === 'athlete-dashboard' || item.id === 'club-dashboard') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
import type { TeamData, UserProfile } from '@/lib/data-store';
