'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  MessageSquare,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { ManagementSection } from '@/components/dashboard/management-ui';
import type { PlayerData } from '@/components/players/player-profile-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ContractOffer {
  id: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  position: string;
  pitchMessage: string;
  status: string;
  createdAt: string;
}

export interface TransferHistoryEntry {
  id: string;
  fromTeamName: string;
  toTeamName: string;
  signedAt: string;
  transferType: string;
}

export interface AthleteStatsData {
  matches: number;
  goals: number;
  assists: number;
  mvps: number;
  winrate: string;
}

export interface AthleteTeamSummary {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  tacticalPosition: string;
  roleInTeam: string;
  organizations: Array<{ id: string; name: string; competitions: string[] }>;
}

export interface AthleteMatchSummary {
  id: string;
  teamHomeId?: string | null;
  homeTeamId?: string | null;
  teamAwayId?: string | null;
  awayTeamId?: string | null;
  home_team_name: string;
  away_team_name: string;
  scoreHome?: number | null;
  scoreAway?: number | null;
  scheduled_at?: string | null;
  status: string;
}

/**
 * Resumen principal del atleta con accesos directos, hechos deportivos y partidos.
 */
export function AthleteOverview({
  base,
  player,
  teams,
  matches,
  offerCount,
}: {
  base: string;
  player: PlayerData;
  teams: AthleteTeamSummary[];
  matches: AthleteMatchSummary[];
  offerCount: number;
}) {
  const shortcuts: Array<{ href: string; label: string; detail: string; icon: LucideIcon }> = [
    { href: `${base}/ficha`, label: 'Ficha pública', detail: 'Revisa tu presentación', icon: User },
    { href: `${base}/estadisticas`, label: 'Rendimiento', detail: 'Analiza tus métricas', icon: BarChart3 },
    { href: `${base}/ofertas`, label: 'Contratos', detail: 'Gestiona propuestas', icon: FileText },
    { href: `${base}/mensajes`, label: 'Mensajes', detail: 'Habla con clubes', icon: MessageSquare },
  ];

  const finished = matches
    .filter((match) => ['FINALIZADO', 'FINALIZADA', 'COMPLETADO'].includes(match.status.toUpperCase()))
    .slice(0, 3);

  const upcoming = matches
    .filter((match) => !['FINALIZADO', 'FINALIZADA', 'COMPLETADO', 'CANCELADO'].includes(match.status.toUpperCase()))
    .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())
    .slice(0, 3);

  return (
    <div className="context-workspace-grid">
      {shortcuts.map(({ href, label, detail, icon: Icon }) => (
        <Link key={href} href={href} className="context-workspace-shortcut">
          <Icon />
          <div>
            <strong>{label}</strong>
            <span>{detail}</span>
          </div>
          <ArrowRight />
        </Link>
      ))}

      <ManagementSection
        title="Situación deportiva"
        description="Resumen de todos tus vínculos, independiente de la organización."
        icon={Shield}
        tone="cyan"
        className="context-workspace-wide"
      >
        <div className="context-workspace-facts">
          <div>
            <span>Equipos vinculados</span>
            <strong>{teams.length || (player.teamId ? 1 : 0)}</strong>
          </div>
          <div>
            <span>Ofertas pendientes</span>
            <strong>{offerCount}</strong>
          </div>
          <div>
            <span>Posición</span>
            <strong>{player.position}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{player.status || 'Disponible'}</strong>
          </div>
        </div>
      </ManagementSection>

      <AthleteMatchSummarySection
        title="Últimos resultados"
        matches={finished}
        empty="Aún no hay resultados registrados para tus equipos."
      />
      <AthleteMatchSummarySection
        title="Próximos partidos"
        matches={upcoming}
        empty="No tienes partidos próximos programados."
      />
    </div>
  );
}

/**
 * Sección de rendimiento deportivo y estadísticas agregadas.
 */
export function AthleteStats({ stats }: { stats: AthleteStatsData | null }) {
  return (
    <ManagementSection
      title="Rendimiento registrado"
      description="Datos agregados desde los reportes oficiales de encuentros."
      icon={BarChart3}
      tone="emerald"
    >
      {stats && stats.matches > 0 ? (
        <div className="context-workspace-facts">
          <div>
            <span>Partidos</span>
            <strong>{stats.matches}</strong>
          </div>
          <div>
            <span>Goles / kills</span>
            <strong>{stats.goals}</strong>
          </div>
          <div>
            <span>Asistencias</span>
            <strong>{stats.assists}</strong>
          </div>
          <div>
            <span>Victorias</span>
            <strong>{stats.winrate}</strong>
          </div>
        </div>
      ) : (
        <WorkspaceEmpty
          icon={BarChart3}
          title="Aún no hay estadísticas verificadas"
          description="Los indicadores aparecerán cuando existan reportes oficiales vinculados a tu usuario."
        />
      )}
    </ManagementSection>
  );
}

/**
 * Sección de propuestas de fichajes y contratos recibidos.
 */
export function AthleteOffers({
  offers,
  loading,
  onDecision,
}: {
  offers: ContractOffer[];
  loading: boolean;
  onDecision: (offer: ContractOffer, accept: boolean) => void;
}) {
  return (
    <ManagementSection
      title="Propuestas recibidas"
      description="Contratos pendientes de una respuesta."
      icon={FileText}
      tone="violet"
    >
      {loading ? (
        <WorkspaceLoading />
      ) : offers.length ? (
        <div className="context-record-list">
          {offers.map((offer) => (
            <article key={offer.id}>
              <div className="context-record-icon">{offer.teamTag?.slice(0, 2) || 'CL'}</div>
              <div>
                <strong>{offer.teamName}</strong>
                <span>{offer.position} · {offer.pitchMessage}</span>
                <small>
                  <Clock3 />
                  {new Date(offer.createdAt).toLocaleDateString('es-CL')}
                </small>
              </div>
              <div className="context-record-actions">
                <Button size="sm" onClick={() => onDecision(offer, true)} className="w-full sm:w-auto">
                  <CheckCircle2 className="size-3.5" />
                  Aceptar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDecision(offer, false)} className="w-full sm:w-auto">
                  Rechazar
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <WorkspaceEmpty
          icon={Sparkles}
          title="No tienes ofertas pendientes"
          description="Cuando un club envíe una propuesta contractual aparecerá aquí."
        />
      )}
    </ManagementSection>
  );
}

/**
 * Sección de equipos vinculados del atleta.
 */
export function AthleteTeams({
  player,
  gameSlug,
  teams,
}: {
  player: PlayerData;
  gameSlug: string;
  teams: AthleteTeamSummary[];
}) {
  return (
    <ManagementSection
      title="Vínculos de plantilla"
      description="Equipos y organizaciones registrados de forma independiente para la disciplina activa."
      icon={Users}
      tone="cyan"
    >
      {teams.length ? (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="context-team-card">
              <Shield className="size-6 text-[var(--app-accent)] shrink-0" />
              <div>
                <strong>{team.name}</strong>
                <span>{team.roleInTeam || player.role || 'Jugador'} · {team.tacticalPosition || player.position}</span>
                <small className="mt-1 block text-[10px] text-[var(--text-muted)]">
                  {team.organizations?.map((organization) => `${organization.name}${organization.competitions.length ? `: ${organization.competitions.join(', ')}` : ''}`).join(' · ') || 'Sin competencia vinculada'}
                </small>
              </div>
              <Link href={`/${gameSlug}/equipos/${team.id}`} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Abrir ficha pública
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : player.teamId ? (
        <div className="context-team-card">
          <Shield className="size-6 text-[var(--app-accent)] shrink-0" />
          <div>
            <strong>{player.teamName}</strong>
            <span>{player.role || 'Jugador'} · {player.position}</span>
          </div>
          <Link href={`/${gameSlug}/equipos/${player.teamId}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Abrir ficha pública
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <WorkspaceEmpty
          icon={BriefcaseBusiness}
          title="Actualmente eres agente libre"
          description="Mantén tu ficha actualizada para recibir propuestas de clubes."
        />
      )}
    </ManagementSection>
  );
}

/**
 * Sección de historial de traspasos del atleta.
 */
export function AthleteHistory({
  history,
  loading,
}: {
  history: TransferHistoryEntry[];
  loading: boolean;
}) {
  return (
    <ManagementSection
      title="Movimientos registrados"
      description="Historial verificable de incorporaciones y salidas."
      icon={History}
      tone="gold"
    >
      {loading ? (
        <WorkspaceLoading />
      ) : history.length ? (
        <div className="context-timeline">
          {history.map((entry) => (
            <div key={entry.id}>
              <i />
              <div>
                <strong>{entry.fromTeamName} → {entry.toTeamName}</strong>
                <span>{entry.transferType} · {new Date(entry.signedAt).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <WorkspaceEmpty
          icon={History}
          title="Sin movimientos registrados"
          description="Tu historial se completará automáticamente al procesar fichajes."
        />
      )}
    </ManagementSection>
  );
}

/**
 * Subcomponente para renderizar listados de partidos.
 */
export function AthleteMatchSummarySection({
  title,
  matches,
  empty,
}: {
  title: string;
  matches: AthleteMatchSummary[];
  empty: string;
}) {
  return (
    <ManagementSection
      title={title}
      description="Calendario asociado a tus equipos en esta disciplina."
      icon={CalendarDays}
      tone="cyan"
      className="context-workspace-wide"
    >
      {matches.length ? (
        <div className="context-record-list">
          {matches.map((match) => (
            <article key={match.id}>
              <div className="context-record-icon">
                <Trophy />
              </div>
              <div>
                <strong>{match.home_team_name} vs {match.away_team_name}</strong>
                <span>
                  {match.scheduled_at
                    ? new Date(match.scheduled_at).toLocaleString('es-CL')
                    : 'Fecha por confirmar'}
                </span>
              </div>
              <Badge variant={match.status.toUpperCase().includes('FINAL') ? 'slate' : 'cyan'}>
                {match.scoreHome ?? '—'} - {match.scoreAway ?? '—'}
              </Badge>
            </article>
          ))}
        </div>
      ) : (
        <WorkspaceEmpty
          icon={CalendarDays}
          title={empty}
          description="La información aparecerá cuando la organización publique o cierre encuentros."
        />
      )}
    </ManagementSection>
  );
}

export function WorkspaceLoading({ message = 'Cargando información...' }: { message?: string }) {
  return <div className="context-workspace-loading">{message}</div>;
}

export function WorkspaceEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="context-workspace-empty">
      <Icon />
      <strong>{title}</strong>
      <span>{description}</span>
      {action}
    </div>
  );
}
