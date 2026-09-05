export interface PublicPortalMatch {
  id: string;
  gameSlug: string;
  competitionId?: string | null;
  competitionName: string;
  organizationName: string;
  home: string;
  homeTag: string;
  away: string;
  awayTag: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  score: string;
  status: string;
  scheduledAt?: string | null;
  displayDate: string;
}

export interface PublicPortalSummary {
  counts: { users: number; organizations: number; teams: number; competitions: number; liveMatches: number };
  matches: PublicPortalMatch[];
  competitions: Array<{ id: string; name: string; gameSlug: string; status: string; format: string; organizationName: string; startDate?: string | null }>;
  organizations: Array<{ id: string; name: string; tag: string; country: string; allowedGames: string[]; teamsCount: number; logoUrl?: string | null; bannerUrl?: string | null }>;
  teams: Array<{ id: string; name: string; tag: string; gameSlug: string; membersCount: number; logoUrl?: string | null; bannerUrl?: string | null }>;
}

interface SummarySources {
  users: Array<{ id: string; role: string; isBanned?: boolean; primaryGameSlug?: string | null; gameProfiles?: unknown }>;
  organizations: Array<{ id: string; name: string; tag: string; country?: string | null; allowedGames?: string[]; logoUrl?: string | null; bannerUrl?: string | null; isBanned?: boolean }>;
  teams: Array<{ id: string; name: string; tag: string; gameSlug: string; organizationId?: string | null; membersCount?: number; logoUrl?: string | null; bannerUrl?: string | null; isBanned?: boolean }>;
  competitions: Array<{ id: string; name: string; gameSlug: string; organizationId?: string | null; status: string; modeFormat?: string | null; fechaInicio?: string | null }>;
  matches: Array<{ id: string; competitionId?: string | null; teamHomeId?: string | null; homeTeamId?: string | null; teamAwayId?: string | null; awayTeamId?: string | null; homeTeamName?: string | null; awayTeamName?: string | null; scoreHome?: number | null; scoreAway?: number | null; scheduledAt?: string | null; status: string }>;
}

const LIVE_STATES = new Set(['EN_VIVO', 'EN_CURSO']);
const UPCOMING_STATES = new Set(['PROGRAMADO', 'PENDIENTE', 'POR_REVISAR']);
const PUBLIC_COMPETITION_STATES = new Set(['INSCRIPCION', 'INSCRIPCIONES', 'EN_CURSO', 'ACTIVO', 'ACTIVA', 'FINALIZADA', 'FINALIZADO']);

function normalizedStatus(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/[ -]+/g, '_');
}

function hasGameProfile(value: unknown, gameSlug: string): boolean {
  if (!value) return false;
  try {
    const profiles = typeof value === 'string' ? JSON.parse(value) as unknown : value;
    return Boolean(profiles && typeof profiles === 'object' && !Array.isArray(profiles) && gameSlug in profiles);
  } catch {
    return false;
  }
}

export function buildPublicPortalSummary(sources: SummarySources, gameSlug?: string): PublicPortalSummary {
  const organizations = sources.organizations.filter((organization) => !organization.isBanned);
  const visibleOrganizationIds = new Set(organizations.map((organization) => organization.id));
  const teams = sources.teams.filter((team) => !team.isBanned && (!team.organizationId || visibleOrganizationIds.has(team.organizationId)) && (!gameSlug || team.gameSlug === gameSlug));
  const visibleTeamIds = new Set(teams.map((team) => team.id));
  const competitions = sources.competitions.filter((competition) => PUBLIC_COMPETITION_STATES.has(normalizedStatus(competition.status)) && (!competition.organizationId || visibleOrganizationIds.has(competition.organizationId)) && (!gameSlug || competition.gameSlug === gameSlug));
  const competitionIds = new Set(competitions.map((competition) => competition.id));
  const scopedOrganizations = gameSlug
    ? organizations.filter((organization) => organization.allowedGames?.includes(gameSlug) || teams.some((team) => team.organizationId === organization.id) || competitions.some((competition) => competition.organizationId === organization.id))
    : organizations;
  const users = sources.users.filter((user) => user.role !== 'Administrador' && !user.isBanned && (!gameSlug || user.primaryGameSlug === gameSlug || hasGameProfile(user.gameProfiles, gameSlug)));
  const teamMap = new Map(sources.teams.map((team) => [team.id, team]));
  const competitionMap = new Map(sources.competitions.map((competition) => [competition.id, competition]));
  const organizationMap = new Map(organizations.map((organization) => [organization.id, organization]));
  const matches = sources.matches
    .filter((match) => {
      if (!match.competitionId || !competitionIds.has(match.competitionId)) return false;
      const homeId = match.teamHomeId || match.homeTeamId;
      const awayId = match.teamAwayId || match.awayTeamId;
      return (!homeId || visibleTeamIds.has(homeId)) && (!awayId || visibleTeamIds.has(awayId));
    })
    .map((match): PublicPortalMatch => {
      const competition = match.competitionId ? competitionMap.get(match.competitionId) : undefined;
      const organization = competition?.organizationId ? organizationMap.get(competition.organizationId) : undefined;
      const homeTeam = teamMap.get(match.teamHomeId || match.homeTeamId || '');
      const awayTeam = teamMap.get(match.teamAwayId || match.awayTeamId || '');
      const hasScore = match.scoreHome !== null && match.scoreHome !== undefined && match.scoreAway !== null && match.scoreAway !== undefined;
      return {
        id: match.id,
        gameSlug: competition?.gameSlug || gameSlug || homeTeam?.gameSlug || awayTeam?.gameSlug || 'eafc26',
        competitionId: match.competitionId,
        competitionName: competition?.name || 'Competencia oficial',
        organizationName: organization?.name || 'Organización oficial',
        home: homeTeam?.name || match.homeTeamName || 'Equipo local',
        homeTag: homeTeam?.tag || (match.homeTeamName || 'LOC').slice(0, 3).toUpperCase(),
        homeLogoUrl: homeTeam?.logoUrl,
        homeScore: match.scoreHome,
        away: awayTeam?.name || match.awayTeamName || 'Equipo visitante',
        awayTag: awayTeam?.tag || (match.awayTeamName || 'VIS').slice(0, 3).toUpperCase(),
        awayLogoUrl: awayTeam?.logoUrl,
        awayScore: match.scoreAway,
        score: hasScore ? `${match.scoreHome} - ${match.scoreAway}` : 'VS',
        status: match.status,
        scheduledAt: match.scheduledAt,
        displayDate: match.scheduledAt ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' }).format(new Date(match.scheduledAt)) : 'Fecha por confirmar',
      };
    })
    .sort((left, right) => {
      const leftStatus = normalizedStatus(left.status);
      const rightStatus = normalizedStatus(right.status);
      const rank = (status: string) => LIVE_STATES.has(status) ? 0 : UPCOMING_STATES.has(status) ? 1 : 2;
      const rankDifference = rank(leftStatus) - rank(rightStatus);
      if (rankDifference) return rankDifference;
      const dateDifference = new Date(left.scheduledAt || 0).getTime() - new Date(right.scheduledAt || 0).getTime();
      return rank(leftStatus) === 2 ? -dateDifference : dateDifference;
    });

  return {
    counts: {
      users: users.length,
      organizations: scopedOrganizations.length,
      teams: teams.length,
      competitions: competitions.length,
      liveMatches: matches.filter((match) => LIVE_STATES.has(normalizedStatus(match.status))).length,
    },
    matches: matches.slice(0, 48),
    competitions: competitions.slice(0, 48).map((competition) => ({ id: competition.id, name: competition.name, gameSlug: competition.gameSlug, status: competition.status, format: competition.modeFormat || 'Competitivo', organizationName: organizationMap.get(competition.organizationId || '')?.name || 'Organización oficial', startDate: competition.fechaInicio })),
    organizations: scopedOrganizations.slice(0, 48).map((organization) => ({ id: organization.id, name: organization.name, tag: organization.tag, country: organization.country || 'Global', allowedGames: organization.allowedGames || [], teamsCount: teams.filter((team) => team.organizationId === organization.id).length, logoUrl: organization.logoUrl, bannerUrl: organization.bannerUrl })),
    teams: teams.slice(0, 64).map((team) => ({ id: team.id, name: team.name, tag: team.tag, gameSlug: team.gameSlug, membersCount: team.membersCount || 0, logoUrl: team.logoUrl, bannerUrl: team.bannerUrl })),
  };
}
