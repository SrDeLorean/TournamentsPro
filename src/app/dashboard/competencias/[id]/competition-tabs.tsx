'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { CompetitionData, CompetitionTeamData } from '@/app/actions/competitions';
import {
  enrollTeamAction,
  enrollIndividualAthleteAction,
  removeEnrolledTeamAction,
  updateCompetitionStatusAction,
  CompetitionStatus,
} from '@/app/actions/competitions';
import { FixtureGenerator } from './fixture-generator';
import { FixtureScheduleView } from '@/components/tournaments/fixture-schedule-view';
import { ClassificationView } from '@/components/tournaments/classification-view';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  ManagementHero,
  ManagementMetrics,
  ManagementSection,
  ManagementTabs,
  MetricCard,
  type ManagementTab,
} from '@/components/dashboard/management-ui';
import {
  Trophy, Calendar, Shield, Settings, Users, Plus, Trash2, Activity, Zap, Check, UserCheck,
  ArrowLeft, Clock3, Gamepad2, ListChecks, PlayCircle, ExternalLink, AlertTriangle
} from 'lucide-react';

interface CompetitionTabsProps {
  competition: CompetitionData & { qualifiers_per_group?: number };
  enrolledTeams: CompetitionTeamData[];
  availableTeams: AvailableTeam[];
  availableUsers?: AvailableUser[];
  isIndividual?: boolean;
  matches: CompetitionMatch[];
}

export interface AvailableTeam {
  id: string;
  name: string;
  tag?: string | null;
  platform?: string | null;
  game_slug?: string | null;
}

export interface AvailableUser {
  id: string;
  name: string;
  gamertag?: string | null;
  position?: string | null;
  rating?: string | number | null;
  primary_game_slug?: string | null;
}

export interface CompetitionMatch {
  id: string;
  status?: string | null;
  home_team_id?: string | null;
  team_home_id?: string | null;
  away_team_id?: string | null;
  team_away_id?: string | null;
  home_team_name?: string | null;
  away_team_name?: string | null;
  reported_score_home?: number | null;
  reported_score_away?: number | null;
  score_home?: number | null;
  score_away?: number | null;
  matchday_number?: number | null;
  matchday?: number | null;
}

export type CompetitionTabType = 'dashboard' | 'fixture' | 'standings' | 'teams' | 'settings';

export function CompetitionTabs({
  competition,
  enrolledTeams,
  availableTeams,
  availableUsers = [],
  isIndividual = false,
  matches,
}: CompetitionTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Persistir la pestaña activa en la URL (?tab=...)
  const requestedTab = searchParams.get('tab');
  const activeTab: CompetitionTabType = ['dashboard', 'fixture', 'standings', 'teams', 'settings'].includes(requestedTab ?? '')
    ? requestedTab as CompetitionTabType
    : 'dashboard';

  const setActiveTab = (tab: CompetitionTabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [selectedTeamToEnroll, setSelectedTeamToEnroll] = useState<string>('');
  const [teamToRemove, setTeamToRemove] = useState<CompetitionTeamData | null>(null);
  const [statusToApply, setStatusToApply] = useState<CompetitionStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG['eafc26'];

  // Metrics calculation
  const totalMatches = matches.length;
  const playedMatches = matches.filter((m) => m.status === 'TERMINADO' || m.status === 'FINALIZADO').length;
  const pendingMatches = totalMatches - playedMatches;
  const progressPercent = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;

  // 1. Inscribir Equipo
  const handleEnrollTeam = () => {
    if (!selectedTeamToEnroll) return;
    const teamObj = availableTeams.find((t) => t.id === selectedTeamToEnroll);
    if (!teamObj) return;

    startOperation(`Inscripción de Equipo: ${teamObj.name}`);
    startTransition(async () => {
      const res = await enrollTeamAction(competition.id, teamObj.id, teamObj.name, teamObj.tag ?? undefined);
      if (res.success) {
        setSelectedTeamToEnroll('');
        endSuccess(res.message || 'Equipo inscrito correctamente.');
      } else {
        endError(res.error || 'Error al inscribir equipo.');
      }
    });
  };

  // 1.1 Inscribir Atleta Individual (1v1 / 2v2 / Solo / Duos)
  const handleEnrollAthlete = () => {
    if (!selectedTeamToEnroll) return;
    const userObj = availableUsers.find((u) => u.id === selectedTeamToEnroll);
    if (!userObj) return;

    startOperation(`Inscripción de Atleta: ${userObj.gamertag || userObj.name}`);
    startTransition(async () => {
      const res = await enrollIndividualAthleteAction(competition.id, userObj.id, userObj.name, userObj.gamertag ?? undefined);
      if (res.success) {
        setSelectedTeamToEnroll('');
        endSuccess(res.message || 'Atleta inscrito correctamente.');
      } else {
        endError(res.error || 'Error al inscribir atleta.');
      }
    });
  };

  // 2. Retirar Equipo
  const handleRemoveTeam = async () => {
    if (!teamToRemove) return;
    startOperation(`Retiro de participante: ${teamToRemove.team_name}`);
    const res = await removeEnrolledTeamAction(competition.id, teamToRemove.team_id);
    if (!res.success) {
      const message = res.error || 'Error al retirar participante.';
      endError(message);
      throw new Error(message);
    }
    endSuccess(res.message || 'Participante retirado correctamente.');
    setTeamToRemove(null);
  };

  // 3. Cambiar Estado
  const handleStatusChange = async (newStatus: CompetitionStatus) => {
    startOperation(`Cambio de Estado a: ${newStatus}`);
    const res = await updateCompetitionStatusAction(competition.id, newStatus);
    if (!res.success) {
      const message = res.error || 'Error al actualizar estado.';
      endError(message);
      throw new Error(message);
    }
    endSuccess(res.message || 'Estado actualizado.');
    setStatusToApply(null);
  };

  // Standings calculation
  const standingsMap: Record<string, { name: string; tag: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; pts: number }> = {};
  enrolledTeams.forEach((t) => {
    standingsMap[t.team_id] = { name: t.team_name, tag: t.team_tag || 'TEAM', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });

  matches.forEach((m) => {
    const isFinished = m.status === 'TERMINADO' || m.status === 'FINALIZADO';
    const hScore = m.reported_score_home ?? m.score_home;
    const aScore = m.reported_score_away ?? m.score_away;
    const homeId = m.home_team_id ?? m.team_home_id;
    const awayId = m.away_team_id ?? m.team_away_id;

    if (isFinished && homeId && awayId && hScore != null && aScore != null) {
      const h = standingsMap[homeId];
      const a = standingsMap[awayId];
      if (h && a) {
        h.pj += 1;
        a.pj += 1;
        h.gf += hScore;
        h.gc += aScore;
        a.gf += aScore;
        a.gc += hScore;

        if (hScore > aScore) {
          h.pg += 1;
          h.pts += 3;
          a.pp += 1;
        } else if (hScore < aScore) {
          a.pg += 1;
          a.pts += 3;
          h.pp += 1;
        } else {
          h.pe += 1;
          a.pe += 1;
          h.pts += 1;
          a.pts += 1;
        }
      }
    }
  });

  const enrolledSet = new Set(enrolledTeams.map((t) => t.team_id));
  const availableToEnroll = availableTeams.filter(
    (t) => !enrolledSet.has(t.id) && (t.game_slug === competition.game_slug || !t.game_slug)
  );

  const tabButtons: ManagementTab<CompetitionTabType>[] = [
    { id: 'dashboard', label: 'Resumen operativo', shortLabel: 'Resumen', icon: Activity, tone: 'violet' },
    { id: 'fixture', label: 'Fixture y partidos', shortLabel: 'Fixture', icon: Calendar, count: matches.length, tone: 'cyan' },
    { id: 'standings', label: 'Clasificación', shortLabel: 'Tabla', icon: Trophy, tone: 'gold' },
    { id: 'teams', label: isIndividual ? 'Atletas inscritos' : 'Clubes inscritos', shortLabel: 'Inscritos', icon: Users, count: enrolledTeams.length, tone: 'emerald' },
    { id: 'settings', label: 'Configuración', shortLabel: 'Ajustes', icon: Settings, tone: 'crimson' },
  ];

  const participantColumns: ColumnDef<CompetitionTeamData>[] = [
    {
      header: isIndividual ? 'Atleta' : 'Club',
      accessorKey: 'team_name',
      sortable: true,
      cell: (row) => <div><strong className="text-[var(--text-heading)]">{row.team_name}</strong><span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{row.team_tag || 'Sin identificador'}</span></div>,
    },
    { header: 'Estado', accessorKey: 'status', sortable: true, cell: (row) => <span className="competition-status-pill"><Check className="size-3" />{row.status}</span> },
    { header: 'Inscripción', accessorKey: 'enrolled_at', sortable: true, cell: (row) => new Date(row.enrolled_at).toLocaleDateString('es-CL') },
  ];

  const competitionStatusLabel = competition.status === 'Activo' ? 'En curso' : competition.status;

  return (
    <div className="competition-workspace">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      <ConfirmModal
        isOpen={Boolean(teamToRemove)}
        onClose={() => setTeamToRemove(null)}
        onConfirm={handleRemoveTeam}
        title={`Retirar ${isIndividual ? 'atleta' : 'club'}`}
        description={`${teamToRemove?.team_name ?? 'Este participante'} dejará de formar parte de la competencia.`}
        confirmText="Confirmar retiro"
        variant="danger"
        consequences={['Se quitará del listado de participantes.', 'El fixture existente no se regenerará automáticamente.']}
      />

      <ConfirmModal
        isOpen={Boolean(statusToApply)}
        onClose={() => setStatusToApply(null)}
        onConfirm={() => statusToApply ? handleStatusChange(statusToApply) : undefined}
        title="Cambiar estado de competencia"
        description={`La competencia pasará de ${competition.status} a ${statusToApply ?? ''}.`}
        confirmText={`Cambiar a ${statusToApply ?? ''}`}
        variant={statusToApply === 'Deshabilitado' ? 'danger' : 'warning'}
        confirmationText={statusToApply === 'Deshabilitado' ? competition.name : undefined}
        consequences={statusToApply === 'Deshabilitado' ? ['La competencia dejará de estar operativa.', 'Los datos se conservarán mediante eliminación lógica.'] : []}
      />

      <ManagementHero
        eyebrow="Centro de competencia"
        title={competition.name}
        description={`${gameConfig.name} · ${competition.mode_format} · ${isIndividual ? 'modalidad individual' : 'modalidad por equipos'}`}
        icon={Gamepad2}
        tone="violet"
        badge={competitionStatusLabel}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/dashboard/competencias" className="ui-button ui-button-outline inline-flex h-10 w-full items-center justify-center gap-2 px-4 text-sm font-semibold sm:w-auto"><ArrowLeft className="size-4" />Competencias</Link>
            <Link href={`/dashboard/matchday?competition=${competition.id}`} className="ui-button ui-button-primary inline-flex h-10 w-full items-center justify-center gap-2 px-4 text-sm font-bold sm:w-auto"><PlayCircle className="size-4" />Ir a Matchday<ExternalLink className="size-3" /></Link>
          </div>
        }
      >
        <div className="competition-hero-facts">
          <span><Calendar className="size-3.5" />Inicio <strong>{new Date(competition.fecha_inicio).toLocaleDateString('es-CL')}</strong></span>
          <span><Clock3 className="size-3.5" />Término <strong>{competition.fecha_termino ? new Date(competition.fecha_termino).toLocaleDateString('es-CL') : 'Por definir'}</strong></span>
          <span><Shield className="size-3.5" />Organiza <strong>{competition.organizer_name || 'Organización asignada'}</strong></span>
        </div>
      </ManagementHero>

      <ManagementMetrics>
        <MetricCard label={isIndividual ? 'Atletas' : 'Clubes'} value={enrolledTeams.length} hint={`${isIndividual ? availableUsers.length : availableToEnroll.length} disponibles`} icon={Users} tone="emerald" />
        <MetricCard label="Partidos" value={totalMatches} hint={`${pendingMatches} pendientes`} icon={Calendar} tone="cyan" />
        <MetricCard label="Completado" value={`${progressPercent}%`} hint={`${playedMatches} resultados cerrados`} icon={ListChecks} tone="violet" />
        <MetricCard label="Estado" value={competitionStatusLabel} hint={competition.mode_format} icon={Zap} tone="gold" />
      </ManagementMetrics>

      <ManagementTabs tabs={tabButtons} activeTab={activeTab} onChange={setActiveTab} label="Módulos de la competencia" />

      {/* 📌 PESTAÑA 1: DASHBOARD (RESUMEN) */}
      {activeTab === 'dashboard' && (
        <div className="competition-overview-grid animate-in fade-in duration-200">
          <ManagementSection title="Reglas y sistema" description="Configuración competitiva vigente" icon={Shield} tone="violet">
            <dl className="competition-detail-list">
              <div><dt>Modalidad</dt><dd>{competition.mode_format}</dd></div>
              <div><dt>Tipo de torneo</dt><dd>{competition.mode_format?.toLowerCase().includes('playoff') ? 'Playoff' : competition.mode_format?.toLowerCase().includes('hibrid') ? 'Liga híbrida' : 'Liga'}</dd></div>
              <div><dt>Formato de partido</dt><dd>{competition.match_mode === 'IdaVuelta' ? 'Ida y vuelta' : 'Partido único'}</dd></div>
              <div><dt>Mercado</dt><dd>{competition.transfer_market_mode?.replaceAll('_', ' ')}</dd></div>
            </dl>
          </ManagementSection>

          <ManagementSection title="Progreso competitivo" description={`${playedMatches} de ${totalMatches} partidos finalizados`} icon={Activity} tone="cyan">
            <div className="competition-progress" aria-label={`${progressPercent}% completado`}>
              <div className="competition-progress-copy"><strong>{progressPercent}%</strong><span>{pendingMatches ? `${pendingMatches} partidos pendientes` : totalMatches ? 'Calendario completado' : 'Fixture aún no generado'}</span></div>
              <div className="competition-progress-track"><span style={{ width: `${progressPercent}%` }} /></div>
            </div>
          </ManagementSection>

          <ManagementSection title="Próximo paso" description="Acción sugerida para mantener la operación al día" icon={Zap} tone="emerald">
            <div className="competition-next-step">
              <div className="competition-next-step-icon">{totalMatches === 0 ? <Calendar className="size-5" /> : pendingMatches > 0 ? <PlayCircle className="size-5" /> : <Trophy className="size-5" />}</div>
              <div><strong>{totalMatches === 0 ? 'Generar el fixture' : pendingMatches > 0 ? 'Gestionar la jornada' : 'Cerrar la competencia'}</strong><p>{totalMatches === 0 ? 'Define fechas y cruces para habilitar el calendario.' : pendingMatches > 0 ? 'Revisa resultados y actas pendientes en Matchday.' : 'Todos los encuentros registrados están finalizados.'}</p></div>
            </div>
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setActiveTab(totalMatches === 0 ? 'fixture' : pendingMatches > 0 ? 'fixture' : 'settings')}>Continuar operación</Button>
          </ManagementSection>
        </div>
      )}

      {/* ⚙️ PESTAÑA 2: FIXTURE Y PARTIDOS (MOMENTO FIXTURE OFICIAL & SCHEDULE VIEW SIN FILTROS REPETIDOS) */}
      {activeTab === 'fixture' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ManagementSection title="Generación del fixture" description="Configura la estructura, fechas y cruces oficiales" icon={Settings} tone="violet">
            <FixtureGenerator competition={competition} enrolledTeams={enrolledTeams} matches={matches} />
          </ManagementSection>

          <ManagementSection title="Calendario y jornadas" description="Consulta el despliegue operativo de todos los encuentros" icon={Calendar} tone="cyan">
            <FixtureScheduleView
              game={gameConfig}
              initialTournName={competition.name}
              initialTournId={competition.id}
              hideOrgFilter={true}
              hideCompFilter={true}
              hideSearchFilter={true}
              hideHeader={true}
            />
          </ManagementSection>
        </div>
      )}

      {/* 🏆 PESTAÑA 3: TABLA DE POSICIONES (STANDINGS VIEW OFICIAL DE CLASIFICACIÓN SIN FILTROS REPETIDOS) */}
      {activeTab === 'standings' && (
        <ManagementSection title="Tabla de posiciones" description="Rendimiento, puntos y diferencia de cada participante" icon={Trophy} tone="gold" className="animate-in fade-in duration-200">
          <ClassificationView
            game={gameConfig}
            initialTournName={competition.name}
            initialTournId={competition.id}
            hideOrgFilter={true}
            hideCompFilter={true}
            hideSearchFilter={true}
            hideHeader={true}
          />
        </ManagementSection>
      )}

      {/* 🛡️ PESTAÑA 4: INSCRIPCIÓN DE CLUBES O ATLETAS INDIVIDUALES */}
      {activeTab === 'teams' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ManagementSection
            title={isIndividual ? 'Inscribir atleta' : 'Inscribir club'}
            description={`Agrega un participante disponible a ${competition.name}`}
            icon={isIndividual ? UserCheck : Plus}
            tone="emerald"
          >
            <div className="competition-enrollment-control">
              {isIndividual ? (
                <select
                  value={selectedTeamToEnroll}
                  onChange={(e) => setSelectedTeamToEnroll(e.target.value)}
                  className="ui-control w-full min-w-0 flex-1 px-3 text-xs"
                >
                  <option value="">Seleccionar atleta ({availableUsers.length} disponibles)</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.gamertag || 'Sin gamertag'} · {u.position || 'General'}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedTeamToEnroll}
                  onChange={(e) => setSelectedTeamToEnroll(e.target.value)}
                  className="ui-control w-full min-w-0 flex-1 px-3 text-xs"
                >
                  <option value="">Seleccionar club de {gameConfig.name} ({availableToEnroll.length} disponibles)</option>
                  {availableToEnroll.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.tag}] · {t.platform || 'Plataforma no informada'}
                    </option>
                  ))}
                </select>
              )}

              <Button
                onClick={isIndividual ? handleEnrollAthlete : handleEnrollTeam}
                disabled={isPending || !selectedTeamToEnroll}
                className="w-full gap-2 font-black sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isIndividual ? 'Inscribir Atleta' : 'Inscribir Club'}</span>
              </Button>
            </div>
          </ManagementSection>

          <ManagementSection title={isIndividual ? 'Atletas confirmados' : 'Clubes confirmados'} description={`${enrolledTeams.length} participantes habilitados para competir`} icon={Users} tone="emerald">
            <DataTable
              columns={participantColumns}
              data={enrolledTeams}
              searchField={(row) => `${row.team_name} ${row.team_tag || ''}`}
              searchPlaceholder={isIndividual ? 'Buscar atleta...' : 'Buscar club...'}
              emptyMessage="Aún no existen participantes inscritos en esta competencia."
              defaultPageSize={10}
              ariaLabel="Participantes inscritos en la competencia"
              actions={(row) => <Button size="sm" variant="ghost" onClick={() => setTeamToRemove(row)} className="gap-1.5 text-[var(--accent-crimson)]" title="Retirar participante"><Trash2 className="size-3.5" /><span className="hidden sm:inline">Retirar</span></Button>}
            />
          </ManagementSection>
        </div>
      )}

      {/* ⚙️ PESTAÑA 5: CONFIGURACIÓN Y ESTADO */}
      {activeTab === 'settings' && (
        <div className="competition-settings-grid animate-in fade-in duration-200">
          <ManagementSection title="Ciclo de vida" description="Controla la visibilidad y operación general" icon={Settings} tone="gold">
            <div className="competition-status-actions">
              <Button
                onClick={() => setStatusToApply('Borrador')}
                disabled={competition.status === 'Borrador'}
                variant="outline"
              >
                Borrador
              </Button>

              <Button
                onClick={() => setStatusToApply('Activo')}
                disabled={competition.status === 'Activo'}
                variant="outline"
              >
                Activo
              </Button>

              <Button
                onClick={() => setStatusToApply('Finalizado')}
                disabled={competition.status === 'Finalizado'}
                variant="outline"
              >
                Finalizado
              </Button>

              <Button
                onClick={() => setStatusToApply('Deshabilitado')}
                disabled={competition.status === 'Deshabilitado'}
                variant="danger"
              >
                Deshabilitar
              </Button>
            </div>
          </ManagementSection>

          <ManagementSection title="Zona sensible" description="Estas acciones afectan la operación de todos los participantes" icon={AlertTriangle} tone="crimson">
            <div className="competition-danger-note"><AlertTriangle className="size-5" /><div><strong>Protección activa</strong><p>Deshabilitar requiere escribir el nombre exacto de la competencia. Los datos no se eliminan y pueden recuperarse.</p></div></div>
          </ManagementSection>
        </div>
      )}
    </div>
  );
}
