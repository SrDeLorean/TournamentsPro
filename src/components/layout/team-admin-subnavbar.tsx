import React, { useState } from 'react';
import { TeamData } from '@/lib/data-store';
import { GAMES_CATALOG } from '@/lib/games-data';
import { TeamManagementModal, TeamTabOption } from '@/components/teams/team-management-modal';
import { AthleteManagementModal, AthleteTabOption } from '@/components/teams/athlete-management-modal';
import { Users, Sparkles, Award, User, Settings, BarChart2, FileText, CheckCircle2 } from 'lucide-react';

export type TeamAdminSection =
  | 'EQUIPO_ROSTER'
  | 'EQUIPO_RECLUTAMIENTO'
  | 'EQUIPO_MATCHDAY'
  | 'EQUIPO_AJUSTES'
  | 'ATLETA_FICHA'
  | 'ATLETA_STATS'
  | 'ATLETA_SOLICITUDES';

interface TeamAdminSubnavbarProps {
  team: TeamData;
  activeSection?: TeamAdminSection;
  onSelectSection?: (section: TeamAdminSection) => void;
  brandColor?: string;
}

export function TeamAdminSubnavbar({
  team,
  onSelectSection,
  brandColor = 'var(--app-accent)',
}: TeamAdminSubnavbarProps) {
  const gameObj = GAMES_CATALOG[team.gameSlug] || GAMES_CATALOG['eafc26'];
  const activeColor = brandColor || team.color || 'var(--app-accent)';

  const equipoSections: { id: TeamAdminSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'EQUIPO_ROSTER', label: 'Plantilla Roster', icon: <Users className="w-3.5 h-3.5" />, badge: `${team.membersCount}` },
    { id: 'EQUIPO_RECLUTAMIENTO', label: 'Reclutamiento', icon: <Sparkles className="w-3.5 h-3.5" />, badge: `${team.vacantPositions.length}` },
    { id: 'EQUIPO_MATCHDAY', label: 'Alineación Matchday', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'EQUIPO_AJUSTES', label: 'Ajustes Club', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const atletaSections: { id: TeamAdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'ATLETA_FICHA', label: 'Mi Ficha de Atleta', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'ATLETA_STATS', label: 'Mis Stats en Club', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'ATLETA_SOLICITUDES', label: 'Mis Ofertas', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<TeamTabOption>('EQUIPO_ROSTER');

  const [isAthleteModalOpen, setIsAthleteModalOpen] = useState(false);
  const [activeAthleteTab, setActiveAthleteTab] = useState<AthleteTabOption>('ATLETA_FICHA');

  return (
    <>
      <div
        className="ui-navigation-tier w-full z-40 py-1.5 px-4 sm:px-6 lg:px-8"
        style={{
          '--navigation-brand': activeColor,
          backgroundColor: `color-mix(in srgb, ${activeColor} 18%, var(--bg-nav))`,
          borderColor: `${activeColor}50`,
        } as React.CSSProperties}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          
          {/* Left Team Badge + Theme Color Accent */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg bg-[var(--app-canvas)] border-2 flex items-center justify-center font-black text-xs shadow-md"
              style={{ borderColor: activeColor, color: activeColor }}
            >
              {team.logoText}
            </div>

            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider">
                  {team.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-[family-name:var(--font-active)] font-bold uppercase bg-[var(--app-canvas)] text-[var(--text-heading)] border border-[var(--border-card)]">
                  {gameObj.name}
                </span>
              </div>
              <span className="text-[10px] text-[var(--navigation-brand)] font-[family-name:var(--font-active)] font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Gestión Activa
              </span>
            </div>
          </div>

          {/* Separated Management Bars: 🛡️ GESTIÓN DE EQUIPO vs 👤 GESTIÓN DE SÍ MISMO */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
            
            {/* GROUP 1: 🛡️ GESTIÓN DE SU EQUIPO (MODAL INDEPENDIENTE) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--app-canvas)] border border-[var(--navigation-brand)]">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--navigation-brand)] px-2 hidden lg:inline-block">
                🛡️ Club:
              </span>
              {equipoSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveTeamTab(sec.id as TeamTabOption);
                    setIsTeamModalOpen(true);
                    if (onSelectSection) onSelectSection(sec.id);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--app-accent-soft)] transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  {sec.icon}
                  <span>{sec.label}</span>
                  {sec.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-[family-name:var(--font-active)] font-bold bg-[var(--app-canvas)] text-[var(--text-muted)]">
                      {sec.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-[var(--border-card)] hidden md:block" />

            {/* GROUP 2: 👤 GESTIÓN DE SÍ MISMO - ATLETA (MODAL INDEPENDIENTE) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--app-canvas)] border border-[var(--app-accent)]">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--app-accent)] px-2 hidden lg:inline-block">
                👤 Atleta:
              </span>
              {atletaSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveAthleteTab(sec.id as AthleteTabOption);
                    setIsAthleteModalOpen(true);
                    if (onSelectSection) onSelectSection(sec.id);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--app-accent-soft)] transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  {sec.icon}
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* 🛡️ MODAL INDEPENDIENTE DE GESTIÓN DE EQUIPO */}
      <TeamManagementModal
        team={team}
        isOpen={isTeamModalOpen}
        initialTab={activeTeamTab}
        onClose={() => setIsTeamModalOpen(false)}
      />

      {/* 👤 MODAL INDEPENDIENTE DE GESTIÓN DE ATLETA */}
      <AthleteManagementModal
        isOpen={isAthleteModalOpen}
        initialTab={activeAthleteTab}
        onClose={() => setIsAthleteModalOpen(false)}
      />
    </>
  );
}
