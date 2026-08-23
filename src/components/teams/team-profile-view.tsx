'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TeamData } from '@/lib/data-store';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SubSubNavbar, SubSubTabOption } from '@/components/layout/sub-sub-navbar';
import { ClubManagementModal } from '@/components/teams/club-management-modal';
import {
  Shield, Users, Calendar, ArrowRightLeft, BarChart3, History, Monitor, Tv, Filter, Award, CheckCircle2, MessageSquare, Sparkles, Settings
} from 'lucide-react';

import { getNewTeamSquadAction } from '@/app/actions/new-squads';
import { getSentContractsByTeamAction } from '@/app/actions/new-transfers';
import { GAMES_CATALOG } from '@/lib/games-data';
import { ClassificationView } from '@/components/tournaments/classification-view';
import { FixtureScheduleView } from '@/components/tournaments/fixture-schedule-view';

interface TeamProfileViewProps {
  team: TeamData;
  onBack?: () => void;
  brandColor?: string;
}

export type ProfileTab = 'plantilla' | 'posiciones' | 'calendario' | 'traspasos' | 'estadisticas' | 'historico';

export function TeamProfileView({ team, onBack, brandColor = '#00F0FF' }: TeamProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('plantilla');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [squad, setSquad] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sqRes, cRes] = await Promise.all([
          getNewTeamSquadAction(team.id),
          getSentContractsByTeamAction(team.id)
        ]);
        if (sqRes.success) setSquad(sqRes.squad);
        if (cRes.success) setContracts(cRes.offers);
      } catch(e) {}
      setIsLoading(false);
    }
    loadData();
  }, [team.id]);

  const game = GAMES_CATALOG[(team as any).gameSlug || 'eafc26'];

  // Dynamic theme color for team profile matching the active game
  const activeColor = brandColor || team.color || '#00F0FF';

  // Sub-Sub-Menu Tabs Definition following the system standard
  const profileSubSubTabs: SubSubTabOption<ProfileTab>[] = [
    { id: 'plantilla', label: 'Plantilla Roster', icon: <Users className="w-3.5 h-3.5" />, badge: 8 },
    { id: 'posiciones', label: 'Posiciones Liga', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'calendario', label: 'Calendario Partidos', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'traspasos', label: 'Fichajes & Bajas', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
    { id: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'historico', label: 'Histórico & Palmarés', icon: <History className="w-3.5 h-3.5" /> },
  ];

  // Group real squad by organization
  const squadByOrg = squad.reduce((acc: any, player: any) => {
    const orgs = player.original_orgs && player.original_orgs.length > 0 ? player.original_orgs : ['Plantilla Base'];
    orgs.forEach((org: string) => {
      if (!acc[org]) acc[org] = [];
      if (!acc[org].find((p: any) => p.user_id === player.user_id)) {
         acc[org].push(player);
      }
    });
    return acc;
  }, {});

  const vacantPositions = ['DFC', 'LI', 'MCD'];

  const teamBanner = team?.bannerUrl || '/images/hero.jpg';
  const teamLogoText = team?.logoText || team?.tag || team?.name?.substring(0, 3)?.toUpperCase() || 'TP';
  const teamName = team?.name || 'Escuadra eSports';
  const teamTag = team?.tag || 'TP';
  const teamDesc = team?.description || 'Escuadra registrada en el circuito eSports.';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 -mt-px">
      {/* 1. Full-Width Edge-to-Edge Banner Background Header (100% Unfiltered Image) */}
      <div className="relative w-full left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-950 border-b border-[var(--border-card)] shadow-2xl overflow-hidden min-h-[240px] sm:min-h-[340px] flex flex-col justify-end">
        {/* Full Bleed Banner Image Graphic (Pure 100% Opacity, Zero Filter) */}
        <div className="absolute inset-0 z-0">
          <img
            src={teamBanner}
            alt={teamName}
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="w-full h-full object-cover opacity-100"
          />
          {/* Bottom Fade gradient for text readability only */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Content Box Layered Over the Full Width Banner */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div className="flex flex-row items-center gap-3 sm:gap-6">
            {/* Team Crest Shield */}
            <div
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-slate-950 border-2 sm:border-4 flex items-center justify-center font-black text-lg sm:text-3xl shadow-2xl flex-shrink-0 overflow-hidden"
              style={{ borderColor: activeColor, color: activeColor }}
            >
              {team?.logoUrl || (team as any)?.logo ? (
                <img
                  src={team?.logoUrl || (team as any)?.logo}
                  alt={teamName}
                  onError={(e) => {
                    e.currentTarget.src = '/images/default/logo-default.png';
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                teamLogoText
              )}
            </div>

            {/* Team Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase drop-shadow-md">
                  {teamName}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${activeColor} 30%, transparent)`,
                    borderColor: activeColor,
                    color: '#FFFFFF',
                  }}
                >
                  {teamTag}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-1 drop-shadow-sm">
                {teamDesc}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 flex-wrap font-semibold">
                <span className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" style={{ color: activeColor }} />
                  {team.platform}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {team.status}
                </span>
                <span>•</span>
                <span>Capitán: <strong className="text-white">{team.captainName || (team as any).captain}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Contact Captain & Manage Club */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setIsManageModalOpen(true)}
              className="font-extrabold text-xs uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-xl flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              Gestión de Club (Administrar)
            </Button>

            <Link href="/mensajes">
              <Button
                className="font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contactar Capitán ({team.captainName || (team as any).captain})
              </Button>
            </Link>
          </div>
        </div>

        {/* 📌 Standardized Sub-Sub-Navbar Level 3 */}
        <SubSubNavbar
          tabs={profileSubSubTabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          brandColor={activeColor}
        />
      </div>

      {/* Tab Content Display Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Vacant Positions Recruitment Strip */}
        <div className="p-4 rounded-2xl glass-panel border border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
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
              <span key={pos} className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
                + {pos}
              </span>
            ))}
          </div>
        </div>

        {activeTab === 'plantilla' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="p-12 text-center text-[var(--text-muted)]">Cargando plantilla...</div>
            ) : Object.keys(squadByOrg).length === 0 ? (
              <div className="p-12 text-center text-[var(--text-muted)] glass-panel rounded-2xl border border-[var(--border-card)]">No hay jugadores registrados.</div>
            ) : (
              Object.entries(squadByOrg).map(([orgName, players]: any) => (
                <div key={orgName} className="p-4 sm:p-6 rounded-2xl glass-panel border border-[var(--border-card)] space-y-4">
                  <h3 className="font-extrabold text-base text-[var(--text-heading)] uppercase border-b border-[var(--border-card)] pb-2 mb-4">
                    Organización: {orgName}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((p: any) => (
                      <div key={p.id} className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <Avatar src={p.avatar_url || p.foto} fallback={p.user_name} size="md" status="online" />
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
          <div className="rounded-2xl glass-panel border border-[var(--border-card)] p-4 sm:p-6 space-y-4">
             <h3 className="font-extrabold text-base text-[var(--text-heading)] uppercase mb-4">Historial de Fichajes y Bajas</h3>
             {isLoading ? (
                <div className="p-12 text-center text-[var(--text-muted)]">Cargando historial...</div>
             ) : contracts.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-muted)]">No hay registros de transferencias.</div>
             ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
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
                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                              <Avatar src={c.avatar_url} fallback={c.player_name} className="w-6 h-6" /> {c.player_name}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-muted)] uppercase text-xs font-bold">{orgName}</td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">
                              {new Date(c.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
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

      {/* Club Management Modal */}
      <ClubManagementModal
        team={team}
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </div>
  );
}
