export interface IdentitySource {
  id: string;
  name: string;
  gamertag: string;
  primaryGameSlug?: string | null;
  gameProfiles?: unknown;
}

export interface IdentityWarning {
  id: string;
  scope: 'global' | 'game';
  gameSlug?: string;
  firstUserId: string;
  firstName: string;
  firstIdentifier: string;
  secondUserId: string;
  secondName: string;
  secondIdentifier: string;
  reason: string;
}

export interface RecentActivity {
  day: number;
  week: number;
  month: number;
}

export interface DashboardInsights {
  scope: 'global' | 'organization';
  users: { total: number; newUsers: RecentActivity; activeUsers: RecentActivity };
  organizations: { total: number; newOrganizations: RecentActivity };
  teams: { total: number; newTeams: RecentActivity };
  competitions: { total: number; active: number; finished: number; upcoming: number };
  sanctions: Array<{ id: string; type: 'user' | 'team' | 'organization'; name: string; reason: string; date?: string | null }>;
  identityWarnings: IdentityWarning[];
}

export function normalizeCompetitiveId(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function visualSkeleton(value: string): string {
  return normalizeCompetitiveId(value)
    .replace(/0/g, 'o')
    .replace(/[1il]/g, 'i')
    .replace(/5/g, 's')
    .replace(/8/g, 'b');
}

function levenshtein(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function similarityReason(left: string, right: string): string | null {
  const normalizedLeft = normalizeCompetitiveId(left);
  const normalizedRight = normalizeCompetitiveId(right);
  if (Math.min(normalizedLeft.length, normalizedRight.length) < 5) return null;
  if (normalizedLeft === normalizedRight) return 'Coincidencia tras normalizar mayúsculas y separadores';
  if (visualSkeleton(normalizedLeft) === visualSkeleton(normalizedRight)) {
    return 'Posible suplantación por caracteres visualmente similares';
  }
  const maximumDistance = Math.max(normalizedLeft.length, normalizedRight.length) >= 10 ? 2 : 1;
  if (Math.abs(normalizedLeft.length - normalizedRight.length) <= maximumDistance && levenshtein(normalizedLeft, normalizedRight) <= maximumDistance) {
    return 'IDs casi idénticos; requiere revisión manual';
  }
  return null;
}

function parseGameProfiles(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function profileIdentifier(profile: unknown): string | null {
  if (typeof profile === 'string') return profile.trim() || null;
  if (!profile || typeof profile !== 'object') return null;
  const record = profile as Record<string, unknown>;
  for (const key of ['gameId', 'game_id', 'id', 'gamertag', 'username', 'nick']) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
  }
  return null;
}

function compareIdentityGroup(entries: Array<{ user: IdentitySource; identifier: string }>, scope: 'global' | 'game', gameSlug?: string): IdentityWarning[] {
  const warnings: IdentityWarning[] = [];
  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex];
      const right = entries[rightIndex];
      if (left.user.id === right.user.id) continue;
      const reason = similarityReason(left.identifier, right.identifier);
      if (!reason) continue;
      const pair = [left.user.id, right.user.id].sort().join('-');
      warnings.push({
        id: `${scope}-${gameSlug || 'all'}-${pair}`,
        scope,
        gameSlug,
        firstUserId: left.user.id,
        firstName: left.user.name,
        firstIdentifier: left.identifier,
        secondUserId: right.user.id,
        secondName: right.user.name,
        secondIdentifier: right.identifier,
        reason,
      });
    }
  }
  return warnings;
}

export function buildIdentityWarnings(users: IdentitySource[]): IdentityWarning[] {
  const warnings = compareIdentityGroup(
    users.filter((user) => user.gamertag).map((user) => ({ user, identifier: user.gamertag })),
    'global',
  );
  const byGame = new Map<string, Array<{ user: IdentitySource; identifier: string }>>();
  for (const user of users) {
    for (const [gameSlug, profile] of Object.entries(parseGameProfiles(user.gameProfiles))) {
      const identifier = profileIdentifier(profile);
      if (!identifier) continue;
      const group = byGame.get(gameSlug) ?? [];
      group.push({ user, identifier });
      byGame.set(gameSlug, group);
    }
  }
  for (const [gameSlug, entries] of byGame) warnings.push(...compareIdentityGroup(entries, 'game', gameSlug));
  return warnings;
}

export function buildRecentActivity(values: Array<string | null | undefined>, now = new Date()): RecentActivity {
  const nowTime = now.getTime();
  const countWithinDays = (days: number) => values.filter((value) => {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time <= nowTime && time >= nowTime - days * 24 * 60 * 60 * 1000;
  }).length;
  return { day: countWithinDays(1), week: countWithinDays(7), month: countWithinDays(30) };
}
