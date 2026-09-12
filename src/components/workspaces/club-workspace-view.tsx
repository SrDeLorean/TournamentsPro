'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  CalendarCheck,
  Eye,
  MessageSquare,
  Shield,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth, useTeams } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { findManagedTeamForUser } from '@/lib/authenticated-navigation';
import { ManagementHero, ManagementMetrics, ManagementPage, ManagementSection, MetricCard } from '@/components/dashboard/management-ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCaptainDashboardDataAction, getTeamSquadAction, type SquadMemberData } from '@/app/actions/squads';
import type { ClubWorkspaceSection } from '@/lib/workspace-sections';
import {
  ClubOverview,
  ClubRoster,
  ClubStats,
  ClubHistory,
  WorkspaceLoading,
  WorkspaceEmpty,
  type ClubMatchSummary,
  type CaptainRequestSummary,
  type CompetitionEntrySummary,
} from '@/components/workspaces/club-workspace-components';

const ChatSystem = dynamic(() => import('@/components/chat/chat-system').then((module) => module.ChatSystem), {
  loading: () => <WorkspaceLoading />,
});
const ClubSettingsView = dynamic(() => import('@/components/club/club-settings-view').then((module) => module.ClubSettingsView), {
  loading: () => <WorkspaceLoading />,
});
const MatchdayReportView = dynamic(() => import('@/components/matches/matchday-report-view').then((module) => module.MatchdayReportView), {
  loading: () => <WorkspaceLoading />,
});
const TeamProfileView = dynamic(() => import('@/components/teams/team-profile-view').then((module) => module.TeamProfileView), {
  loading: () => <WorkspaceLoading />,
});
const SquadRosterModal = dynamic(() => import('@/components/teams/squad-roster-modal').then((module) => module.SquadRosterModal));
const TransferMarket = dynamic(() => import('@/components/transfers/transfer-market').then((module) => module.TransferMarket), {
  loading: () => <WorkspaceLoading />,
});

const sectionCopy: Record<ClubWorkspaceSection, { eyebrow: string; title: string; description: string }> = {
  resumen: { eyebrow: 'Centro de gestión', title: 'Panel del club', description: 'Estado de la escuadra, plantilla y accesos operativos de la disciplina activa.' },
  ficha: { eyebrow: 'Identidad institucional', title: 'Ficha del club', description: 'Revisa la presentación completa del equipo y su versión pública.' },
  plantilla: { eyebrow: 'Gestión deportiva', title: 'Plantilla del club', description: 'Consulta la nómina registrada y administra altas, roles y posiciones.' },
  fichajes: { eyebrow: 'Mercado competitivo', title: 'Vacantes y fichajes', description: 'Publica necesidades, revisa atletas disponibles y gestiona oportunidades.' },
  matchday: { eyebrow: 'Operación competitiva', title: 'Convocatorias y matchday', description: 'Encuentros, filtros y reportes de resultados asociados al equipo.' },
  estadisticas: { eyebrow: 'Análisis del club', title: 'Estadísticas del equipo', description: 'Capacidad de plantilla, actividad competitiva y datos consolidados del club.' },
  historial: { eyebrow: 'Memoria institucional', title: 'Historial del club', description: 'Palmarés, competición actual y principales hitos registrados.' },
  mensajes: { eyebrow: 'Comunicación interna', title: 'Chat del club', description: 'Conversaciones de plantilla, fichajes y coordinación competitiva.' },
  ajustes: { eyebrow: 'Administración', title: 'Configuración del club', description: 'Actualiza identidad, imágenes, datos institucionales y presencia digital.' },
};

export function ClubWorkspaceView({ gameSlug, section = 'resumen' }: { gameSlug: string; section?: ClubWorkspaceSection }) {
  const { currentUser } = useAuth();
  const { userTeams, refetchTeams } = useTeams();
  const game = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const base = `/${game.slug}/club`;
  const copy = sectionCopy[section];
  const team = useMemo(() => findManagedTeamForUser(userTeams, currentUser, game.slug), [currentUser, game.slug, userTeams]);
  const [squad, setSquad] = useState<SquadMemberData[]>([]);
  const [isLoadingSquad, setIsLoadingSquad] = useState(true);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [matches, setMatches] = useState<ClubMatchSummary[]>([]);
  const [transferRequests, setTransferRequests] = useState<CaptainRequestSummary[]>([]);
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntrySummary[]>([]);

  const loadSquad = useCallback(async () => {
    if (!team?.id) return;
    try {
      const result = await getTeamSquadAction(team.id);
      if (result.success) setSquad(result.squad || []);
    } finally {
      setIsLoadingSquad(false);
    }
  }, [team?.id]);

  useEffect(() => {
    if (['resumen', 'plantilla', 'estadisticas'].includes(section)) void loadSquad();
  }, [loadSquad, section]);

  useEffect(() => {
    if (!team?.id || section !== 'resumen') return;
    let active = true;
    Promise.all([
      getCaptainDashboardDataAction(team.id),
      fetch(`/api/matches?gameSlug=${encodeURIComponent(game.slug)}`).then((response) => response.json()),
    ]).then(([dashboard, matchPayload]) => {
      if (!active) return;
      if (dashboard.success) {
        setTransferRequests((dashboard.transferRequests || []) as CaptainRequestSummary[]);
        setCompetitionEntries((dashboard.competitionEntries || []) as CompetitionEntrySummary[]);
      }
      const allMatches = (matchPayload?.matches || []) as ClubMatchSummary[];
      setMatches(allMatches.filter((match) => (match.teamHomeId || match.homeTeamId) === team.id || (match.teamAwayId || match.awayTeamId) === team.id));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [game.slug, section, team?.id]);

  if (!team) {
    return (
      <ManagementPage className="context-workspace">
        <ManagementHero
          eyebrow="Espacio de club"
          title="Aún no administras un club"
          description="El panel del club se habilita cuando eres capitán o encargado de una escuadra en esta disciplina."
          icon={Shield}
          tone="violet"
          badge={game.name}
        />
        <ManagementSection
          title="Continúa desde tu espacio de atleta"
          description="Puedes revisar ofertas, tu ficha o equipos asociados mientras se confirma la vinculación."
          icon={Sparkles}
          tone="cyan"
        >
          <WorkspaceEmpty
            icon={Shield}
            title={`Sin club administrable en ${game.name}`}
            description="Si ya perteneces a uno, solicita al capitán que te registre como encargado."
            action={
              <Link href={`/${game.slug}/atleta`} className="w-full sm:w-auto mt-2 inline-block">
                <Button className="w-full sm:w-auto">
                  Ir a mi panel de atleta
                  <Eye className="size-4" />
                </Button>
              </Link>
            }
          />
        </ManagementSection>
      </ManagementPage>
    );
  }

  const publicTeamHref = `/${game.slug}/equipos/${team.id}`;
  const memberCount = squad.length || team.membersCount || team.members?.length || 0;
  const capacity = team.maxMembers || Math.max(memberCount, 1);

  return (
    <ManagementPage className="context-workspace">
      <ManagementHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        icon={Shield}
        tone="violet"
        badge={game.name}
        actions={
          <Link href={publicTeamHref} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Eye className="size-4" />
              Ver ficha pública
            </Button>
          </Link>
        }
      >
        <div className="context-workspace-identity">
          <Avatar fallback={team.tag || team.name} src={team.logoUrl} status="online" size="lg" />
          <div>
            <strong>{team.name}</strong>
            <span>{team.tag} · {team.platform}</span>
          </div>
          <Badge variant={team.status === 'ACTIVO' ? 'emerald' : 'slate'}>
            {team.status}
          </Badge>
        </div>
      </ManagementHero>

      {!['mensajes', 'ajustes', 'ficha', 'matchday', 'fichajes'].includes(section) ? (
        <ManagementMetrics>
          <MetricCard label="Plantilla" value={memberCount} hint={`Capacidad: ${capacity}`} icon={Users} tone="cyan" />
          <MetricCard label="Solicitudes" value={transferRequests.length} hint="Pendientes de respuesta" icon={UserPlus} tone="violet" />
          <MetricCard label="Competencias" value={competitionEntries.length} hint="Inscripciones del club" icon={Trophy} tone="gold" />
          <MetricCard label="Próximos" value={matches.filter((match) => !match.status.toUpperCase().includes('FINAL')).length} hint="Partidos programados" icon={CalendarCheck} tone="cyan" />
        </ManagementMetrics>
      ) : null}

      {section === 'resumen' ? (
        <ClubOverview
          base={base}
          team={team}
          memberCount={memberCount}
          matches={matches}
          transferRequests={transferRequests}
          competitionEntries={competitionEntries}
        />
      ) : null}
      {section === 'ficha' ? (
        <div className="context-workspace-embedded">
          <TeamProfileView team={team} brandColor={game.brandColor} />
        </div>
      ) : null}
      {section === 'plantilla' ? (
        <ClubRoster
          team={team}
          squad={squad}
          loading={isLoadingSquad}
          onManage={() => setIsRosterOpen(true)}
        />
      ) : null}
      {section === 'fichajes' ? (
        <div className="context-workspace-embedded">
          <TransferMarket game={game} />
        </div>
      ) : null}
      {section === 'matchday' ? (
        <div className="context-workspace-embedded">
          <MatchdayReportView />
        </div>
      ) : null}
      {section === 'estadisticas' ? (
        <ClubStats
          team={team}
          memberCount={memberCount}
          capacity={capacity}
        />
      ) : null}
      {section === 'historial' ? (
        <ClubHistory team={team} />
      ) : null}
      {section === 'mensajes' ? (
        <ManagementSection
          title="Conversaciones del club"
          description="Coordinación interna y contactos de mercado."
          icon={MessageSquare}
          tone="violet"
          className="[&>div:last-child]:p-0"
        >
          <ChatSystem />
        </ManagementSection>
      ) : null}
      {section === 'ajustes' ? (
        <div className="context-workspace-embedded">
          <ClubSettingsView team={team} activeGameSlug={game.slug} refetchTeams={refetchTeams} />
        </div>
      ) : null}

      <SquadRosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        team={{
          id: team.id,
          name: team.name,
          tag: team.tag,
          game_slug: team.gameSlug,
          members_count: memberCount,
          max_members: capacity,
          logo_text: team.logoText,
          logo_url: team.logoUrl,
        }}
        onRosterUpdated={() => void loadSquad()}
      />
    </ManagementPage>
  );
}
