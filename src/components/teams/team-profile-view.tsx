'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TeamData } from '@/lib/data-store';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ClubManagementModal } from '@/components/teams/club-management-modal';
import {
  Users, Calendar, ArrowRightLeft, BarChart3, History, Monitor, Award, CheckCircle2,
  MessageSquare, Sparkles, Settings, ArrowLeft, Gamepad2, ShieldCheck
} from 'lucide-react';

import { getNewTeamSquadAction } from '@/app/actions/new-squads';
import { getSentContractsByTeamAction } from '@/app/actions/new-transfers';
import { GAMES_CATALOG } from '@/lib/games-data';
import { ClassificationView } from '@/components/tournaments/classification-view';
import { FixtureScheduleView } from '@/components/tournaments/fixture-schedule-view';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { useAuth } from '@/components/providers/auth-provider';

interface TeamProfileViewProps {
  team: TeamData;
  onBack?: () => void;
  brandColor?: string;
  context?: 'global' | 'game';
  backHref?: string;
  backLabel?: string;
}

interface TeamProfileSquadMember {
  id: string;
  user_id: string;
  user_name: string;
  gamertag: string;
  tactical_position?: string | null;
  avatar_url?: string | null;
  foto?: string | null;
  original_orgs?: string[];
}

interface TeamContract {
  id: string;
  player_name: string;
  avatar_url?: string;
  pitch_message?: string;
  created_at: string | Date;
  status: string;
}

type LegacyTeamData = TeamData & { captain?: string; logo?: string };

export type ProfileTab = 'plantilla' | 'posiciones' | 'calendario' | 'traspasos' | 'estadisticas' | 'historico';

export function TeamProfileView({
  team,
  brandColor = '#00F0FF',
  context = 'game',
  backHref,
  backLabel = 'Todos los equipos',
}: TeamProfileViewProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('plantilla');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [squad, setSquad] = useState<TeamProfileSquadMember[]>([]);
  const [contracts, setContracts] = useState<TeamContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sqRes, cRes] = await Promise.all([
          getNewTeamSquadAction(team.id),
          getSentContractsByTeamAction(team.id)
        ]);
        if (sqRes.success) setSquad(sqRes.squad as TeamProfileSquadMember[]);
        if (cRes.success) setContracts(cRes.offers as unknown as TeamContract[]);
      } catch {}
      setIsLoading(false);
    }
    loadData();
  }, [team.id]);

  const game = GAMES_CATALOG[team.gameSlug || 'eafc26'];
  const directoryHref = backHref || (context === 'global' ? '/equipos' : `/${team.gameSlug || 'eafc26'}/equipos`);

  // Dynamic theme color for team profile matching the active game
  const activeColor = brandColor || team.color || '#00F0FF';

  const profileTabs: Array<{ id: ProfileTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'plantilla', label: 'Plantilla', icon: <Users className="size-4" />, badge: squad.length },
    { id: 'posiciones', label: 'Posiciones Liga', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'traspasos', label: 'Movimientos', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
    { id: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'historico', label: 'Palmarés', icon: <History className="w-3.5 h-3.5" /> },
  ];

  // Group real squad by organization
  const squadByOrg = squad.reduce<Record<string, TeamProfileSquadMember[]>>((acc, player) => {
    const orgs = player.original_orgs && player.original_orgs.length > 0 ? player.original_orgs : ['Plantilla Base'];
    orgs.forEach((org: string) => {
      if (!acc[org]) acc[org] = [];
      if (!acc[org].find((member) => member.user_id === player.user_id)) {
         acc[org].push(player);
      }
    });
    return acc;
  }, {});

  const vacantPositions = team.vacantPositions || [];

  const teamBanner = team?.bannerUrl || '/images/default/banner-default.jpg';
  const teamLogo = team?.logoUrl || (team as LegacyTeamData).logo;
  const teamLogoText = team?.logoText || team?.tag || team?.name?.substring(0, 3)?.toUpperCase() || 'TP';
  const teamName = team?.name || 'Escuadra eSports';
  const teamTag = team?.tag || 'TP';
  const teamDesc = team?.description || 'Escuadra registrada en el circuito eSports.';
  const role = currentUser?.role?.toLowerCase() || '';
  const canManage = Boolean(currentUser && (
    ['administrador', 'admin', 'organizador'].includes(role) ||
    currentUser.id === team.captainId ||
    currentUser.teamId === team.id ||
    currentUser.name?.toLowerCase() === team.captainName?.toLowerCase() ||
    currentUser.gamertag?.toLowerCase() === team.captainName?.toLowerCase()
  ));
  const occupancy = Math.min(100, Math.round((team.membersCount / Math.max(team.maxMembers, 1)) * 100));

  return (
    <div className="public-team-profile animate-in fade-in duration-300">
      <div className="public-team-breadcrumb">
        <Link href={directoryHref}><ArrowLeft className="size-4" />{backLabel}</Link>
        <span>/</span><span>{game?.name || team.gameSlug}</span>
      </div>

      <section className="public-team-hero">
        <div className="public-team-banner">
          <Image
            src={teamBanner}
            alt={teamName}
            fill
            sizes="100vw"
            loading="eager"
            unoptimized={shouldBypassImageOptimization(teamBanner)}
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="object-cover"
          />
          <div className="public-team-banner-overlay" />
        </div>

        <div className="public-team-hero-content">
          <div className="public-team-identity">
            <div
              className="public-team-logo"
              style={{ borderColor: activeColor, color: activeColor }}
            >
              {teamLogo ? (
                <Image
                  src={teamLogo}
                  alt={teamName}
                  fill
                  sizes="96px"
                  unoptimized={shouldBypassImageOptimization(teamLogo)}
                  onError={(e) => {
                    e.currentTarget.src = '/images/default/logo-default.png';
                  }}
                  className="object-cover"
                />
              ) : (
                teamLogoText
              )}
            </div>

            <div className="public-team-copy">
              <p className="public-team-eyebrow"><ShieldCheck className="size-3.5" />Ficha pública verificada</p>
              <div className="public-team-title-row">
                <h1>{teamName}</h1>
                <span style={{ borderColor: activeColor }}>{teamTag}</span>
              </div>
              <p className="public-team-description">{teamDesc}</p>
              <div className="public-team-facts">
                <span><Gamepad2 className="size-3.5" />{game?.name}</span>
                <span><Monitor className="size-3.5" />{team.platform}</span>
                <span className="is-active"><CheckCircle2 className="size-3.5" />{team.status}</span>
              </div>
            </div>
          </div>

          <div className="public-team-actions">
            {canManage ? (
              <Button onClick={() => setIsManageModalOpen(true)} variant="outline">
                <Settings className="size-4" />Administrar club
              </Button>
            ) : null}
            <Link href="/mensajes">
              <Button className="public-team-primary-action">
                <MessageSquare className="size-4" />Contactar capitán
              </Button>
            </Link>
          </div>
        </div>
        <div className="public-team-metrics">
          <div><strong>{team.membersCount}/{team.maxMembers}</strong><span>integrantes</span></div>
          <div><strong>{occupancy}%</strong><span>ocupación</span></div>
          <div><strong>{vacantPositions.length}</strong><span>vacantes</span></div>
          <div><strong>{team.palmares || '—'}</strong><span>palmarés</span></div>
        </div>
      </section>

      <nav className="public-team-tabs" aria-label="Secciones del perfil">
        {profileTabs.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}>
            {tab.icon}<span>{tab.label}</span>{tab.badge !== undefined ? <small>{tab.badge}</small> : null}
          </button>
        ))}
      </nav>

      <div className="public-team-content">
        
        {/* Vacant Positions Recruitment Strip */}
        {vacantPositions.length > 0 ? <div className="public-team-recruitment">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-black uppercase text-[var(--text-heading)] block">
                Vacantes de Reclutamiento Activas
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                La directiva de {team.name} busca incorporar las siguientes posiciones tácticas:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {vacantPositions.map((pos) => (
              <span key={pos}>
                + {pos}
              </span>
            ))}
          </div>
        </div> : null}

        {activeTab === 'plantilla' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="public-team-empty">Cargando plantilla...</div>
            ) : Object.keys(squadByOrg).length === 0 ? (
              <div className="public-team-empty">No hay jugadores registrados en esta plantilla.</div>
            ) : (
              Object.entries(squadByOrg).map(([orgName, players]) => (
                <div key={orgName} className="p-4 sm:p-6 rounded-2xl glass-panel border border-[var(--border-card)] space-y-4">
                  <h3 className="font-extrabold text-base text-[var(--text-heading)] uppercase border-b border-[var(--border-card)] pb-2 mb-4">
                    Organización: {orgName}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <Avatar src={p.avatar_url || p.foto || undefined} fallback={p.user_name} size="md" status="online" />
                          <div>
                            <span className="font-bold text-sm text-[var(--text-heading)] block">{p.user_name}</span>
                            <span className="text-[var(--text-muted)] text-[11px] font-mono">{p.gamertag}</span>
                          </div>
                        </div>
                        <Badge variant="cyan">{p.tactical_position || 'DFC'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'posiciones' && game && (
          <div className="rounded-2xl glass-panel border border-[var(--border-card)] overflow-hidden">
            <ClassificationView game={game} hideHeader={true} hideCompFilter={false} hideOrgFilter={true} targetTeamName={team.name} />
          </div>
        )}

        {activeTab === 'calendario' && game && (
          <div className="rounded-2xl glass-panel border border-[var(--border-card)] p-4 sm:p-6">
             <FixtureScheduleView game={game} hideHeader={true} hideOrgFilter={true} targetTeamName={team.name} />
          </div>
        )}

        {activeTab === 'traspasos' && (
          <div className="public-team-panel space-y-4">
             <h3 className="font-extrabold text-base text-[var(--text-heading)] uppercase mb-4">Historial de Fichajes y Bajas</h3>
             {isLoading ? (
                <div className="p-12 text-center text-[var(--text-muted)]">Cargando historial...</div>
             ) : contracts.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-muted)]">No hay registros de transferencias.</div>
             ) : (
                <div className="ui-data-table-shell overflow-x-auto rounded-xl border border-[var(--border-card)]">
                  <table className="ui-table ui-data-table-responsive w-full text-sm text-left">
                    <thead className="text-xs text-[var(--text-muted)] uppercase bg-black/50 border-b border-[var(--border-card)]">
                      <tr>
                        <th className="px-4 py-3">Jugador</th>
                        <th className="px-4 py-3">Organización</th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => {
                        const orgMatch = c.pitch_message?.match(/\[Organización:\s*([^\]]+)\]/i);
                        const orgName = orgMatch ? orgMatch[1] : 'General';
                        return (
                          <tr key={c.id} className="border-b border-[var(--border-card)] hover:bg-white/5">
                            <td data-label="Jugador" className="px-4 py-3 font-medium">
                              <span className="flex items-center gap-2">
                              <Avatar src={c.avatar_url} fallback={c.player_name} className="w-6 h-6" /> {c.player_name}
                              </span>
                            </td>
                            <td data-label="Organización" className="px-4 py-3 text-[var(--text-muted)] uppercase text-xs font-bold">{orgName}</td>
                            <td data-label="Fecha" className="px-4 py-3 text-[var(--text-muted)]">
                              {new Date(c.created_at).toLocaleString()}
                            </td>
                            <td data-label="Estado" className="px-4 py-3">
                              <Badge variant={
                                c.status === 'ACEPTADO' ? 'emerald' : 
                                c.status === 'RECHAZADO' ? 'rose' : 
                                c.status === 'CONCLUIDO' ? 'slate' : 'cyan'
                              }>
                                {c.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
        )}

        {(activeTab === 'estadisticas' || activeTab === 'historico') && (
          <div className="p-6 rounded-2xl glass-panel border border-[var(--border-card)] text-center py-12 space-y-2">
            <h4 className="font-black text-lg text-[var(--text-heading)] uppercase">Sección: {activeTab}</h4>
            <p className="text-xs text-[var(--text-muted)]">Información oficial actualizada para la escuadra {team.name} estará disponible próximamente.</p>
          </div>
        )}
      </div>

      {canManage ? <ClubManagementModal
        team={team}
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      /> : null}
    </div>
  );
}
