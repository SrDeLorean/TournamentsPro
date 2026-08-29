'use client';

import React, { useState } from 'react';
import { TeamData, UserProfile } from '@/lib/data-store';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import {
  Users, Plus, Trash2, CheckCircle2, Settings, Sparkles, X, Award, Check
} from 'lucide-react';

export type TeamTabOption = 'EQUIPO_ROSTER' | 'EQUIPO_RECLUTAMIENTO' | 'EQUIPO_MATCHDAY' | 'EQUIPO_AJUSTES';

interface TeamManagementModalProps {
  team: TeamData;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TeamTabOption;
  onUpdateTeam?: (updatedTeam: TeamData) => void;
}

export function TeamManagementModal({
  team,
  isOpen,
  onClose,
  initialTab = 'EQUIPO_ROSTER',
  onUpdateTeam,
}: TeamManagementModalProps) {
  const { currentUser } = useAuth();
  const [tabSelection, setTabSelection] = useState({ initialTab, value: initialTab });
  const activeTab = tabSelection.initialTab === initialTab ? tabSelection.value : initialTab;
  const setActiveTab = (value: TeamTabOption) => setTabSelection({ initialTab, value });

  const [currentTeam, setCurrentTeam] = useState<TeamData>(team);
  const [newVacantInput, setNewVacantInput] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const [membersList] = useState<UserProfile[]>(
    team.members && team.members.length > 0
      ? team.members
      : [
          currentUser || {
            id: 'usr-current',
            name: 'Sebastián Rodríguez',
            gamertag: 'SrDeLorean',
            role: 'Capitán',
            primaryGame: 'eafc26',
            platform: 'CROSSPLAY',
            position: 'DFC',
            status: 'En Escuadra',
            rating: '9.8',
          },
          {
            id: 'usr-m1',
            name: 'Lucas Benítez',
            gamertag: 'Vhaex_CS',
            role: 'Jugador',
            primaryGame: 'csgo',
            platform: 'PC',
            position: 'AWPer',
            status: 'En Escuadra',
            rating: '9.4',
          },
          {
            id: 'usr-m2',
            name: 'Joaquín Silva',
            gamertag: 'SG Jotta',
            role: 'Jugador',
            primaryGame: 'eafc26',
            platform: 'PS5',
            position: 'DC',
            status: 'En Escuadra',
            rating: '9.6',
          },
        ]
  );

  const [starters, setStarters] = useState<string[]>([membersList[0]?.id || 'usr-current']);

  if (!isOpen) return null;

  const gameObj = GAMES_CATALOG[currentTeam.gameSlug] || GAMES_CATALOG['eafc26'];

  const handleAddVacant = () => {
    if (!newVacantInput.trim()) return;
    const updatedVacants = [...currentTeam.vacantPositions, newVacantInput.trim().toUpperCase()];
    const updated = { ...currentTeam, vacantPositions: updatedVacants };
    setCurrentTeam(updated);
    if (onUpdateTeam) onUpdateTeam(updated);
    setNewVacantInput('');
    setSuccessNotice('Vacante de reclutamiento agregada exitosamente');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleRemoveVacant = (posToRemove: string) => {
    const updatedVacants = currentTeam.vacantPositions.filter((p) => p !== posToRemove);
    const updated = { ...currentTeam, vacantPositions: updatedVacants };
    setCurrentTeam(updated);
    if (onUpdateTeam) onUpdateTeam(updated);
  };

  const handleToggleStarter = (id: string) => {
    if (starters.includes(id)) {
      setStarters(starters.filter((s) => s !== id));
    } else {
      setStarters([...starters, id]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={`Gestión de ${currentTeam.name}`} size="lg" showCloseButton={false} className="glass-panel p-6 sm:p-8 border-purple-500/40 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-slate-950 border-2 flex items-center justify-center font-black text-xl shadow-xl flex-shrink-0"
              style={{ borderColor: currentTeam.color || '#00F0FF', color: currentTeam.color || '#00F0FF' }}
            >
              {currentTeam.logoText}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase text-white">
                  {currentTeam.name}
                </h3>
                <Badge variant="violet">🛡️ Panel de Gestión del Club</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Administración exclusiva de plantilla, vacantes de reclutamiento y convocatorias de {gameObj.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-[var(--text-muted)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Team Management Only Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-slate-950 border border-purple-500/30">
          <button
            onClick={() => setActiveTab('EQUIPO_ROSTER')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'EQUIPO_ROSTER'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Plantilla & Roster ({membersList.length})
          </button>

          <button
            onClick={() => setActiveTab('EQUIPO_RECLUTAMIENTO')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'EQUIPO_RECLUTAMIENTO'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Reclutamiento ({currentTeam.vacantPositions.length})
          </button>

          <button
            onClick={() => setActiveTab('EQUIPO_MATCHDAY')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'EQUIPO_MATCHDAY'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Alineación Matchday ({starters.length})
          </button>

          <button
            onClick={() => setActiveTab('EQUIPO_AJUSTES')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'EQUIPO_AJUSTES'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Ajustes Club
          </button>
        </div>

        {/* TAB 1: PLANTILLA ROSTER POR TORNEO / COMPETENCIA */}
        {activeTab === 'EQUIPO_ROSTER' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-purple-500/30">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 block tracking-wider">
                  🏆 Competencia / Torneo Activo
                </span>
                <span className="text-xs font-black text-white block">
                  Liga Élite Pro 11v11 2026 ({gameObj.name})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="cyan" className="font-mono font-bold text-xs">
                  Plantilla Habilitada: {membersList.length} Atletas
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] font-medium leading-relaxed">
              💡 <strong>Regla de Inscripción Multi-Torneo:</strong> Las plantillas se registran por torneo específico. Un atleta puede integrar esta plantilla para la <em>Liga Élite 2026</em> y estar inscrito con otro club en una competencia distinta sin causar conflicto.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {membersList.map((member) => (
                <div key={member.id} className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Avatar fallback={member.name} size="md" status="online" />
                    <div>
                      <span className="font-extrabold text-sm text-white block">{member.name}</span>
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">@{member.gamertag}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="cyan">{member.position}</Badge>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-700">
                      Habilitado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RECLUTAMIENTO & VACANTES */}
        {activeTab === 'EQUIPO_RECLUTAMIENTO' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase text-white">Publicar Vacantes de Reclutamiento</h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Las posiciones agregadas aparecerán en el Mercado de Traspasos para atraer atletas libres.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ej. DFC, AWPer, Duelista, MID..."
                value={newVacantInput}
                onChange={(e) => setNewVacantInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-extrabold uppercase"
              />
              <Button onClick={handleAddVacant} size="sm" className="font-bold text-xs bg-[var(--accent-cyan)] text-slate-950">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Vacante
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase text-white block">Vacantes Activas:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {currentTeam.vacantPositions.map((pos) => (
                  <span key={pos} className="px-3.5 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center gap-2.5">
                    <span>+ Vacante: {pos}</span>
                    <button onClick={() => handleRemoveVacant(pos)} className="text-amber-400 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALINEACIÓN MATCHDAY */}
        {activeTab === 'EQUIPO_MATCHDAY' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div>
                <h4 className="font-black text-sm uppercase text-white">Alineación Titular Matchday</h4>
                <p className="text-xs text-[var(--text-secondary)]">Haz clic para convocar a los titulares del partido</p>
              </div>
              <Badge variant="cyan" className="font-mono font-bold">{starters.length} Titulares Seleccionados</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {membersList.map((m) => {
                const isSelected = starters.includes(m.id);

                return (
                  <button
                    key={m.id}
                    onClick={() => handleToggleStarter(m.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/60 shadow-lg'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar fallback={m.name} size="sm" />
                      <div>
                        <span className="font-extrabold text-xs text-white block">{m.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">@{m.gamertag} • {m.position}</span>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                      {isSelected ? <Check className="w-4 h-4" /> : '+'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AJUSTES CLUB */}
        {activeTab === 'EQUIPO_AJUSTES' && (
          <div className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-white block">Nombre del Club</label>
                <input
                  type="text"
                  value={currentTeam.name}
                  onChange={(e) => setCurrentTeam({ ...currentTeam, name: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl input-theme border border-[var(--border-card)] font-black uppercase text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-white block">Tag / Sigla</label>
                <input
                  type="text"
                  value={currentTeam.tag}
                  onChange={(e) => setCurrentTeam({ ...currentTeam, tag: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl input-theme border border-[var(--border-card)] font-black uppercase text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-white block">Descripción del Club</label>
              <textarea
                rows={3}
                value={currentTeam.description}
                onChange={(e) => setCurrentTeam({ ...currentTeam, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl input-theme border border-[var(--border-card)] font-medium text-xs"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border-card)] pt-4">
          <Button onClick={onClose} size="sm" className="font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white">
            Guardar & Cerrar
          </Button>
        </div>
    </Modal>
  );
}
