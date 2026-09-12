'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Activity,
  BriefcaseBusiness,
  Eye,
  MessageSquare,
  Star,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth, useTeams } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  ManagementHero,
  ManagementMetrics,
  ManagementPage,
  ManagementSection,
  MetricCard,
} from '@/components/dashboard/management-ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { PlayerProfileView, type PlayerData } from '@/components/players/player-profile-view';
import {
  getAthleteTransferHistoryAction,
  getPlayerContractOffersAction,
  respondPlayerContractOfferAction,
} from '@/app/actions/transfers';
import { getUserEnrolledTeamsAction } from '@/app/actions/squads';
import type { AthleteWorkspaceSection } from '@/lib/workspace-sections';
import {
  AthleteOverview,
  AthleteStats,
  AthleteOffers,
  AthleteTeams,
  AthleteHistory,
  WorkspaceLoading,
  type AthleteMatchSummary,
  type AthleteTeamSummary,
  type ContractOffer,
  type TransferHistoryEntry,
  type AthleteStatsData,
} from '@/components/workspaces/athlete-workspace-components';

const ChatSystem = dynamic(() => import('@/components/chat/chat-system').then((module) => module.ChatSystem), {
  loading: () => <WorkspaceLoading />,
});
const UserProfileSettingsView = dynamic(() => import('@/components/user/user-profile-settings-view').then((module) => module.UserProfileSettingsView), {
  loading: () => <WorkspaceLoading />,
});

const sectionCopy: Record<AthleteWorkspaceSection, { eyebrow: string; title: string; description: string }> = {
  resumen: { eyebrow: 'Centro personal', title: 'Panel del atleta', description: 'Tu actividad competitiva, situación contractual y accesos principales dentro de esta disciplina.' },
  ficha: { eyebrow: 'Identidad competitiva', title: 'Mi ficha de atleta', description: 'Revisa cómo se presenta tu identidad deportiva y abre la versión pública que ven clubes y visitantes.' },
  estadisticas: { eyebrow: 'Rendimiento individual', title: 'Estadísticas del atleta', description: 'Indicadores deportivos, evolución reciente y métricas principales de tu desempeño.' },
  ofertas: { eyebrow: 'Mercado de fichajes', title: 'Ofertas y contratos', description: 'Consulta y responde propuestas reales enviadas por los clubes de la disciplina.' },
  equipos: { eyebrow: 'Trayectoria vigente', title: 'Mis equipos', description: 'Consulta tu vínculo actual, rol dentro de la plantilla y accesos a la ficha del club.' },
  historial: { eyebrow: 'Registro deportivo', title: 'Historial competitivo', description: 'Movimientos de mercado y cambios de club registrados en tu trayectoria.' },
  mensajes: { eyebrow: 'Comunicación', title: 'Centro de mensajes', description: 'Conversaciones con clubes, organizadores y otros participantes sin abandonar tu espacio privado.' },
  ajustes: { eyebrow: 'Cuenta y preferencias', title: 'Configuración del atleta', description: 'Administra identidad, gamertags, disciplina, privacidad, contacto y seguridad de tu cuenta.' },
};

export function AthleteWorkspaceView({ gameSlug, section = 'resumen' }: { gameSlug: string; section?: AthleteWorkspaceSection }) {
  const { currentUser } = useAuth();
  const { userTeams = [] } = useTeams();
  const game = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const base = `/${game.slug}/atleta`;
  const copy = sectionCopy[section];
  const [offers, setOffers] = useState<ContractOffer[]>([]);
  const [history, setHistory] = useState<TransferHistoryEntry[]>([]);
  const [stats, setStats] = useState<AthleteStatsData | null>(null);
  const [teams, setTeams] = useState<AthleteTeamSummary[]>([]);
  const [matches, setMatches] = useState<AthleteMatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offerDecision, setOfferDecision] = useState<{ offer: ContractOffer; accept: boolean } | null>(null);
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const loadMarketData = useCallback(async () => {
    if (!currentUser?.id || !['resumen', 'ofertas', 'historial'].includes(section)) return;
    try {
      const [offersResult, historyResult] = await Promise.all([
        getPlayerContractOffersAction(currentUser.id, game.slug),
        getAthleteTransferHistoryAction(currentUser.id),
      ]);
      if (offersResult.success) setOffers((offersResult.data || []) as ContractOffer[]);
      if (historyResult.success) {
        const payload = historyResult.data as { recentTransfers?: TransferHistoryEntry[] } | undefined;
        setHistory(payload?.recentTransfers || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, game.slug, section]);

  const loadTeamsData = useCallback(async () => {
    if (!currentUser?.id || !['resumen', 'equipos'].includes(section)) return;
    try {
      const result = await getUserEnrolledTeamsAction(currentUser.id, game.slug);
      if (!result.success) return;
      const enrolled = (result.teams || []) as AthleteTeamSummary[];
      setTeams(enrolled);
      const response = await fetch(`/api/matches?gameSlug=${encodeURIComponent(game.slug)}&_t=${Date.now()}`, { cache: 'no-store' });
      const payload = await response.json() as { matches?: AthleteMatchSummary[] };
      const teamIds = new Set(enrolled.map((team) => team.id));
      setMatches((payload.matches || []).filter((match) => teamIds.has(match.teamHomeId || match.homeTeamId || '') || teamIds.has(match.teamAwayId || match.awayTeamId || '')));
    } catch {
      // ignore
    }
  }, [currentUser?.id, game.slug, section]);

  const loadUserData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`/api/users?id=${encodeURIComponent(currentUser.id)}&gameSlug=${encodeURIComponent(game.slug)}&_t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const aggregated = payload?.data?.user?.aggregatedStats || payload?.user?.aggregatedStats;
      if (!aggregated) return;
      setStats({
        matches: Number(aggregated.matches || 0),
        goals: Number(aggregated.goals || aggregated.kills || 0),
        assists: Number(aggregated.assists || 0),
        mvps: Number(aggregated.mvps || aggregated.mvp || 0),
        winrate: aggregated.winrate ? `${aggregated.winrate}${String(aggregated.winrate).includes('%') ? '' : '%'}` : '—',
      });
    } catch {
      // ignore
    }
  }, [currentUser?.id, game.slug]);

  useEffect(() => {
    void loadMarketData();
    void loadTeamsData();
    void loadUserData();
  }, [loadMarketData, loadTeamsData, loadUserData]);

  useEffect(() => {
    const handleUpdate = () => {
      void loadUserData();
      void loadTeamsData();
      void loadMarketData();
    };
    window.addEventListener('user_profile_updated', handleUpdate);
    window.addEventListener('refetch_user_profile', handleUpdate);
    window.addEventListener('teams_updated', handleUpdate);
    return () => {
      window.removeEventListener('user_profile_updated', handleUpdate);
      window.removeEventListener('refetch_user_profile', handleUpdate);
      window.removeEventListener('teams_updated', handleUpdate);
    };
  }, [loadUserData, loadTeamsData, loadMarketData]);

  const respondToOffer = async () => {
    if (!offerDecision || !currentUser?.id) return;
    startOperation(`${offerDecision.accept ? 'Aceptar' : 'Rechazar'} oferta · ${offerDecision.offer.teamName}`);
    const result = await respondPlayerContractOfferAction(offerDecision.offer.id, currentUser.id, offerDecision.accept);
    if (result.success) {
      endSuccess(offerDecision.accept ? 'Contrato aceptado. Tu vinculación fue actualizada.' : 'Oferta rechazada correctamente.');
      setOfferDecision(null);
      await loadMarketData();
    } else {
      endError(result.error || 'No fue posible responder la oferta.');
    }
  };

  const activeUser = currentUser;

  // Resolve team
  const resolvedTeam = useMemo(() => {
    if (!activeUser) {
      return {
        id: undefined,
        name: 'Agencia libre',
        tag: undefined,
        logoUrl: undefined,
        bannerUrl: undefined,
      };
    }
    let found = userTeams?.find((t) => t.id === activeUser.teamId);
    if (!found) {
      found = userTeams?.find((t) => t.gameSlug === game.slug && t.members?.some((m) => m.id === activeUser.id));
    }
    if (found) {
      return {
        id: found.id,
        name: found.name,
        tag: found.tag,
        logoUrl: found.logoUrl,
        bannerUrl: found.bannerUrl,
      };
    }
    if (activeUser.teamName) {
      return {
        id: activeUser.teamId,
        name: activeUser.teamName,
        tag: (activeUser as any)?.teamTag,
        logoUrl: (activeUser as any)?.teamLogoUrl,
        bannerUrl: (activeUser as any)?.teamBannerUrl,
      };
    }
    return {
      id: undefined,
      name: 'Agencia libre',
      tag: undefined,
      logoUrl: undefined,
      bannerUrl: undefined,
    };
  }, [activeUser, game.slug, userTeams]);

  // Resolve avatar URL
  const resolvedAvatarUrl = useMemo(() => {
    const raw = activeUser?.avatarUrl || activeUser?.foto || (activeUser as any)?.avatar_url;
    if (raw && raw.trim() !== '') return raw;
    return undefined;
  }, [activeUser]);

  // Resolve banner URL
  const resolvedBannerUrl = useMemo(() => {
    const raw = activeUser?.bannerUrl || (activeUser as any)?.banner_url;
    if (raw && raw.trim() !== '' && raw !== '/images/default/banner-default.jpg') return raw;
    return game.bannerUrl || '/images/games-background/eafc.jpg';
  }, [activeUser, game.bannerUrl]);

  const player = useMemo<PlayerData>(() => ({
    id: activeUser?.id || 'perfil',
    name: activeUser?.name || 'Atleta',
    gamertag: activeUser?.gamertag || 'Gamertag',
    position: activeUser?.position || game.positions?.[0] || 'DFC',
    secondaryPosition: activeUser?.secondaryPosition || undefined,
    nacionalidad: activeUser?.nacionalidad || (activeUser as any)?.country || 'Chile',
    telefono: activeUser?.telefono || (activeUser as any)?.phone,
    instagram: activeUser?.instagram || (activeUser as any)?.socialMedia?.instagram,
    twitch: activeUser?.twitch || (activeUser as any)?.socialMedia?.twitch,
    youtube: activeUser?.youtube || (activeUser as any)?.socialMedia?.youtube,
    discord: activeUser?.discord || (activeUser as any)?.socialMedia?.discord,
    whatsapp: activeUser?.whatsapp || (activeUser as any)?.socialMedia?.whatsapp,
    teamName: resolvedTeam.name,
    teamId: resolvedTeam.id,
    teamTag: resolvedTeam.tag,
    teamLogoUrl: resolvedTeam.logoUrl,
    teamBannerUrl: resolvedTeam.bannerUrl,
    rating: Number(activeUser?.rating || 85),
    platform: activeUser?.platform || 'CROSSPLAY',
    avatarUrl: resolvedAvatarUrl,
    bannerUrl: resolvedBannerUrl,
    gameSlug: game.slug,
    role: activeUser?.role || 'Jugador',
    status: activeUser?.status || 'Atleta Activo',
    bio: activeUser?.biografia || (activeUser as any)?.bio || `Atleta oficial compitiendo en el circuito profesional de ${game.name}.`,
    stats: stats || {
      matches: 0,
      goals: 0,
      assists: 0,
      mvps: 0,
      winrate: '0%',
    },
  }), [activeUser, game, resolvedAvatarUrl, resolvedBannerUrl, resolvedTeam, stats]);

  const publicProfileHref = `/${game.slug}/jugadores/${player.id}`;

  if (section === 'ficha') {
    return (
      <div className="w-full min-h-screen pt-0 pb-12 relative animate-in fade-in duration-200">
        <PlayerProfileView
          player={player}
          brandColor={game.brandColor}
          context="game"
          backHref={base}
          isOwner={true}
        />
      </div>
    );
  }

  return (
    <ManagementPage className="context-workspace">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />
      <ManagementHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        icon={User}
        tone="cyan"
        badge={game.name}
        actions={
          <Link href={publicProfileHref} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Eye className="size-4" />
              Ver ficha pública
            </Button>
          </Link>
        }
      >
        <div className="context-workspace-identity">
          <Avatar fallback={player.name} src={player.avatarUrl} status="online" size="lg" />
          <div>
            <strong>{player.name}</strong>
            <span>@{player.gamertag} · {player.position}</span>
          </div>
          <Badge variant={resolvedTeam.name !== 'Agencia libre' ? 'emerald' : 'gold'}>
            {resolvedTeam.name}
          </Badge>
        </div>
      </ManagementHero>

      {section !== 'mensajes' && section !== 'ajustes' ? (
        <ManagementMetrics>
          <MetricCard label="Valoración" value={player.rating || '—'} hint="Rating competitivo" icon={Star} tone="gold" />
          <MetricCard label="Partidos" value={stats?.matches ?? '—'} hint="Resultados registrados" icon={Trophy} tone="cyan" />
          <MetricCard label="Victorias" value={stats?.winrate ?? '—'} hint="Promedio registrado" icon={Activity} tone="emerald" />
          <MetricCard label="Ofertas" value={offers.length} hint="Contratos pendientes" icon={BriefcaseBusiness} tone="violet" />
        </ManagementMetrics>
      ) : null}

      {section === 'resumen' ? (
        <AthleteOverview
          base={base}
          player={player}
          teams={teams}
          matches={matches}
          offerCount={offers.length}
        />
      ) : null}
      {section === 'estadisticas' ? <AthleteStats stats={stats} /> : null}
      {section === 'ofertas' ? (
        <AthleteOffers
          offers={offers}
          loading={isLoading}
          onDecision={(offer, accept) => setOfferDecision({ offer, accept })}
        />
      ) : null}
      {section === 'equipos' ? (
        <AthleteTeams
          player={player}
          gameSlug={game.slug}
          teams={teams}
        />
      ) : null}
      {section === 'historial' ? (
        <AthleteHistory
          history={history}
          loading={isLoading}
        />
      ) : null}
      {section === 'mensajes' ? (
        <ManagementSection
          title="Conversaciones"
          description="Canales privados y soporte competitivo."
          icon={MessageSquare}
          tone="cyan"
          className="[&>div:last-child]:p-0"
        >
          <ChatSystem />
        </ManagementSection>
      ) : null}
      {section === 'ajustes' ? (
        <div className="context-workspace-embedded">
          <UserProfileSettingsView brandColor={game.brandColor} embedded />
        </div>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(offerDecision)}
        onClose={() => setOfferDecision(null)}
        onConfirm={respondToOffer}
        title={offerDecision?.accept ? 'Aceptar contrato' : 'Rechazar oferta'}
        description={`${offerDecision?.accept ? 'Confirmas tu incorporación a' : 'Descartarás la propuesta de'} ${offerDecision?.offer.teamName || 'este club'}.`}
        confirmText={offerDecision?.accept ? 'Aceptar contrato' : 'Rechazar oferta'}
        variant={offerDecision?.accept ? 'success' : 'danger'}
        consequences={offerDecision?.accept ? ['La vinculación actualizará tu club actual.', 'La operación quedará registrada en tu historial.'] : ['La propuesta dejará de estar disponible.']}
      />
    </ManagementPage>
  );
}
