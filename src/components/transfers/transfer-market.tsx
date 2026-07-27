'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { initialTransfers, TransferListing } from '@/lib/data-store';
import { GAMES_CATALOG, GameConfig } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/ui/filter-bar';
import { ArrowRightLeft, UserCheck, Shield, MessageSquare, Plus, CheckCircle2, Clock, Sparkles, Filter, Gamepad2 } from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';

interface TransferMarketProps {
  game?: GameConfig;
}

export function TransferMarket({ game }: TransferMarketProps) {
  const { activeGameSlug } = useAuth();
  const currentGameSlug = game?.slug || activeGameSlug || 'eafc26';
  const currentGameObj = GAMES_CATALOG[currentGameSlug] || GAMES_CATALOG['eafc26'];

  const [activeTab, setActiveTab] = useState<'ALL' | 'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for creating a new Transfer Listing
  const [listingType, setListingType] = useState<'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR'>('JUGADOR_BUSCA_CLUB');
  const [positionInput, setPositionInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [platformInput, setPlatformInput] = useState('CROSSPLAY');

  const [transfers, setTransfers] = useState<TransferListing[]>(initialTransfers);

  const filteredTransfers = transfers.filter((item) => {
    const matchesGame = item.gameSlug === currentGameSlug;
    const matchesTab = activeTab === 'ALL' || item.type === activeTab;
    const matchesSearch =
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userGamertag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.teamName && item.teamName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesGame && matchesTab && matchesSearch;
  });

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionInput.trim() || !messageInput.trim()) return;

    const newListing: TransferListing = {
      id: `tr-${Date.now()}`,
      type: listingType,
      userName: listingType === 'JUGADOR_BUSCA_CLUB' ? 'SrDeLorean' : 'Caxorro (Capitán)',
      userGamertag: listingType === 'JUGADOR_BUSCA_CLUB' ? 'SrDeLorean' : 'Caxorro',
      teamName: listingType === 'CLUB_RECLUTA_JUGADOR' ? 'Sangre Nueva FC' : undefined,
      gameSlug: (game ? game.slug : 'eafc26') as any,
      position: positionInput.trim(),
      platform: platformInput,
      status: 'DISPONIBLE',
      date: 'Ahora mismo',
      message: messageInput.trim(),
    };

    setTransfers([newListing, ...transfers]);
    setShowCreateModal(false);
    setPositionInput('');
    setMessageInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* 🚀 Top Control Strip & Create Listing Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-[var(--border-card)] shadow-lg">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-[var(--accent-cyan)] animate-pulse" />
          <div>
            <h3 className="text-base font-black uppercase text-[var(--text-heading)]">
              MERCADO DE TRASPASOS & AGENCIA LIBRE
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Conecta directamente atletas disponibles y escuadras en búsqueda de fichajes
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="font-bold text-xs bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Publicar Fichaje / Oferta
        </Button>
      </div>

      {/* Tabs Selector & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
              activeTab === 'ALL'
                ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            Todas las Ofertas
          </button>
          <button
            onClick={() => setActiveTab('JUGADOR_BUSCA_CLUB')}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
              activeTab === 'JUGADOR_BUSCA_CLUB'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            Agencia Libre (Atletas)
          </button>
          <button
            onClick={() => setActiveTab('CLUB_RECLUTA_JUGADOR')}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
              activeTab === 'CLUB_RECLUTA_JUGADOR'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            Reclutamiento de Clubes
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar posición, gamertag o club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)]"
          />
        </div>
      </div>

      {/* Transfer Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTransfers.map((item) => {
          const gameObj = GAMES_CATALOG[item.gameSlug] || GAMES_CATALOG['eafc26'];
          const isPlayerListing = item.type === 'JUGADOR_BUSCA_CLUB';

          return (
            <Card key={item.id} className="glass-panel-hover p-6 flex flex-col justify-between space-y-4 shadow-xl border border-[var(--border-card)]">
              <div className="space-y-3">
                
                {/* Badge Type & Date */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={isPlayerListing ? 'gold' : 'violet'}>
                      {isPlayerListing ? 'ATLETA BUSCA CLUB' : 'CLUB RECLUTA JUGADOR'}
                    </Badge>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                      {item.platform}
                    </span>
                  </div>

                  <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    {item.date}
                  </span>
                </div>

                {/* Name & Title */}
                <div>
                  <h3 className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                    {item.userName}
                    {item.teamName && (
                      <span className="text-xs text-[var(--accent-cyan)] font-bold font-mono">
                        [{item.teamName}]
                      </span>
                    )}
                  </h3>
                  <p className="text-xs font-mono text-[var(--accent-cyan)] font-bold">
                    Gamertag: {item.userGamertag}
                  </p>
                </div>

                {/* Game & Tactical Required Position */}
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <GameLogo game={gameObj} size="sm" />
                    <span className="text-[var(--text-heading)]">{gameObj.name}</span>
                  </div>

                  <span className="px-2.5 py-1 rounded-md bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] font-mono text-xs uppercase">
                    Posición: {item.position}
                  </span>
                </div>

                {/* Message Body */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-card)]">
                  "{item.message}"
                </p>
              </div>

              {/* Action Button: Open Chat Direct */}
              <Link href="/mensajes" className="w-full">
                <Button size="sm" className="w-full font-extrabold text-xs bg-[var(--accent-cyan)] text-slate-950 hover:opacity-90 flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Contactar por Fichaje
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* 📝 Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-[var(--border-card)] space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <h3 className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
                Publicar Anuncio en Mercado
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Tipo de Publicación</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-bold"
                >
                  <option value="JUGADOR_BUSCA_CLUB">Soy Atleta y busco Club</option>
                  <option value="CLUB_RECLUTA_JUGADOR">Soy Capitán y recluto Jugador</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Posición Táctica / Rol Requerido</label>
                <input
                  type="text"
                  required
                  placeholder="ej. DFC Principal, AWPer, Duelista o MID"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Plataforma</label>
                <select
                  value={platformInput}
                  onChange={(e) => setPlatformInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-bold"
                >
                  <option value="CROSSPLAY">CROSSPLAY</option>
                  <option value="PS5">PS5</option>
                  <option value="PC">PC</option>
                  <option value="XBOX">XBOX</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Mensaje / Requisitos</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe tus horarios, experiencia previa o condiciones..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-bold text-xs bg-[var(--accent-cyan)] text-slate-950">
                  Publicar Ahora
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
