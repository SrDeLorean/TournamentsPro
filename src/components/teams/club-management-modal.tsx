'use client';

import React, { useState } from 'react';
import { TeamData, UserProfile } from '@/lib/data-store';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';
import { TeamAdminSection } from '@/components/layout/team-admin-subnavbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import {
  Users, Plus, Trash2, CheckCircle2, Settings, Sparkles, X, Award, User, BarChart2, FileText, Check
} from 'lucide-react';

interface ClubManagementModalProps {
  team: TeamData;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TeamAdminSection;
  onUpdateTeam?: (updatedTeam: TeamData) => void;
}

export function ClubManagementModal({
  team,
  isOpen,
  onClose,
  initialTab = 'EQUIPO_ROSTER',
  onUpdateTeam,
}: ClubManagementModalProps) {
  const { currentUser } = useAuth();
  const [tabSelection, setTabSelection] = useState({ initialTab, value: initialTab });
  const activeTab = tabSelection.initialTab === initialTab ? tabSelection.value : initialTab;
  const setActiveTab = (value: TeamAdminSection) => setTabSelection({ initialTab, value });

  // Local state for editable team data
  const [currentTeam, setCurrentTeam] = useState<TeamData>(team);
  const [newVacantInput, setNewVacantInput] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Interactive Roster Members state
  const [membersList, setMembersList] = useState<UserProfile[]>(team.members && team.members.length > 0 ? team.members : [
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
    }
  ]);

  // Interactive Matchday Starters selection state
  const [starters, setStarters] = useState<string[]>([membersList[0]?.id || 'usr-current']);

  // Interactive Applications / Offers state
  const [offersList, setOffersList] = useState([
    { id: 'off-1', athleteName: 'Valentin Rossi', gamertag: 'ViperX', position: 'Duelista', rating: '9.7', time: 'Hace 2 horas', status: 'PENDIENTE' },
    { id: 'off-2', athleteName: 'Matías Gomez', gamertag: 'Mati_G', position: 'MCD', rating: '9.2', time: 'Hace 5 horas', status: 'PENDIENTE' },
  ]);

  if (!isOpen) return null;

  const gameObj = GAMES_CATALOG[currentTeam.gameSlug] || GAMES_CATALOG['eafc26'];

  // Add new vacant position
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

  // Remove vacant position
  const handleRemoveVacant = (posToRemove: string) => {
    const updatedVacants = currentTeam.vacantPositions.filter((p) => p !== posToRemove);
    const updated = { ...currentTeam, vacantPositions: updatedVacants };
    setCurrentTeam(updated);
    if (onUpdateTeam) onUpdateTeam(updated);
  };

  // Toggle Starter in Matchday
  const handleToggleStarter = (id: string) => {
    if (starters.includes(id)) {
      setStarters(starters.filter((s) => s !== id));
    } else {
      setStarters([...starters, id]);
    }
  };

  // Accept Offer
  const handleAcceptOffer = (offId: string) => {
    const offer = offersList.find((o) => o.id === offId);
    if (offer) {
      setOffersList(offersList.map((o) => o.id === offId ? { ...o, status: 'ACEPTADO' } : o));
      const newMember: UserProfile = {
        id: `usr-${offId}`,
        name: offer.athleteName,
        gamertag: offer.gamertag,
        role: 'Jugador',
        primaryGame: currentTeam.gameSlug,
        platform: currentTeam.platform,
        position: offer.position,
        status: 'En Escuadra',
        rating: offer.rating,
      };
      setMembersList([...membersList, newMember]);
      setSuccessNotice(`¡${offer.athleteName} (@${offer.gamertag}) ha sido incorporado a la plantilla de ${currentTeam.name}!`);
      setTimeout(() => setSuccessNotice(''), 4000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={`Gestión de ${currentTeam.name}`} size="xl" showCloseButton={false} className="glass-panel p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-slate-950 border-2 flex items-center justify-center font-black text-xl shadow-xl flex-shrink-0"
              style={{ borderColor: currentTeam.color, color: currentTeam.color }}
            >
              {currentTeam.logoText}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase text-[var(--text-heading)]">
                  {currentTeam.name}
                </h3>
                <Badge variant="violet">Panel Capitán & Atleta</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Gestión integral de plantilla, reclutamiento, convocatorias y perfil personal en {gameObj.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-[var(--text-muted)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice Banner */}
        {successNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 2-Group Management Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] overflow-x-auto scrollbar-none">
          
          {/* GROUP 1: 🛡️ GESTIÓN DE EQUIPO */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black uppercase text-purple-400 px-2 flex-shrink-0">🛡️ Club:</span>
            
            <button
              onClick={() => setActiveTab('EQUIPO_ROSTER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'EQUIPO_ROSTER'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Plantilla ({membersList.length})
            </button>

            <button
              onClick={() => setActiveTab('EQUIPO_RECLUTAMIENTO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'EQUIPO_RECLUTAMIENTO'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Reclutamiento ({currentTeam.vacantPositions.length})
            </button>

            <button
              onClick={() => setActiveTab('EQUIPO_MATCHDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'EQUIPO_MATCHDAY'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Matchday ({starters.length})
            </button>

            <button
              onClick={() => setActiveTab('EQUIPO_AJUSTES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'EQUIPO_AJUSTES'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Ajustes
            </button>
          </div>

          <div className="w-px h-6 bg-[var(--border-card)] hidden sm:block" />

          {/* GROUP 2: 👤 GESTIÓN DE ATLETA */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black uppercase text-cyan-400 px-2 flex-shrink-0">👤 Atleta:</span>
            
            <button
              onClick={() => setActiveTab('ATLETA_FICHA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'ATLETA_FICHA'
                  ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Mi Ficha
            </button>

            <button
              onClick={() => setActiveTab('ATLETA_STATS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'ATLETA_STATS'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Mis Stats
            </button>

            <button
              onClick={() => setActiveTab('ATLETA_SOLICITUDES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'ATLETA_SOLICITUDES'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Ofertas ({offersList.filter(o => o.status === 'PENDIENTE').length})
            </button>
          </div>
        </div>

        {/* TAB 1: 👥 PLANTILLA ROSTER */}
        {activeTab === 'EQUIPO_ROSTER' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase text-[var(--text-heading)]">
                  Integrantes Oficiales de {currentTeam.name}
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">Gestión de dorsales y roles de cancha</p>
              </div>
              <Badge variant="violet" className="font-mono font-bold">
                Cupos: {membersList.length} / {currentTeam.maxMembers}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {membersList.map((member, idx) => (
                <div key={member.id} className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar fallback={member.name} size="md" status="online" />
                    <div>
                      <span className="font-extrabold text-sm text-[var(--text-heading)] block">{member.name}</span>
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">@{member.gamertag}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="cyan">Pos: {member.position}</Badge>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                      #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ✨ RECLUTAMIENTO & VACANTES */}
        {activeTab === 'EQUIPO_RECLUTAMIENTO' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase text-[var(--text-heading)]">
                Publicar Vacantes de Fichaje ({gameObj.name})
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Las posiciones agregadas se publican en el Mercado de Traspasos para atraer atletas libres.
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
              <span className="text-xs font-bold uppercase text-[var(--text-heading)] block">Vacantes Publicadas:</span>
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

        {/* TAB 3: 🏆 ALINEACIÓN MATCHDAY */}
        {activeTab === 'EQUIPO_MATCHDAY' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div>
                <h4 className="font-black text-sm uppercase text-[var(--text-heading)]">Convocatoria Titular Matchday</h4>
                <p className="text-xs text-[var(--text-secondary)]">Haz clic en los integrantes para convocarlos al próximo encuentro</p>
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
                        <span className="font-extrabold text-xs text-[var(--text-heading)] block">{m.name}</span>
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

        {/* TAB 4: ⚙️ AJUSTES DEL CLUB */}
        {activeTab === 'EQUIPO_AJUSTES' && (
          <div className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Nombre del Club</label>
                <input
                  type="text"
                  value={currentTeam.name}
                  onChange={(e) => setCurrentTeam({ ...currentTeam, name: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl input-theme border border-[var(--border-card)] font-black uppercase text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Tag / Sigla</label>
                <input
                  type="text"
                  value={currentTeam.tag}
                  onChange={(e) => setCurrentTeam({ ...currentTeam, tag: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl input-theme border border-[var(--border-card)] font-black uppercase text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Descripción / Historia</label>
              <textarea
                rows={3}
                value={currentTeam.description}
                onChange={(e) => setCurrentTeam({ ...currentTeam, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl input-theme border border-[var(--border-card)] font-medium text-xs"
              />
            </div>
          </div>
        )}

        {/* TAB 5: 👤 MI FICHA DE ATLETA */}
        {activeTab === 'ATLETA_FICHA' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-4">
              <div className="flex items-center gap-4">
                <Avatar fallback={currentUser?.name || 'Atleta'} size="lg" status="online" />
                <div>
                  <h4 className="text-lg font-black text-[var(--text-heading)] uppercase">{currentUser?.name}</h4>
                  <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold">Gamertag: @{currentUser?.gamertag}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="cyan">{currentUser?.position || 'DFC'}</Badge>
                    <Badge variant="violet">{currentUser?.role || 'Capitán'}</Badge>
                    <span className="text-xs text-amber-400 font-mono font-bold">Rating ★ {currentUser?.rating || '9.8'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-card)] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Plataforma</span>
                  <span className="font-extrabold text-[var(--text-heading)]">{currentUser?.platform || 'PS5'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Juego Principal</span>
                  <span className="font-extrabold text-[var(--text-heading)]">{gameObj.name}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Estado</span>
                  <span className="font-extrabold text-emerald-400">{currentUser?.status || 'En Escuadra'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: 📊 MIS STATS EN CLUB */}
        {activeTab === 'ATLETA_STATS' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-2xl font-black text-[var(--accent-cyan)] font-mono block">42</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Partidos Disputados</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-2xl font-black text-emerald-400 font-mono block">18</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Goles / Asistencias</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-2xl font-black text-purple-400 font-mono block">9.8</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Rating Promedio ★</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-2xl font-black text-amber-400 font-mono block">12</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Premios MVP</span>
            </div>
          </div>
        )}

        {/* TAB 7: 🤝 MIS OFERTAS & POSTULACIONES */}
        {activeTab === 'ATLETA_SOLICITUDES' && (
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase text-[var(--text-heading)]">Ofertas de Fichaje Recibidas</h4>
            <div className="space-y-2">
              {offersList.map((off) => (
                <div key={off.id} className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-sm text-[var(--text-heading)] block">{off.athleteName} (@{off.gamertag})</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Posición: {off.position} • Rating ★ {off.rating} • {off.time}</span>
                  </div>

                  {off.status === 'ACEPTADO' ? (
                    <Badge variant="emerald">Fichado en Roster</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleAcceptOffer(off.id)} size="sm" className="font-bold text-xs bg-emerald-500 text-slate-950">
                        Aceptar Fichaje
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border-card)] pt-4">
          <Button onClick={onClose} size="sm" className="font-bold text-xs bg-[var(--accent-cyan)] text-slate-950">
            Guardar & Cerrar
          </Button>
        </div>
    </Modal>
  );
}
