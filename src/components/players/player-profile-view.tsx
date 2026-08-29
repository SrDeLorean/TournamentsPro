'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import {
  User, Shield, Trophy, Star, ArrowRightLeft, BarChart3, MessageSquare, Sparkles, Send, Globe, Share2, Video, Tv, Phone, ArrowLeft, Gamepad2, Monitor, CheckCircle2
} from 'lucide-react';

export interface PlayerData {
  id: string;
  name: string;
  gamertag: string;
  position: string;
  secondaryPosition?: string;
  gameId?: string;           // ID Juego para la API de ese juego
  nacionalidad?: string;
  fechaNacimiento?: string;
  telefono?: string;
  whatsapp?: string;
  instagram?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
  facebook?: string;
  website?: string;
  teamName: string;
  teamId?: string;
  rating: number;
  platform: string;
  avatarUrl?: string;
  bannerUrl?: string;
  gameSlug: string;
  role?: string;
  stats?: {
    matches: number;
    goals: number;
    assists: number;
    mvps: number;
    winrate: string;
  };
  status?: string;
  bio?: string;
}

interface PlayerProfileViewProps {
  player: PlayerData;
  onBack?: () => void;
  brandColor?: string;
  context?: 'global' | 'game';
  backHref?: string;
}

export function PlayerProfileView({ player, onBack, brandColor = '#00F0FF', context = 'game', backHref }: PlayerProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'ficha' | 'stats' | 'palmares' | 'ofertas'>('ficha');

  const activeColor = brandColor || '#00F0FF';
  const playerName = player.name || player.gamertag || 'Atleta eSports';
  const playerTag = player.gamertag || player.name || 'ATLETA';
  const playerPos = player.position || 'DFC';
  const playerSecPos = player.secondaryPosition;
  const playerGameId = player.gameId || `${player.gameSlug.toUpperCase()}-ID #998877`;
  const playerNacionalidad = player.nacionalidad || 'Chile';
  const playerTeam = player.teamName || 'Agencia Libre';
  const playerRating = player.rating || 88;
  const directoryHref = backHref || (context === 'global' ? '/usuarios' : `/${player.gameSlug}/usuarios`);

  const stats = player.stats || {
    matches: 34,
    goals: 18,
    assists: 12,
    mvps: 6,
    winrate: '74%',
  };

  return (
    <div className="public-player-profile animate-in fade-in duration-300" style={{ '--profile-accent': activeColor } as React.CSSProperties}>
      <div className="public-team-breadcrumb">
        <Link href={directoryHref}><ArrowLeft className="size-4" />Todos los usuarios</Link>
        <span>/</span><span>{player.gameSlug.toUpperCase()}</span>
      </div>

      <section className="public-team-hero public-player-hero">
        <div className="public-team-banner">
          <Image src={player.bannerUrl || '/images/default/banner-default.jpg'} alt={playerName} fill sizes="100vw" priority unoptimized={shouldBypassImageOptimization(player.bannerUrl || '')} className="object-cover" />
          <div className="public-team-banner-overlay" />
        </div>
        <div className="public-team-hero-content">
          <div className="public-team-identity">
            <div className="public-team-logo public-player-avatar" style={{ borderColor: activeColor }}>
              {player.avatarUrl ? <Image src={player.avatarUrl} alt={playerName} fill sizes="112px" unoptimized={shouldBypassImageOptimization(player.avatarUrl)} className="object-cover" /> : playerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="public-team-copy">
              <p className="public-team-eyebrow"><Sparkles className="size-3.5" />Ficha competitiva verificada</p>
              <div className="public-team-title-row"><h1>{playerName}</h1><span style={{ borderColor: activeColor }}>{playerPos}</span></div>
              <p className="public-team-description">{player.bio || `Atleta oficial de ${playerTeam}.`}</p>
              <div className="public-team-facts">
                <span><Gamepad2 className="size-3.5" />@{playerTag}</span><span><Monitor className="size-3.5" />{player.platform || 'CROSSPLAY'}</span><span className="is-active"><CheckCircle2 className="size-3.5" />{player.status || 'Activo'}</span>
              </div>
            </div>
          </div>
          <div className="public-team-actions">
            {onBack ? <Button onClick={onBack} variant="outline"><ArrowLeft className="size-4" />Volver</Button> : null}
            <Button className="public-team-primary-action"><Send className="size-4" />Proponer fichaje</Button>
          </div>
        </div>
        <div className="public-team-metrics">
          <div><strong>{playerRating}</strong><span>rating</span></div><div><strong>{stats.matches}</strong><span>partidos</span></div><div><strong>{stats.goals}</strong><span>goles / kills</span></div><div><strong>{stats.winrate}</strong><span>victorias</span></div>
        </div>
      </section>

      {/* 2. Sub-Sub-Menu Navigation Tabs & Content Container */}
      <div className="public-player-content space-y-6">
        <div className="public-team-tabs">
          <button
            onClick={() => setActiveTab('ficha')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'ficha'
                ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-lg'
                : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Ficha General
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-lg'
                : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Estadísticas eSports
          </button>
          <button
            onClick={() => setActiveTab('palmares')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'palmares'
                ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-lg'
                : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Historial & Palmarés
          </button>
          <button
            onClick={() => setActiveTab('ofertas')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'ofertas'
                ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-lg'
                : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Ofertas de Fichaje
          </button>
        </div>

        {/* 3. Tab Contents */}
        {activeTab === 'ficha' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats & Bio Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Rendimiento eSports en {player.gameSlug.toUpperCase()}:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Partidos Jugados</span>
                    <span className="text-2xl font-black text-[var(--text-heading)] font-mono">{stats.matches}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Goles / Kills</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{stats.goals}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Asistencias</span>
                    <span className="text-2xl font-black text-purple-400 font-mono">{stats.assists}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Efectividad Victoria</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{stats.winrate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-card)]">
                  <h4 className="text-xs font-black uppercase text-[var(--text-primary)] mb-1">Perfil Competitivo:</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {player.bio || `Jugador profesional disputando ligas y torneos eSports oficiales en la posición ${playerPos}.`}
                  </p>
                </div>
              </Card>

              {/* Redes Sociales & Contacto del Atleta Card */}
              <Card className="p-5 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  Redes Sociales & Canales Oficiales:
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                  {player.instagram && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-pink-500/30 text-pink-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-pink-400" />
                      {player.instagram}
                    </span>
                  )}
                  {player.twitch && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-purple-500/30 text-purple-300 flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-purple-400" />
                      {player.twitch}
                    </span>
                  )}
                  {player.youtube && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-rose-500/30 text-rose-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-rose-400" />
                      {player.youtube}
                    </span>
                  )}
                  {player.discord && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      {player.discord}
                    </span>
                  )}
                  {player.whatsapp && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {player.whatsapp}
                    </span>
                  )}
                  {player.website && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-cyan-500/30 text-[var(--accent-cyan)] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                      {player.website}
                    </span>
                  )}
                  {!player.instagram && !player.twitch && !player.youtube && !player.discord && !player.whatsapp && !player.website && (
                    <span className="text-[var(--text-muted)] text-xs italic">
                      Redes sociales registradas en el perfil del atleta.
                    </span>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar Data Card */}
            <Card className="p-5 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Ficha Técnica del Atleta:
              </h3>
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">Club Actual:</span>
                  <strong className="text-purple-300 uppercase font-mono">{playerTeam}</strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">Gamertag:</span>
                  <strong className="text-cyan-300 font-mono">@{playerTag}</strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">ID Juego ({player.gameSlug}):</span>
                  <strong className="text-amber-300 font-mono">{playerGameId}</strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">Posición Principal:</span>
                  <strong className="text-[var(--text-heading)] font-bold">{playerPos}</strong>
                </div>
                {playerSecPos && (
                  <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                    <span className="text-[var(--text-secondary)]">Posición Secundaria:</span>
                    <strong className="text-[var(--text-primary)]">{playerSecPos}</strong>
                  </div>
                )}
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">Plataforma:</span>
                  <strong className="text-[var(--text-heading)]">{player.platform || 'CROSSPLAY'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Nacionalidad:</span>
                  <strong className="text-emerald-300">{playerNacionalidad}</strong>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'stats' && (
          <Card className="p-6 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)]">Métricas Analíticas de Carrera</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-xs font-bold text-[var(--text-muted)] block uppercase">Promedio MVP por Partido</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{(stats.mvps / (stats.matches || 1)).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-xs font-bold text-[var(--text-muted)] block uppercase">Goles / Kills por Partido</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{(stats.goals / (stats.matches || 1)).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-xs font-bold text-[var(--text-muted)] block uppercase">Rating Global eSports</span>
                <span className="text-3xl font-black text-[var(--accent-cyan)] font-mono">★ {playerRating}</span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'palmares' && (
          <Card className="p-6 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)]">Trofeos & Logros eSports</h3>
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <span className="font-extrabold text-sm text-[var(--text-heading)] uppercase block">Campeón Liga de Elite</span>
                  <span className="text-xs text-[var(--text-secondary)]">Temporada Oficial eSports</span>
                </div>
              </div>
              <Badge variant="gold">🥇 1er Lugar</Badge>
            </div>
          </Card>
        )}

        {activeTab === 'ofertas' && (
          <Card className="p-6 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)]">Historial de Fichajes</h3>
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between text-xs">
              <span className="font-extrabold text-[var(--text-heading)] uppercase">{playerTeam}</span>
              <Badge variant="violet">Contrato Vigente</Badge>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
