'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  History,
  MessageSquare,
  Shield,
  Shirt,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { ManagementSection } from '@/components/dashboard/management-ui';
import type { TeamData } from '@/lib/data-store';
import type { SquadMemberData } from '@/app/actions/squads';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ClubMatchSummary {
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

export interface CaptainRequestSummary {
  id: string;
  applicant_name?: string;
  applicant_gamertag?: string;
  position?: string;
  status?: string;
}

export interface CompetitionEntrySummary {
  id: string;
  competition_name?: string;
  status?: string;
}

/**
 * Resumen principal del club con accesos directos, hechos institucionales,
 * actividad de partidos y solicitudes de ingreso.
 */
export function ClubOverview({
  base,
  team,
  memberCount,
  matches,
  transferRequests,
  competitionEntries,
}: {
  base: string;
  team: TeamData;
  memberCount: number;
  matches: ClubMatchSummary[];
  transferRequests: CaptainRequestSummary[];
  competitionEntries: CompetitionEntrySummary[];
}) {
  const shortcuts: Array<{ href: string; label: string; detail: string; icon: LucideIcon }> = [
    { href: `${base}/plantilla`, label: 'Plantilla', detail: `${memberCount} integrantes registrados`, icon: Shirt },
    { href: `${base}/fichajes`, label: 'Fichajes', detail: 'Vacantes y mercado', icon: UserPlus },
    { href: `${base}/matchday`, label: 'Matchday', detail: 'Partidos y reportes', icon: CalendarCheck },
    { href: `${base}/mensajes`, label: 'Chat del club', detail: 'Coordina la escuadra', icon: MessageSquare },
  ];

  const finished = matches
    .filter((match) => match.status.toUpperCase().includes('FINAL'))
    .slice(0, 3);

  const upcoming = matches
    .filter((match) => !['FINALIZADO', 'FINALIZADA', 'CANCELADO'].includes(match.status.toUpperCase()))
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
        title="Estado institucional"
        description="Información esencial de la escuadra."
        icon={Shield}
        tone="violet"
        className="context-workspace-wide"
      >
        <div className="context-workspace-facts">
          <div>
            <span>Capitán</span>
            <strong>{team.captainName || 'Sin asignar'}</strong>
          </div>
          <div>
            <span>Solicitudes de plantilla</span>
            <strong>{transferRequests.length}</strong>
          </div>
          <div>
            <span>Competencias vinculadas</span>
            <strong>{competitionEntries.length}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{team.status}</strong>
          </div>
        </div>
      </ManagementSection>

      <ClubMatchSummarySection
        title="Últimos resultados"
        matches={finished}
        empty="Aún no hay resultados cerrados."
      />
      <ClubMatchSummarySection
        title="Próximos partidos"
        matches={upcoming}
        empty="No hay partidos próximos programados."
      />

      {competitionEntries.length ? (
        <ManagementSection
          title="Solicitudes e inscripciones de competencia"
          description="Estado informado por cada organización para este club."
          icon={Trophy}
          tone="gold"
          className="context-workspace-wide"
        >
          <div className="context-record-list">
            {competitionEntries.slice(0, 5).map((entry) => (
              <article key={entry.id}>
                <div className="context-record-icon">
                  <Trophy />
                </div>
                <div>
                  <strong>{entry.competition_name || 'Competencia'}</strong>
                  <span>Inscripción del equipo</span>
                </div>
                <Badge variant={entry.status === 'CONFIRMADO' ? 'cyan' : 'gold'}>
                  {entry.status || 'Pendiente'}
                </Badge>
              </article>
            ))}
          </div>
        </ManagementSection>
      ) : null}

      {transferRequests.length ? (
        <ManagementSection
          title="Solicitudes pendientes"
          description="Jugadores que esperan una respuesta del club."
          icon={UserPlus}
          tone="violet"
          className="context-workspace-wide"
        >
          <div className="context-record-list">
            {transferRequests.slice(0, 4).map((request) => (
              <article key={request.id}>
                <div className="context-record-icon">
                  <UserPlus />
                </div>
                <div>
                  <strong>@{request.applicant_gamertag || request.applicant_name}</strong>
                  <span>{request.position || 'Posición sin indicar'}</span>
                </div>
                <Badge variant="gold">Pendiente</Badge>
              </article>
            ))}
          </div>
        </ManagementSection>
      ) : null}
    </div>
  );
}

/**
 * Subcomponente de resumen de partidos oficiales del club.
 */
export function ClubMatchSummarySection({
  title,
  matches,
  empty,
}: {
  title: string;
  matches: ClubMatchSummary[];
  empty: string;
}) {
  return (
    <ManagementSection
      title={title}
      description="Actividad oficial del equipo."
      icon={CalendarCheck}
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
          icon={CalendarCheck}
          title={empty}
          description="La información aparecerá cuando la organización actualice el calendario."
        />
      )}
    </ManagementSection>
  );
}

/**
 * Sección de nómina y plantilla de integrantes del club.
 */
export function ClubRoster({
  team,
  squad,
  loading,
  onManage,
}: {
  team: TeamData;
  squad: SquadMemberData[];
  loading: boolean;
  onManage: () => void;
}) {
  return (
    <ManagementSection
      title="Nómina registrada"
      description="Integrantes, roles y posiciones del club."
      icon={Users}
      tone="cyan"
      action={
        <Button onClick={onManage} className="w-full sm:w-auto">
          <UserPlus className="size-4" />
          Administrar plantilla
        </Button>
      }
    >
      {loading ? (
        <WorkspaceLoading />
      ) : squad.length ? (
        <div className="context-record-list">
          {squad.map((member) => (
            <article key={member.id}>
              <Avatar
                fallback={member.gamertag || member.user_name}
                src={member.avatar_url || member.foto || undefined}
                size="md"
              />
              <div>
                <strong>{member.gamertag || member.user_name}</strong>
                <span>{member.tactical_position || 'Sin posición'} · {member.role_in_team}</span>
                <small>Desde {new Date(member.joined_at).toLocaleDateString('es-CL')}</small>
              </div>
              <Badge variant={member.role_in_team.includes('Cap') ? 'gold' : 'cyan'}>
                {member.role_in_team}
              </Badge>
            </article>
          ))}
        </div>
      ) : (
        <WorkspaceEmpty
          icon={Users}
          title="Plantilla sin integrantes visibles"
          description={`Abre la gestión de ${team.name} para agregar jugadores.`}
          action={
            <Button onClick={onManage} className="w-full sm:w-auto mt-2">
              Gestionar plantilla
            </Button>
          }
        />
      )}
    </ManagementSection>
  );
}

/**
 * Sección de indicadores institucionales y de rendimiento del club.
 */
export function ClubStats({
  team,
  memberCount,
  capacity,
}: {
  team: TeamData;
  memberCount: number;
  capacity: number;
}) {
  const occupancy = Math.min(Math.round((memberCount / Math.max(capacity, 1)) * 100), 100);
  const profile = team.description && team.logoUrl ? 100 : team.description || team.logoUrl ? 65 : 30;

  return (
    <ManagementSection
      title="Indicadores disponibles"
      description="Datos calculados a partir de la configuración y plantilla registradas."
      icon={BarChart3}
      tone="emerald"
    >
      <div className="context-progress-list">
        {[
          { label: 'Ocupación de plantilla', value: occupancy },
          { label: 'Perfil institucional', value: profile },
        ].map((bar) => (
          <div key={bar.label}>
            <div>
              <span>{bar.label}</span>
              <strong>{bar.value}%</strong>
            </div>
            <div>
              <i style={{ width: `${bar.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </ManagementSection>
  );
}

/**
 * Sección de memoria histórica y palmarés del club.
 */
export function ClubHistory({ team }: { team: TeamData }) {
  const entries = [
    { title: 'Competición vigente', detail: team.disputando || 'Sin competición registrada' },
    { title: 'Palmarés', detail: team.palmares || 'Sin títulos registrados' },
    { title: 'Estado institucional', detail: team.status },
  ];

  return (
    <ManagementSection
      title="Registro del club"
      description="Hitos e información histórica disponible."
      icon={History}
      tone="gold"
    >
      <div className="context-timeline">
        {entries.map((entry) => (
          <div key={entry.title}>
            <i />
            <div>
              <strong>{entry.title}</strong>
              <span>{entry.detail}</span>
            </div>
          </div>
        ))}
      </div>
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
