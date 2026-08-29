import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { queryDB } from '@/lib/db';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  OrganizationProfileView,
  type AffiliatedTeam,
  type CompetitionData,
  type OrganizerUser,
  type OrgMatch,
  type OrgProfileData,
} from '@/components/tournaments/organization-profile-view';

interface OrganizationRow extends OrgProfileData {
  logo_url?: string;
  banner_url?: string;
  founded_year?: string | number;
  allowed_games?: string | string[];
  redes_sociales?: string | Record<string, string>;
}

function parseField<T>(value: string | T | null | undefined, fallback: T): T {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export default async function GlobalOrganizationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const orgRaw = (await queryDB<OrganizationRow>('SELECT * FROM organizations WHERE id = ?', [orgId]))[0];
  if (!orgRaw) return <main className="public-team-state"><Building2 className="size-10" /><h1>Organización no encontrada</h1><Link href="/organizaciones">Volver al directorio</Link></main>;

  const allowedGames = parseField<string[]>(orgRaw.allowed_games, orgRaw.allowedGames || ['eafc26']);
  const gameSlug = allowedGames[0] || 'eafc26';
  const gameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const org = {
    ...orgRaw,
    logoUrl: orgRaw.logo_url || orgRaw.logoUrl || '/images/default/logo-default.png',
    bannerUrl: orgRaw.banner_url || orgRaw.bannerUrl || gameConfig.bannerUrl || '/images/default/banner-default.jpg',
    foundedYear: String(orgRaw.founded_year || orgRaw.foundedYear || '2022'),
    allowedGames,
    socialMedia: parseField<Record<string, string>>(orgRaw.redes_sociales, orgRaw.socialMedia || {}),
  };

  const [competitions, organizers, teams, matches] = await Promise.all([
    queryDB<CompetitionData>(`SELECT c.*, (SELECT COUNT(*) FROM matches m WHERE m.competition_id = c.id) total_matches FROM competitions c LEFT JOIN users u ON c.organizer_id = u.id WHERE (c.organization_id = ? OR u.organization_id = ?) AND c.status != 'Borrador' ORDER BY c.created_at DESC`, [orgId, orgId]),
    queryDB<OrganizerUser>(`SELECT id, name, gamertag, email, role, avatar_url FROM users WHERE organization_id = ? AND role = 'Organizador'`, [orgId]),
    queryDB<AffiliatedTeam>(`SELECT t.*, COALESCE(t.members_count, 1) player_count FROM teams t WHERE t.organization_id = ? ORDER BY t.name ASC LIMIT 24`, [orgId]),
    queryDB<OrgMatch>(`SELECT m.*, c.name competition_name, COALESCE(th.name, m.home_team_name) home_team_name, th.logo_url home_logo, COALESCE(ta.name, m.away_team_name) away_team_name, ta.logo_url away_logo FROM matches m LEFT JOIN competitions c ON m.competition_id = c.id LEFT JOIN teams th ON (m.team_home_id = th.id OR m.home_team_id = th.id) LEFT JOIN teams ta ON (m.team_away_id = ta.id OR m.away_team_id = ta.id) LEFT JOIN users u ON c.organizer_id = u.id WHERE (c.organization_id = ? OR u.organization_id = ?) ORDER BY m.scheduled_at DESC LIMIT 12`, [orgId, orgId]),
  ]);

  return (
    <main className="public-team-page" style={{ '--game-brand': gameConfig.brandColor, '--game-accent': gameConfig.accentColor } as React.CSSProperties}>
      <OrganizationProfileView gameSlug={gameSlug} gameConfig={gameConfig} org={org} competitions={competitions} organizers={organizers} teams={teams} matches={matches} context="global" />
    </main>
  );
}
