'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PositionBadge } from '@/components/ui/position-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  User, Shield, Trophy, Star, Award, Calendar, ArrowRightLeft, BarChart3, MessageSquare, Sparkles, Monitor, CheckCircle2, History, Send, Globe, Share2, Video, Tv, Phone, Tag, Flag
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
}

export function PlayerProfileView({ player, onBack, brandColor = '#00F0FF' }: PlayerProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'ficha' | 'stats' | 'palmares' | 'ofertas'>('ficha');

  const activeColor = brandColor || '#00F0FF';
  const playerBanner = player.bannerUrl || '/images/default/banner-default.jpg';
  const playerName = player.name || player.gamertag || 'Atleta eSports';
  const playerTag = player.gamertag || player.name || 'ATLETA';
  const playerPos = player.position || 'DFC';
  const playerSecPos = player.secondaryPosition;
  const hasValidSecPos = playerSecPos && typeof playerSecPos === 'string' && playerSecPos.trim() !== '' && !['n/a', 'na', 'sin posición', 'sin posicion', 'ninguna', 'none', '-'].includes(playerSecPos.trim().toLowerCase()) && playerSecPos.trim() !== playerPos ? playerSecPos.trim() : null;
  const playerGameId = player.gameId || `${player.gameSlug.toUpperCase()}-ID #998877`;
  const playerNacionalidad = player.nacionalidad || 'Chile';
  const playerTeam = player.teamName || 'Agencia Libre';
  const playerRating = player.rating || 88;

  const stats = player.stats || {
    matches: 34,
    goals: 18,
    assists: 12,
    mvps: 6,
    winrate: '74%',
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 -mt-px">
      <PageHeader
        badgeText={`★ ${playerRating} OVR | ${playerPos}`}
        badgeIcon={<Sparkles className="w-3.5 h-3.5" style={{ color: activeColor }} />}
        title={playerName}
        highlightTitle={playerTeam}
        description={`@${playerTag} • ID: ${playerGameId} • ${player.platform || 'CROSSPLAY'} • ${player.status || 'Atleta Activo'} • ${playerNacionalidad}`}
        brandColor={activeColor}
      >
        <div className="flex flex-col items-start lg:items-end gap-3">
          <div
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-[var(--bg-card)] border-2 sm:border-4 flex items-center justify-center font-black text-lg sm:text-3xl shadow-2xl flex-shrink-0 overflow-hidden relative"
            style={{ borderColor: activeColor, boxShadow: `0 0 25px ${activeColor}44` }}
          >
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={playerName}
                onError={(e) => {
                  e.currentTarget.src = '/images/default/logo-default.png';
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar fallback={playerName} size="lg" status="online" />
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl"
              >
                ← Volver
              </Button>
            )}
            <Button
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Proponer Fichaje
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* 2. Sub-Sub-Menu Navigation Tabs & Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3 overflow-x-auto scrollbar-none">
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
