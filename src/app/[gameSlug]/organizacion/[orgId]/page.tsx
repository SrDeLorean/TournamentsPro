import React from 'react';
import Link from 'next/link';
import { queryDB } from '@/lib/db';
import { Building2 } from 'lucide-react';

import { GameSubNavbar } from '@/components/layout/game-sub-navbar';
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

export default async function OrganizacionPage({ params }: { params: Promise<{ gameSlug: string; orgId: string }> }) {
  const { gameSlug, orgId } = await params;
  const gameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG['eafc26'];

  // 1. Fetch Organization Details
  const orgs = await queryDB<OrganizationRow>(
    `SELECT * FROM organizations WHERE id = ?`,
    [orgId]
  );
  const orgRaw = orgs[0];

  if (!orgRaw) {
    return (
      <div
        className="min-h-screen pb-20 relative transition-all duration-500 text-[var(--text-primary)] bg-[var(--bg-main)]"
        style={{
          '--game-brand': gameConfig.brandColor,
          '--game-accent': gameConfig.accentColor,
        } as React.CSSProperties}
      >
        <GameSubNavbar game={gameConfig} activeSection="organizaciones" />
        <div className="p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Building2 className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-50" />
            <h1 className="text-2xl font-black text-[var(--text-heading)] uppercase">Organización no encontrada</h1>
            <Link href={`/${gameSlug}/organizaciones`} className="text-[var(--accent-cyan)] hover:underline text-sm font-bold block">
              Volver al directorio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse JSON fields safely
  const org = {
    ...orgRaw,
    logoUrl: orgRaw.logo_url || orgRaw.logoUrl || '/images/default/logo-default.png',
    bannerUrl: orgRaw.banner_url || orgRaw.bannerUrl || gameConfig.bannerUrl || '/images/default/banner-default.jpg',
    foundedYear: String(orgRaw.founded_year || orgRaw.foundedYear || '2022'),
    allowedGames: orgRaw.allowed_games ? (typeof orgRaw.allowed_games === 'string' ? JSON.parse(orgRaw.allowed_games) : orgRaw.allowed_games) : ['eafc26', 'valorant'],
    socialMedia: orgRaw.redes_sociales ? (typeof orgRaw.redes_sociales === 'string' ? JSON.parse(orgRaw.redes_sociales) : orgRaw.redes_sociales) : {},
  };

  // 2. Fetch Competitions owned by this Org
  const competitions = await queryDB<CompetitionData>(
    `SELECT c.*, 
            (SELECT COUNT(*) FROM matches m WHERE m.competition_id = c.id OR m.tournament_id = c.id) as total_matches,
            (SELECT COUNT(*) FROM matches m WHERE (m.competition_id = c.id OR m.tournament_id = c.id) AND m.status = 'FINALIZADO') as finished_matches
     FROM competitions c 
     LEFT JOIN users u ON c.organizer_id = u.id
     WHERE (c.organization_id = ? OR u.organization_id = ?) 
       AND c.game_slug = ? 
       AND c.status != 'Borrador' 
     ORDER BY c.created_at DESC`,
    [orgId, orgId, gameSlug]
  );

  // 3. Fetch Assigned Organizers
  const organizers = await queryDB<OrganizerUser>(
    `SELECT id, name, gamertag, email, role, avatar_url 
     FROM users 
     WHERE organization_id = ? AND role = 'Organizador'`,
    [orgId]
  );

  // 4. Fetch Affiliated Teams
  const teams = await queryDB<AffiliatedTeam>(
    `SELECT t.*, COALESCE(t.members_count, 1) as player_count
     FROM teams t 
     WHERE t.organization_id = ? OR t.game_slug = ?
     ORDER BY t.name ASC 
     LIMIT 12`,
    [orgId, gameSlug]
  );

  // 5. Fetch Recent & Live Matches
  const matches = await queryDB<OrgMatch>(
    `SELECT m.*, 
            c.name as competition_name,
            COALESCE(th.name, m.home_team_name) as home_team_name,
            COALESCE(th.tag, UPPER(LEFT(COALESCE(th.name, m.home_team_name, 'LOC'), 3))) as home_team_tag,
            th.logo_url as home_logo,
            COALESCE(ta.name, m.away_team_name) as away_team_name,
            COALESCE(ta.tag, UPPER(LEFT(COALESCE(ta.name, m.away_team_name, 'VIS'), 3))) as away_team_tag,
            ta.logo_url as away_logo
     FROM matches m
     LEFT JOIN competitions c ON (m.competition_id = c.id OR m.tournament_id = c.id)
     LEFT JOIN teams th ON (m.team_home_id = th.id OR m.home_team_id = th.id)
     LEFT JOIN teams ta ON (m.team_away_id = ta.id OR m.away_team_id = ta.id)
     LEFT JOIN users u ON c.organizer_id = u.id
     WHERE (c.organization_id = ? OR u.organization_id = ?)
       AND c.game_slug = ?
     ORDER BY m.scheduled_at DESC
     LIMIT 8`,
    [orgId, orgId, gameSlug]
  );

  return (
    <div
      className="min-h-screen pb-20 relative transition-all duration-500 text-[var(--text-primary)] bg-[var(--bg-main)]"
      style={{
        '--game-brand': gameConfig.brandColor,
        '--game-accent': gameConfig.accentColor,
      } as React.CSSProperties}
    >
      <GameSubNavbar game={gameConfig} activeSection="organizaciones" />

      <div className="relative w-full min-h-screen">
        <div className="standard-page-wrapper pt-0">
          <OrganizationProfileView
            gameSlug={gameSlug}
            gameConfig={gameConfig}
            org={org}
            competitions={competitions}
            organizers={organizers}
            teams={teams}
            matches={matches}
          />
        </div>
      </div>
    </div>
  );
}
