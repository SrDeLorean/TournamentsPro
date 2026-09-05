'use client';

import React, { useState } from 'react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import {
  User, BarChart2, FileText, CheckCircle2, X
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
  const [tabSelection, setTabSelection] = useState({ initialTab, value: initialTab });
  const activeTab = tabSelection.initialTab === initialTab ? tabSelection.value : initialTab;
  const setActiveTab = (value: AthleteTabOption) => setTabSelection({ initialTab, value });

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
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Gestión de atleta" size="lg" showCloseButton={false} className="glass-panel p-6 sm:p-8 border-[var(--app-accent)]/40 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <Avatar fallback={currentUser?.name || 'Atleta'} size="lg" status="online" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase text-[var(--text-heading)]">
                  {currentUser?.name || 'Atleta eSports'}
                </h3>
                <Badge variant="cyan">👤 Panel Personal de Atleta</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Gestión de ficha técnica personal, rendimiento e historial de ofertas en {gameObj.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-heading)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-3 rounded-xl bg-[var(--app-positive-soft)] border border-[var(--app-positive)]/50 text-[var(--app-positive)] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--app-positive)]" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Athlete Management Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-[var(--app-canvas)] border border-[var(--app-accent)]/30">
          <button
            onClick={() => setActiveTab('ATLETA_FICHA')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ATLETA_FICHA'
                ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Mi Ficha Técnica
          </button>

          <button
            onClick={() => setActiveTab('ATLETA_STATS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ATLETA_STATS'
                ? 'bg-[var(--app-accent)] text-[var(--text-heading)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Mis Estadísticas
          </button>

          <button
            onClick={() => setActiveTab('ATLETA_SOLICITUDES')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'ATLETA_SOLICITUDES'
                ? 'bg-[var(--app-danger)] text-[var(--text-heading)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
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
                  <h4 className="text-lg font-black uppercase text-[var(--text-heading)]">{currentUser?.name}</h4>
                  <span className="text-xs text-[var(--app-accent)] font-[family-name:var(--font-active)] font-bold">Gamertag: @{currentUser?.gamertag}</span>
                </div>
                <Badge variant="cyan" className="font-[family-name:var(--font-active)] font-bold text-xs">Rating ★ {currentUser?.rating || '9.8'}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Posición Táctica</span>
                  <span className="font-extrabold text-[var(--app-accent)]">{currentUser?.position || 'DFC'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Plataforma</span>
                  <span className="font-extrabold text-[var(--text-heading)]">{currentUser?.platform || 'PS5'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Juego Disciplina</span>
                  <span className="font-extrabold text-[var(--text-heading)]">{gameObj.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MIS ESTADÍSTICAS */}
        {activeTab === 'ATLETA_STATS' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-[var(--app-accent)] font-[family-name:var(--font-active)] block">42</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Partidos Oficiales</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-[var(--app-positive)] font-[family-name:var(--font-active)] block">18</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Goles / KDA</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-[var(--app-accent-2)] font-[family-name:var(--font-active)] block">9.8</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Rating Promedio ★</span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <span className="text-3xl font-black text-[var(--app-warning)] font-[family-name:var(--font-active)] block">12</span>
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Premios MVP</span>
            </div>
          </div>
        )}

        {/* TAB 3: MIS OFERTAS */}
        {activeTab === 'ATLETA_SOLICITUDES' && (
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase text-[var(--text-heading)]">Ofertas de Fichaje Recibidas</h4>
            <div className="space-y-2">
              {offersList.map((off) => (
                <div key={off.id} className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-sm text-[var(--text-heading)] block">{off.teamName}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{off.game} • {off.offerType}</span>
                  </div>

                  {off.status === 'ACEPTADO' ? (
                    <Badge variant="emerald">Fichaje Aceptado</Badge>
                  ) : (
                    <Button onClick={() => handleAcceptOffer(off.id)} size="sm" className="font-bold text-xs bg-[var(--app-positive)] text-[var(--accent-contrast)]">
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
          <Button onClick={onClose} size="sm" className="font-bold text-xs bg-[var(--app-accent)] text-[var(--accent-contrast)]">
            Cerrar Ficha
          </Button>
        </div>
    </Modal>
  );
}
