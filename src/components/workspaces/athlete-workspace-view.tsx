'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  History,
  MessageSquare,
  Sparkles,
  Star,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
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
import type { PlayerData } from '@/components/players/player-profile-view';
import {
  getAthleteTransferHistoryAction,
  getPlayerContractOffersAction,
  respondPlayerContractOfferAction,
} from '@/app/actions/transfers';
import { getUserEnrolledTeamsAction } from '@/app/actions/squads';
import type { AthleteWorkspaceSection } from '@/lib/workspace-sections';
import { AthleteOverview, AthleteTeams, type AthleteMatchSummary, type AthleteTeamSummary } from '@/components/workspaces/athlete-dashboard-summary';

const ChatSystem = dynamic(() => import('@/components/chat/chat-system').then((module) => module.ChatSystem), {
  loading: WorkspaceLoading,
});
const PlayerProfileView = dynamic(() => import('@/components/players/player-profile-view').then((module) => module.PlayerProfileView), {
  loading: WorkspaceLoading,
});
const UserProfileSettingsView = dynamic(() => import('@/components/user/user-profile-settings-view').then((module) => module.UserProfileSettingsView), {
  loading: WorkspaceLoading,
});

interface ContractOffer {
  id: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  position: string;
  pitchMessage: string;
  status: string;
  createdAt: string;
}

interface TransferHistoryEntry {
  id: string;
  fromTeamName: string;
  toTeamName: string;
  signedAt: string;
  transferType: string;
}

interface AthleteStatsData {
  matches: number;
  goals: number;
  assists: number;
  mvps: number;
  winrate: string;
}

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

  useEffect(() => {
    if (!currentUser?.id || !['resumen', 'equipos'].includes(section)) return;
    let active = true;
    getUserEnrolledTeamsAction(currentUser.id, game.slug)
      .then(async (result) => {
        if (!active || !result.success) return;
        const enrolled = (result.teams || []) as AthleteTeamSummary[];
        setTeams(enrolled);
        const response = await fetch(`/api/matches?gameSlug=${encodeURIComponent(game.slug)}`);
        const payload = await response.json() as { matches?: AthleteMatchSummary[] };
        if (!active) return;
        const teamIds = new Set(enrolled.map((team) => team.id));
        setMatches((payload.matches || []).filter((match) => teamIds.has(match.teamHomeId || match.homeTeamId || '') || teamIds.has(match.teamAwayId || match.awayTeamId || '')));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [currentUser?.id, game.slug, section]);

  useEffect(() => {
    void loadMarketData();
  }, [loadMarketData]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    fetch(`/api/users?id=${encodeURIComponent(currentUser.id)}&gameSlug=${encodeURIComponent(game.slug)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!active) return;
        const aggregated = payload?.data?.user?.aggregatedStats || payload?.user?.aggregatedStats;
        if (!aggregated) return;
        setStats({
          matches: Number(aggregated.matches || 0),
          goals: Number(aggregated.goals || aggregated.kills || 0),
          assists: Number(aggregated.assists || 0),
          mvps: Number(aggregated.mvps || aggregated.mvp || 0),
          winrate: aggregated.winrate ? `${aggregated.winrate}${String(aggregated.winrate).includes('%') ? '' : '%'}` : '—',
        });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [currentUser?.id, game.slug]);

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

  const player = useMemo<PlayerData>(() => ({
    id: currentUser?.id || 'atleta',
    name: currentUser?.name || 'Atleta eSports',
    gamertag: currentUser?.gamertag || 'JugadorPro',
    position: currentUser?.position || game.positions?.[0] || 'Jugador',
    secondaryPosition: currentUser?.secondaryPosition,
    nacionalidad: currentUser?.nacionalidad,
    telefono: currentUser?.telefono,
    instagram: currentUser?.instagram,
    twitch: currentUser?.twitch,
    youtube: currentUser?.youtube,
    discord: currentUser?.discord,
    teamName: currentUser?.teamName || 'Agencia libre',
    teamId: currentUser?.teamId,
    rating: Number(currentUser?.rating || 0),
    platform: currentUser?.platform || 'Crossplay',
    avatarUrl: currentUser?.foto,
    bannerUrl: currentUser?.bannerUrl,
    gameSlug: game.slug,
    role: currentUser?.role,
    status: currentUser?.status,
    bio: currentUser?.biografia,
    stats: stats || undefined,
  }), [currentUser, game, stats]);

  const publicProfileHref = `/${game.slug}/jugadores/${currentUser?.id || 'atleta'}`;

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
          <Link href={publicProfileHref}>
            <Button variant="outline" className="w-full sm:w-auto"><Eye className="size-4" />Ver ficha pública</Button>
          </Link>
        }
      >
        <div className="context-workspace-identity">
          <Avatar fallback={player.name} src={player.avatarUrl} status="online" size="lg" />
          <div><strong>{player.name}</strong><span>@{player.gamertag} · {player.position}</span></div>
          <Badge variant={currentUser?.teamName ? 'emerald' : 'gold'}>{currentUser?.teamName || 'Agencia libre'}</Badge>
        </div>
      </ManagementHero>

      {section !== 'mensajes' && section !== 'ajustes' && section !== 'ficha' ? (
        <ManagementMetrics>
          <MetricCard label="Valoración" value={player.rating || '—'} hint="Rating competitivo" icon={Star} tone="gold" />
          <MetricCard label="Partidos" value={stats?.matches ?? '—'} hint="Resultados registrados" icon={Trophy} tone="cyan" />
          <MetricCard label="Victorias" value={stats?.winrate ?? '—'} hint="Promedio registrado" icon={Activity} tone="emerald" />
          <MetricCard label="Ofertas" value={offers.length} hint="Contratos pendientes" icon={BriefcaseBusiness} tone="violet" />
        </ManagementMetrics>
      ) : null}

      {section === 'resumen' ? <AthleteOverview base={base} player={player} teams={teams} matches={matches} offerCount={offers.length} /> : null}
      {section === 'ficha' ? <div className="context-workspace-embedded"><PlayerProfileView player={player} brandColor={game.brandColor} context="game" backHref={base} /></div> : null}
      {section === 'estadisticas' ? <AthleteStats stats={stats} /> : null}
      {section === 'ofertas' ? <AthleteOffers offers={offers} loading={isLoading} onDecision={(offer, accept) => setOfferDecision({ offer, accept })} /> : null}
      {section === 'equipos' ? <AthleteTeams player={player} gameSlug={game.slug} teams={teams} /> : null}
      {section === 'historial' ? <AthleteHistory history={history} loading={isLoading} /> : null}
      {section === 'mensajes' ? <ManagementSection title="Conversaciones" description="Canales privados y soporte competitivo." icon={MessageSquare} tone="cyan" className="[&>div:last-child]:p-0"><ChatSystem /></ManagementSection> : null}
      {section === 'ajustes' ? <div className="context-workspace-embedded"><UserProfileSettingsView brandColor={game.brandColor} embedded /></div> : null}

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

function AthleteStats({ stats }: { stats: AthleteStatsData | null }) {
  return <ManagementSection title="Rendimiento registrado" description="Datos agregados desde los reportes oficiales de encuentros." icon={BarChart3} tone="emerald">{stats && stats.matches > 0 ? <div className="context-workspace-facts"><div><span>Partidos</span><strong>{stats.matches}</strong></div><div><span>Goles / kills</span><strong>{stats.goals}</strong></div><div><span>Asistencias</span><strong>{stats.assists}</strong></div><div><span>Victorias</span><strong>{stats.winrate}</strong></div></div> : <WorkspaceEmpty icon={BarChart3} title="Aún no hay estadísticas verificadas" description="Los indicadores aparecerán cuando existan reportes oficiales vinculados a tu usuario." />}</ManagementSection>;
}

function AthleteOffers({ offers, loading, onDecision }: { offers: ContractOffer[]; loading: boolean; onDecision: (offer: ContractOffer, accept: boolean) => void }) {
  return <ManagementSection title="Propuestas recibidas" description="Contratos pendientes de una respuesta." icon={FileText} tone="violet">{loading ? <WorkspaceLoading /> : offers.length ? <div className="context-record-list">{offers.map((offer) => <article key={offer.id}><div className="context-record-icon">{offer.teamTag?.slice(0, 2) || 'CL'}</div><div><strong>{offer.teamName}</strong><span>{offer.position} · {offer.pitchMessage}</span><small><Clock3 />{new Date(offer.createdAt).toLocaleDateString('es-CL')}</small></div><div className="context-record-actions"><Button size="sm" onClick={() => onDecision(offer, true)}><CheckCircle2 className="size-3.5" />Aceptar</Button><Button size="sm" variant="ghost" onClick={() => onDecision(offer, false)}>Rechazar</Button></div></article>)}</div> : <WorkspaceEmpty icon={Sparkles} title="No tienes ofertas pendientes" description="Cuando un club envíe una propuesta contractual aparecerá aquí." />}</ManagementSection>;
}

function AthleteHistory({ history, loading }: { history: TransferHistoryEntry[]; loading: boolean }) {
  return <ManagementSection title="Movimientos registrados" description="Historial verificable de incorporaciones y salidas." icon={History} tone="gold">{loading ? <WorkspaceLoading /> : history.length ? <div className="context-timeline">{history.map((entry) => <div key={entry.id}><i /><div><strong>{entry.fromTeamName} → {entry.toTeamName}</strong><span>{entry.transferType} · {new Date(entry.signedAt).toLocaleDateString('es-CL')}</span></div></div>)}</div> : <WorkspaceEmpty icon={History} title="Sin movimientos registrados" description="Tu historial se completará automáticamente al procesar fichajes." />}</ManagementSection>;
}

function WorkspaceLoading() { return <div className="context-workspace-loading">Cargando información...</div>; }
function WorkspaceEmpty({ icon: Icon, title, description }: { icon: typeof History; title: string; description: string }) { return <div className="context-workspace-empty"><Icon /><strong>{title}</strong><span>{description}</span></div>; }
