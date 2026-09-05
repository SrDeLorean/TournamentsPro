import type { LucideIcon } from 'lucide-react';
import { Flag, Gamepad2, Home, Info, Shield, Users } from 'lucide-react';
import type { TeamData, UserProfile } from '@/lib/data-store';

export interface ManagedTeam extends TeamData {
  game_slug?: string;
  captain_id?: string;
  captain_name?: string;
  encargados?: unknown;
  encargados_json?: unknown;
}

interface ExploreLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

function isListedManager(team: ManagedTeam, user: UserProfile) {
  const userId = user.id;
  const userName = user.name?.toLowerCase();
  const userGamertag = user.gamertag?.toLowerCase();
  const captainId = team.captain_id || team.captainId;
  const captainName = (team.captain_name || team.captainName || '').toLowerCase();

  if (captainId === userId) return true;
  if (captainName && (captainName === userName || captainName === userGamertag)) return true;
  if (user.teamId === team.id) return true;

  const managers = team.encargados || team.encargados_json;
  if (!managers) return false;

  try {
    const entries: unknown = typeof managers === 'string' ? JSON.parse(managers) : managers;
    if (!Array.isArray(entries)) return false;

    return entries.some((entry: unknown) => {
      if (typeof entry === 'string') {
        const normalized = entry.toLowerCase();
        return entry === userId || normalized === userName || normalized === userGamertag;
      }
      if (!entry || typeof entry !== 'object') return false;
      const manager = entry as { id?: string; name?: string; gamertag?: string };
      return manager.id === userId
        || Boolean(manager.name && userName && manager.name.toLowerCase() === userName)
        || Boolean(manager.gamertag && userGamertag && manager.gamertag.toLowerCase() === userGamertag);
    });
  } catch {
    return false;
  }
}

export function findActiveManagedTeam(
  teams: TeamData[],
  activeGameSlug: string,
  user: UserProfile | null,
  canManageAnyTeam: boolean,
) {
  const filteredTeams = (teams as ManagedTeam[]).filter((team) => {
    const slug = team.game_slug || team.gameSlug || 'eafc26';
    return slug === activeGameSlug || activeGameSlug === 'ALL';
  });
  const assignedTeam = filteredTeams.find((team) => user && isListedManager(team, user));
  return assignedTeam ?? (canManageAnyTeam ? filteredTeams[0] || teams[0] : undefined);
}

export function canManageTeam(team: TeamData, user: UserProfile | null) {
  if (!user) return false;
  if (isListedManager(team as ManagedTeam, user)) return true;
  return user.role === 'Administrador' || user.role === 'Organizador';
}

export function getExploreLinks(activeGameSlug: string, activeGameName: string): ExploreLink[] {
  return [
    { href: '/', label: 'Inicio', description: 'Portada general', icon: Home },
    { href: `/${activeGameSlug}`, label: activeGameName, description: 'Portal competitivo', icon: Gamepad2 },
    { href: '/equipos', label: 'Equipos', description: 'Directorio de clubes', icon: Shield },
    { href: '/organizaciones', label: 'Organizaciones', description: 'Ligas y organizadores', icon: Flag },
    { href: '/usuarios', label: 'Jugadores', description: 'Directorio de atletas', icon: Users },
    { href: '/informacion', label: 'Información', description: 'Ayuda y plataforma', icon: Info },
  ];
}
