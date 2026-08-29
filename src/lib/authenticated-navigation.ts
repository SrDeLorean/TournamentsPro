export type AuthenticatedNavItemId =
  | 'profile'
  | 'stats'
  | 'offers'
  | 'messages'
  | 'athlete-settings'
  | 'club-dashboard'
  | 'roster'
  | 'recruitment'
  | 'matchday'
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
  return [
    {
      id: 'profile',
      label: 'Mi ficha de atleta',
      shortLabel: 'Mi ficha',
      href: `/${gameSlug}/jugadores/${userId}`,
    },
    { id: 'stats', label: 'Estadísticas', shortLabel: 'Stats', href: '/atleta/stats' },
    { id: 'offers', label: 'Ofertas y fichajes', shortLabel: 'Ofertas', href: '/atleta/ofertas' },
    { id: 'messages', label: 'Mensajes', shortLabel: 'Mensajes', href: '/mensajes' },
    {
      id: 'athlete-settings',
      label: 'Ajustes de perfil',
      shortLabel: 'Ajustes',
      href: `/${gameSlug}/atleta-ajustes`,
    },
  ];
}

export function getClubNavigation(gameSlug: string, teamId: string): AuthenticatedNavItem[] {
  return [
    {
      id: 'club-dashboard',
      label: 'Panel del club',
      shortLabel: 'Panel',
      href: `/${gameSlug}/equipos/${teamId}`,
    },
    { id: 'roster', label: 'Plantilla', shortLabel: 'Plantilla', href: '/club/plantilla' },
    { id: 'recruitment', label: 'Vacantes y fichajes', shortLabel: 'Vacantes', href: '/club/reclutamiento' },
    { id: 'matchday', label: 'Convocatorias', shortLabel: 'Matchday', href: '/club/matchday' },
    { id: 'club-settings', label: 'Ajustes del club', shortLabel: 'Ajustes', href: '/club/ajustes' },
  ];
}

export function isAuthenticatedNavItemActive(pathname: string, item: AuthenticatedNavItem) {
  if (item.id === 'profile' || item.id === 'club-dashboard') {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
import type { TeamData, UserProfile } from '@/lib/data-store';
