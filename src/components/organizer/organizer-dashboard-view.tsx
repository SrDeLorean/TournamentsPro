'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Check,
  FileCheck,
  ImageIcon,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { OrganizerDashboardHero } from '@/components/organizer/organizer-dashboard-hero';
import { getOrganizerOrganizationAction } from '@/app/actions/organizations';
import {
  GAME_MODES,
  type EnrolledTeam,
  type OrganizerMatch,
  type OrganizerOrganization,
  type OrganizerTournament,
} from '@/components/organizer/organizer-dashboard-model';
import {
  ManagementPage,
  ManagementMetrics,
  ManagementSection,
  ManagementTabs,
  MetricCard,
  type ManagementTab,
} from '@/components/dashboard/management-ui';
import { DashboardInsightMetrics, IdentityWarningsPanel, useDashboardInsights } from '@/components/dashboard/dashboard-insights';

type OrganizerTab = 'approvals' | 'fixture' | 'enrolled' | 'seasons' | 'identity';

export function OrganizerDashboardView() {
  const { currentUser, activeGameSlug, setActiveGameSlug } = useAuth();
  const [activeTab, setActiveTab] = useState<OrganizerTab>('approvals');

  // Selected Game State for Organizer (Synced with global activeGameSlug)
  const selectedGameSlug = activeGameSlug || 'eafc26';
  const setSelectedGameSlug = (slug: string) => {
    setActiveGameSlug(slug);
    setSelectedGameModeId((GAME_MODES[slug] || GAME_MODES.eafc26)[0].id);
  };
  const activeGame = GAMES_CATALOG[selectedGameSlug] || GAMES_CATALOG['eafc26'];

  // Selected Game Mode State (Modalidad de Juego)
  const availableGameModes = GAME_MODES[selectedGameSlug] || GAME_MODES['eafc26'];
  const [selectedGameModeId, setSelectedGameModeId] = useState<string>(availableGameModes[0].id);

  const activeGameMode = availableGameModes.find((m) => m.id === selectedGameModeId) || availableGameModes[0];

  // Organization & Seasons State
  const [userOrg, setUserOrg] = useState<OrganizerOrganization | null>(null);
  const [, setSeasons] = useState<unknown[]>([]);
  const [tournaments, setTournaments] = useState<OrganizerTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('tourn-eafc-liga');

  // Fixture & Matches State
  const [matches, setMatches] = useState<OrganizerMatch[]>([]);
  const [enrolledTeams, setEnrolledTeams] = useState<EnrolledTeam[]>([]);
  const [isGeneratingFixture, setIsGeneratingFixture] = useState<boolean>(false);

  // Approval Modal State
  const [selectedMatchForApproval, setSelectedMatchForApproval] = useState<OrganizerMatch | null>(null);
  const [isFixtureConfirmOpen, setIsFixtureConfirmOpen] = useState(false);
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();
  const { insights, loading: insightsLoading } = useDashboardInsights();

  const fetchSeasonsAndTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/organizer/seasons');
      const data = await res.json();
      if (data.success) {
        setSeasons(data.seasons);
        setTournaments(data.tournaments);
        if (data.tournaments?.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(data.tournaments[0].id);
        }
      }
    } catch (e) {
      console.error('Error cargando temporadas:', e);
    }
  }, [selectedTournamentId]);

  const fetchUserOrganization = useCallback(async () => {
    try {
      // 1. Try server action first (authenticated and multi-provider)
      const actionRes = await getOrganizerOrganizationAction();
      if (actionRes.success && actionRes.organization) {
        setUserOrg(actionRes.organization);
        return;
      }

      // 2. Fallback to API route
      const res = await fetch('/api/organizer/organization');
      const data = await res.json().catch(() => ({}));
      if (data.success && data.organization) {
        setUserOrg(data.organization);
        return;
      }

      // 3. Fallback to public organizations if necessary
      const publicRes = await fetch('/api/organizations');
      const publicData = await publicRes.json().catch(() => ({}));
      if (publicData.success && Array.isArray(publicData.organizations)) {
        const found = (publicData.organizations as OrganizerOrganization[]).find(
          (o) => o.id === currentUser?.organizationId
        );
        if (found) {
          setUserOrg(found);
        }
      }
    } catch (e) {
      console.error('Error cargando organización del usuario:', e);
    }
  }, [currentUser?.organizationId]);

  const fetchFixtureData = useCallback(async () => {
    if (!selectedTournamentId) return;
    try {
      const res = await fetch(`/api/organizer/fixture?tournamentId=${selectedTournamentId}`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
        setEnrolledTeams(data.enrolledTeams);
      }
    } catch (e) {
      console.error('Error cargando fixture:', e);
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([
      fetchSeasonsAndTournaments(),
      fetchUserOrganization(),
    ]));
  }, [fetchSeasonsAndTournaments, fetchUserOrganization]);

  useEffect(() => {
    void Promise.resolve().then(fetchFixtureData);
  }, [fetchFixtureData]);

  // Filtered Tournaments and Teams by Selected Game & Mode
  const filteredTournaments = tournaments.filter(
    (t) => t.game_slug === selectedGameSlug || t.primary_game_slug === selectedGameSlug || !t.game_slug
  );
  const filteredEnrolledTeams = enrolledTeams.filter(
    (t) => t.game_slug === selectedGameSlug || !t.game_slug
  );

  // Generate Fixture with Simultaneous Matchday Hours
  const handleGenerateFixture = async () => {
    if (!selectedTournamentId) return;
    startOperation(`Generación de fixture · ${activeGame.name}`);
    setIsGeneratingFixture(true);
    try {
      const res = await fetch('/api/organizer/fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          format: 'LIGA_ROUND_ROBIN',
          simultaneousHours: '20:00:00',
          modeId: selectedGameModeId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        endSuccess(`Fixture de ${activeGame.name} (${activeGameMode.name}) generado correctamente.`);
        setIsFixtureConfirmOpen(false);
        await fetchFixtureData();
      } else {
        endError(data.error || 'No fue posible generar el fixture.');
      }
    } catch (e) {
      console.error('Error generando fixture:', e);
      endError(e instanceof Error ? e.message : 'No fue posible generar el fixture.');
    } finally {
      setIsGeneratingFixture(false);
    }
  };

  // Grant Approval (Visto Bueno)
  const handleConfirmApproval = async () => {
    if (!selectedMatchForApproval) return;
    startOperation(`Homologación · ${selectedMatchForApproval.home_team_name} vs ${selectedMatchForApproval.away_team_name}`);
    try {
      const res = await fetch('/api/matches/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatchForApproval.id,
          action: 'APPROVE',
          scoreHome: selectedMatchForApproval.reported_score_home || 0,
          scoreAway: selectedMatchForApproval.reported_score_away || 0,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        endSuccess('Resultado homologado y tabla competitiva actualizada.');
        setSelectedMatchForApproval(null);
        await fetchFixtureData();
      } else {
        endError(data.error || 'No fue posible homologar el resultado.');
      }
    } catch (e) {
      console.error('Error aprobando partido:', e);
      endError(e instanceof Error ? e.message : 'No fue posible homologar el resultado.');
    }
  };

  const pendingApprovals = matches.filter((m) => m.status === 'POR_REVISAR');

  const tabs: ManagementTab<OrganizerTab>[] = [
    { id: 'approvals', label: 'Visto bueno', shortLabel: 'Revisión', count: pendingApprovals.length, icon: FileCheck, tone: 'gold' },
    { id: 'fixture', label: `Fixtures ${activeGameMode.format}`, shortLabel: 'Fixtures', count: matches.length, icon: Clock, tone: 'cyan' },
    { id: 'enrolled', label: 'Escuadras inscritas', shortLabel: 'Escuadras', count: filteredEnrolledTeams.length, icon: Shield, tone: 'emerald' },
    { id: 'seasons', label: 'Competencias', count: filteredTournaments.length, icon: Calendar, tone: 'violet' },
    { id: 'identity', label: 'IDs similares', shortLabel: 'Alertas ID', count: insights?.identityWarnings.length ?? 0, icon: Fingerprint, tone: 'crimson' },
  ];

  return (
    <ManagementPage>
      <CrudAlertBanner state={crudState} onClose={resetAlert} />
      <OrganizerDashboardHero
        organization={userOrg}
        selectedGameSlug={selectedGameSlug}
        onGameChange={setSelectedGameSlug}
        gameModes={availableGameModes}
        selectedGameModeId={selectedGameModeId}
        onGameModeChange={setSelectedGameModeId}
      />

      <DashboardInsightMetrics insights={insights} loading={insightsLoading} />

      <ManagementMetrics>
        <MetricCard label="Por revisar" value={pendingApprovals.length} hint="Partidos reportados" icon={FileCheck} tone="gold" />
        <MetricCard label={`Torneos ${activeGameMode.format}`} value={filteredTournaments.length} hint="Competencias activas" icon={Trophy} tone="cyan" />
        <MetricCard label={`Equipos ${activeGame.name}`} value={filteredEnrolledTeams.length} hint="Escuadras inscritas" icon={Shield} tone="emerald" />
        <MetricCard label="Modalidad activa" value={activeGameMode.name} hint={activeGameMode.format} icon={Calendar} tone="violet" />
      </ManagementMetrics>

      <ManagementTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} label="Módulos de operación del organizador" />

      {activeTab === 'identity' ? <IdentityWarningsPanel warnings={insights?.identityWarnings ?? []} selectedGameSlug={selectedGameSlug} /> : null}

      {/* TAB 1: VISTO BUENO */}
      {activeTab === 'approvals' && (
        <ManagementSection
          title="Partidos reportados por capitanes"
          description="Revisa comprobantes y homologa resultados antes de actualizar la clasificación."
          icon={FileCheck}
          tone="gold"
          action={<Badge variant="gold" className="w-fit font-[family-name:var(--font-active)] text-[10px]">
              {pendingApprovals.length} En Espera de Homologación
            </Badge>}
        >
          {pendingApprovals.length === 0 ? (
            <div className="space-y-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-8 text-center">
              <CheckCircle2 className="mx-auto w-8 h-8 text-[var(--app-positive)]" />
              <p className="text-xs font-bold uppercase text-[var(--text-secondary)]">No hay partidos pendientes de visto bueno</p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  header: 'Encuentro Reportado',
                  cell: (r) => (
                    <div>
                      <div className="text-xs font-bold text-[var(--text-heading)]">{r.home_team_name} VS {r.away_team_name}</div>
                      <div className="font-[family-name:var(--font-active)] text-[10px] text-[var(--app-accent)]">Jornada #{r.matchday}</div>
                    </div>
                  ),
                },
                {
                  header: 'Marcador Enviado',
                  cell: (r) => (
                    <span className="rounded-lg border border-[var(--app-warning)]/30 bg-[var(--app-warning-soft)] px-3 py-1 font-[family-name:var(--font-active)] text-sm font-black text-[var(--app-warning)]">
                      {r.reported_score_home} - {r.reported_score_away}
                    </span>
                  ),
                },
                {
                  header: 'Comprobante',
                  cell: (r) =>
                    r.proof_url ? (
                      <a href={r.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-[var(--app-accent)] hover:underline">
                        <ImageIcon className="w-3.5 h-3.5" /> Captura WebP
                      </a>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">Sin imagen</span>
                    ),
                },
                {
                  header: 'Estado',
                  cell: () => <Badge variant="gold">Por revisar</Badge>,
                },
              ]}
              data={pendingApprovals}
              searchPlaceholder="Buscar por equipo..."
              brandColor="var(--app-accent)"
              actions={(row) => (
                <Button
                  size="sm"
                  onClick={() => setSelectedMatchForApproval(row)}
                  className="bg-[var(--app-positive)] hover:bg-[var(--app-positive)] text-[var(--accent-contrast)] font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Dar Visto Bueno
                </Button>
              )}
            />
          )}
        </ManagementSection>
      )}

      {/* TAB 2: FIXTURES */}
      {activeTab === 'fixture' && (
        <ManagementSection
          title={`Fixtures simultáneos · ${activeGame.name}`}
          description={`Calendario operativo para ${activeGameMode.name} (${activeGameMode.format}).`}
          icon={Clock}
          tone="cyan"
          action={<Button
              onClick={() => setIsFixtureConfirmOpen(true)}
              disabled={isGeneratingFixture}
              className="ui-dynamic-brand-button font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
              style={{ '--ui-dynamic-brand': 'var(--app-accent)' } as React.CSSProperties}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingFixture ? 'Generando...' : `Generar Fixture (${activeGameMode.format})`}</span>
            </Button>}
        >
          <DataTable
            columns={[
              { header: 'Jornada', cell: (r) => <span className="font-[family-name:var(--font-active)] font-bold text-[var(--app-accent)]">Jornada #{r.matchday}</span> },
              { header: 'Local VS Visitante', cell: (r) => <span className="font-bold text-[var(--text-heading)]">{r.home_team_name} VS {r.away_team_name}</span> },
              { header: 'Horario Simultáneo', accessorKey: 'match_date', className: 'font-[family-name:var(--font-active)] text-[var(--text-secondary)]' },
              {
                header: 'Resultado Final',
                cell: (r) => (
                  <span className="font-[family-name:var(--font-active)] font-bold text-[var(--text-primary)]">
                    {r.score_home !== null ? `${r.score_home} - ${r.score_away}` : 'Pendiente'}
                  </span>
                ),
              },
              {
                header: 'Estado',
                cell: (r) => (
                  <Badge
                    className={`text-[10px] uppercase ${
                      r.status === 'TERMINADO'
                        ? 'bg-[var(--app-positive-soft)] text-[var(--app-positive)]'
                        : r.status === 'POR_REVISAR'
                        ? 'bg-[var(--app-warning-soft)] text-[var(--app-warning)]'
                        : 'bg-[var(--app-surface-2)] text-[var(--text-muted)]'
                    }`}
                  >
                    {r.status}
                  </Badge>
                ),
              },
            ]}
            data={matches}
            searchPlaceholder="Buscar por equipo en fixture..."
            brandColor="var(--app-accent)"
          />
        </ManagementSection>
      )}

      {/* TAB 3: EQUIPOS INSCRITOS POR JUEGO */}
      {activeTab === 'enrolled' && (
        <ManagementSection
          title={`Escuadras inscritas · ${activeGame.name}`}
          description={`Nómina habilitada para ${activeGameMode.name} (${activeGameMode.format}).`}
          icon={Shield}
          tone="emerald"
        >
          <DataTable
            columns={[
              { header: 'Nombre del Club', cell: (r) => <span className="font-black text-[var(--text-heading)]">{r.name} [{r.tag}]</span> },
              { header: 'Disciplina', accessorKey: 'game_slug', className: 'font-[family-name:var(--font-active)] text-[var(--app-accent)] uppercase font-bold' },
              { header: 'Capitán', accessorKey: 'captain_name', className: 'font-bold text-[var(--text-secondary)]' },
              { header: 'Estado', cell: (r) => <Badge variant="emerald">{r.status || 'Inscrito'}</Badge> },
            ]}
            data={filteredEnrolledTeams}
            searchPlaceholder="Buscar club inscrito..."
            brandColor="var(--app-accent)"
          />
        </ManagementSection>
      )}

      {/* TAB 4: TEMPORADAS & COMPETENCIAS */}
      {activeTab === 'seasons' && (
        <ManagementSection
          title={`Competencias · ${activeGameMode.name}`}
          description={`Torneos asociados al formato ${activeGameMode.format}.`}
          icon={Calendar}
          tone="violet"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTournaments.map((t) => (
              <div key={t.id} className="space-y-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[var(--text-heading)]">{t.name}</span>
                  <Badge variant="cyan" className="font-[family-name:var(--font-active)] text-[10px]">{t.status || 'ACTIVO'}</Badge>
                </div>
                <p className="font-[family-name:var(--font-active)] text-xs text-[var(--text-secondary)]">
                  Disciplina: <strong className="uppercase text-[var(--app-accent-2)]">{t.game_slug || selectedGameSlug}</strong> • Modalidad: <strong className="text-[var(--app-accent)]">{activeGameMode.format}</strong>
                </p>
              </div>
            ))}
          </div>
        </ManagementSection>
      )}

      {/* CONFIRMATION MODAL FOR VISTO BUENO */}
      {selectedMatchForApproval && (
        <ConfirmModal
          isOpen={Boolean(selectedMatchForApproval)}
          onClose={() => setSelectedMatchForApproval(null)}
          onConfirm={handleConfirmApproval}
          title="Otorgar Visto Bueno al Partido"
          description={`¿Confirmas homologar el marcador de ${selectedMatchForApproval.home_team_name} (${selectedMatchForApproval.reported_score_home}) VS (${selectedMatchForApproval.reported_score_away}) ${selectedMatchForApproval.away_team_name}?`}
          confirmText="Otorgar Visto Bueno"
          variant="success"
        />
      )}
      <ConfirmModal
        isOpen={isFixtureConfirmOpen}
        onClose={() => setIsFixtureConfirmOpen(false)}
        onConfirm={handleGenerateFixture}
        title="Generar fixture competitivo"
        description={`Se generará el calendario de ${activeGame.name} para la modalidad ${activeGameMode.name}.`}
        confirmText="Generar fixture"
        variant="warning"
        consequences={[
          'Se crearán jornadas y horarios para todos los participantes inscritos.',
          'Si ya existe un fixture, la operación puede reemplazar su estructura actual.',
        ]}
      />
    </ManagementPage>
  );
}
