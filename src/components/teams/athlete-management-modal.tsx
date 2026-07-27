'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, TeamData } from '@/lib/data-store';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  User, BarChart2, FileText, CheckCircle2, X, Award, Shield, Sparkles, Star, Check
} from 'lucide-react';

export type AthleteTabOption = 'ATLETA_FICHA' | 'ATLETA_STATS' | 'ATLETA_SOLICITUDES';

interface AthleteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AthleteTabOption;
}

export function AthleteManagementModal({
  isOpen,
  onClose,
  initialTab = 'ATLETA_FICHA',
}: AthleteManagementModalProps) {
  const { currentUser, activeGameSlug } = useAuth();
  const [activeTab, setActiveTab] = useState<AthleteTabOption>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [offersList, setOffersList] = useState([
    { id: 'off-1', teamName: 'SANGRE NUEVA FC', game: 'EA SPORTS FC 26', offerType: 'Fichaje Titular', status: 'PENDIENTE' },
    { id: 'off-2', teamName: 'HIGHFIELD XX', game: 'Counter-Strike 2', offerType: 'Contrato AWPer', status: 'PENDIENTE' },
  ]);

  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const gameObj = GAMES_CATALOG[activeGameSlug || 'eafc26'] || GAMES_CATALOG['eafc26'];

  const handleAcceptOffer = (offId: string) => {
    setOffersList(offersList.map((o) => (o.id === offId ? { ...o, status: 'ACEPTADO' } : o)));
    setSuccessNotice('¡Oferta aceptada! Te has incorporado al equipo exitosamente.');
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/40 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <Avatar fallback={currentUser?.name || 'Atleta'} size="lg" status="online" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase text-white">
                  {currentUser?.name || 'Atleta eSports'}
                </h3>
                <Badge variant="cyan">👤 Panel Personal de Atleta</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Gestión de ficha técnica personal, rendimiento e historial de ofertas en {gameObj.name}
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

        {/* Athlete Management Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-slate-950 border border-cyan-500/30">
          <button
            onClick={() => setActiveTab('ATLETA_FICHA')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ATLETA_FICHA'
                ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Mi Ficha Técnica
          </button>

          <button
            onClick={() => setActiveTab('ATLETA_STATS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ATLETA_STATS'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Mis Estadísticas
          </button>

          <button
            onClick={() => setActiveTab('ATLETA_SOLICITUDES')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ATLETA_SOLICITUDES'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Mis Ofertas ({offersList.filter((o) => o.status === 'PENDIENTE').length})
          </button>
        </div>

        {/* TAB 1: MI FICHA TÉCNICA */}
        {activeTab === 'ATLETA_FICHA' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black uppercase text-white">{currentUser?.name}</h4>
                  <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold">Gamertag: @{currentUser?.gamertag}</span>
                </div>
                <Badge variant="cyan" className="font-mono font-bold text-xs">Rating ★ {currentUser?.rating || '9.8'}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Posición Táctica</span>
                  <span className="font-extrabold text-[var(--accent-cyan)]">{currentUser?.position || 'DFC'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Plataforma</span>
                  <span className="font-extrabold text-white">{currentUser?.platform || 'PS5'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Juego Disciplina</span>
                  <span className="font-extrabold text-white">{gameObj.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MIS ESTADÍSTICAS */}
        {activeTab === 'ATLETA_STATS' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-[var(--accent-cyan)] font-mono block">42</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Partidos Oficiales</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-emerald-400 font-mono block">18</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Goles / KDA</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-purple-400 font-mono block">9.8</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Rating Promedio ★</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-amber-400 font-mono block">12</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Premios MVP</span>
            </div>
          </div>
        )}

        {/* TAB 3: MIS OFERTAS */}
        {activeTab === 'ATLETA_SOLICITUDES' && (
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase text-white">Ofertas de Fichaje Recibidas</h4>
            <div className="space-y-2">
              {offersList.map((off) => (
                <div key={off.id} className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-sm text-white block">{off.teamName}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{off.game} • {off.offerType}</span>
                  </div>

                  {off.status === 'ACEPTADO' ? (
                    <Badge variant="emerald">Fichaje Aceptado</Badge>
                  ) : (
                    <Button onClick={() => handleAcceptOffer(off.id)} size="sm" className="font-bold text-xs bg-emerald-500 text-slate-950">
                      Aceptar Oferta
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border-card)] pt-4">
          <Button onClick={onClose} size="sm" className="font-bold text-xs bg-[var(--accent-cyan)] text-slate-950">
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </div>
  );
}
