import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { queryDB } from '@/lib/db';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  PublicCompetitionDetailView,
  type CompetitionDetail,
  type CompetitionMatch,
  type ConfirmedTeam,
} from '@/components/tournaments/public-competition-detail-view';

export const revalidate = 0;

export default async function GlobalCompetitionDetailPage({ params }: { params: Promise<{ orgId: string; compId: string }> }) {
  const { orgId, compId } = await params;
  const competition = (await queryDB<CompetitionDetail>(`SELECT c.*, COALESCE(o.name, u_org.name, 'Organización Oficial') org_name, COALESCE(o.logo_url, u_org.logo_url, '/images/default/logo-default.png') org_logo, COALESCE(o.banner_url, u_org.banner_url, '/images/default/banner-default.jpg') org_banner FROM competitions c LEFT JOIN users u ON c.organizer_id = u.id LEFT JOIN organizations o ON c.organization_id = o.id LEFT JOIN organizations u_org ON u.organization_id = u_org.id WHERE (c.id = ? OR c.id LIKE ?) AND (c.organization_id = ? OR u.organization_id = ?)`, [compId, `${compId}%`, orgId, orgId]))[0];

  if (!competition) return <main className="public-team-state"><Trophy className="size-10" /><h1>Competencia no encontrada</h1><Link href={`/organizaciones/${orgId}`}>Volver a la organización</Link></main>;

  const [teams, matches] = await Promise.all([
    queryDB<ConfirmedTeam>(`SELECT ct.*, t.logo_url team_logo, t.captain_name FROM competition_teams ct LEFT JOIN teams t ON ct.team_id = t.id WHERE ct.competition_id = ? AND ct.status = 'CONFIRMADO'`, [competition.id]),
    queryDB<CompetitionMatch>(`SELECT m.*, th.name home_team_name, th.tag home_team_tag, th.logo_url home_logo, ta.name away_team_name, ta.tag away_team_tag, ta.logo_url away_logo FROM matches m LEFT JOIN teams th ON (m.team_home_id = th.id OR m.home_team_id = th.id) LEFT JOIN teams ta ON (m.team_away_id = ta.id OR m.away_team_id = ta.id) WHERE m.competition_id = ? ORDER BY COALESCE(m.matchday_number, m.matchday, 1), m.created_at`, [competition.id]),
  ]);
  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG.eafc26;

  return (
    <main className="public-team-page" style={{ '--game-brand': gameConfig.brandColor, '--game-accent': gameConfig.accentColor } as React.CSSProperties}>
      <PublicCompetitionDetailView gameSlug={competition.game_slug} orgId={orgId} gameConfig={gameConfig} competition={competition} teams={teams} matches={matches} context="global" />
    </main>
  );
}
