import React from 'react';
import Link from 'next/link';
import { queryDB } from '@/lib/db';
import { GAMES_CATALOG } from '@/lib/games-data';
import { Trophy } from 'lucide-react';

import {
  PublicCompetitionDetailView,
  type CompetitionDetail,
  type CompetitionMatch,
  type ConfirmedTeam,
} from '@/components/tournaments/public-competition-detail-view';

export const revalidate = 0;

export default async function PublicCompetitionDetailPage({
  params,
}: {
  params: Promise<{ gameSlug: string; orgId: string; compId: string }>;
}) {
  const { gameSlug, orgId, compId } = await params;
  const gameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG['eafc26'];

  // Clean compId matching (supports exact compId or prefix matching)
  const compRows = await queryDB<CompetitionDetail>(
    `SELECT c.*, 
            COALESCE(o.name, u_org.name, 'Organización Oficial') as org_name, 
            COALESCE(o.logo_url, u_org.logo_url, '/images/default/logo-default.png') as org_logo, 
            COALESCE(o.banner_url, u_org.banner_url, '/images/default/banner-default.jpg') as org_banner 
     FROM competitions c 
     LEFT JOIN users u ON c.organizer_id = u.id
     LEFT JOIN organizations o ON c.organization_id = o.id 
     LEFT JOIN organizations u_org ON u.organization_id = u_org.id
     WHERE (c.id = ? OR c.id LIKE ?) 
       AND (c.organization_id = ? OR u.organization_id = ? OR ? = 'all')
       AND c.game_slug = ?`,
    [compId, `${compId}%`, orgId, orgId, orgId, gameSlug]
  );

  if (!compRows || compRows.length === 0) {
    return (
      <div
        className="min-h-screen pb-20 relative transition-all duration-500 text-[var(--text-primary)] bg-[var(--bg-main)]"
        style={{
          '--game-brand': gameConfig.brandColor,
          '--game-accent': gameConfig.accentColor,
        } as React.CSSProperties}
      >
        <div className="p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-50" />
            <h1 className="text-2xl font-black text-[var(--text-heading)] uppercase">Competencia no encontrada</h1>
            <Link href={`/${gameSlug}/organizacion/${orgId}`} className="text-[var(--accent-cyan)] hover:underline text-sm font-bold block">
              Volver a la Organización
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const competition = compRows[0];
  const actualCompId = competition.id;

  const [teamRows, matchRows] = await Promise.all([
    queryDB<ConfirmedTeam>(
      `SELECT ct.*, t.logo_url as team_logo, t.captain_name 
       FROM competition_teams ct 
       LEFT JOIN teams t ON ct.team_id = t.id 
       WHERE ct.competition_id = ? AND ct.status = 'CONFIRMADO'`,
      [actualCompId]
    ),
    queryDB<CompetitionMatch>(
      `SELECT m.*, 
              th.name as home_team_name, 
              th.tag as home_team_tag, 
              th.logo_url as home_logo, 
              ta.name as away_team_name, 
              ta.tag as away_team_tag, 
              ta.logo_url as away_logo 
       FROM matches m 
       LEFT JOIN teams th ON (m.team_home_id = th.id OR m.home_team_id = th.id) 
       LEFT JOIN teams ta ON (m.team_away_id = ta.id OR m.away_team_id = ta.id) 
       WHERE m.competition_id = ?
       ORDER BY COALESCE(m.matchday_number, m.matchday, 1) ASC, m.created_at ASC`,
      [actualCompId]
    ),
  ]);

  return (
    <div className="min-h-screen pb-20 relative text-[var(--text-primary)]">
      <div className="standard-page-wrapper pt-0">
        <PublicCompetitionDetailView
          gameSlug={gameSlug}
          orgId={orgId}
          gameConfig={gameConfig}
          competition={competition}
          teams={teamRows}
          matches={matchRows}
        />
      </div>
    </div>
  );
}
