'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PositionBadge } from '@/components/ui/position-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      {/* 1. Full-Width Edge-to-Edge Banner Background Header */}
      <div className="relative w-full left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-950 border-b border-[var(--border-card)] shadow-2xl overflow-hidden min-h-[240px] sm:min-h-[320px] flex flex-col justify-end">
        {/* Full Bleed Banner Image Graphic */}
        <div className="absolute inset-0 z-0">
          <img
            src={playerBanner}
            alt={playerName}
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Content Box Layered Over the Full Width Banner */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div className="flex flex-row items-center gap-3 sm:gap-6">
            {/* Player Avatar Shield */}
            <div
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-slate-950 border-2 sm:border-4 flex items-center justify-center font-black text-lg sm:text-3xl shadow-2xl flex-shrink-0 overflow-hidden relative"
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

            {/* Player Main Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase drop-shadow-md flex items-center gap-2">
                  {playerName}
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h1>
                <PositionBadge primaryPosition={playerPos} secondaryPosition={hasValidSecPos} brandColor={activeColor} />
                <span className="text-xs font-mono font-black text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-amber-500/30">
                  ★ {playerRating} OVR
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 font-semibold drop-shadow-sm flex items-center gap-2 flex-wrap">
                <Shield className="w-3.5 h-3.5" style={{ color: activeColor }} />
                <span>Club: <strong className="text-white uppercase">{playerTeam}</strong></span>
                <span className="text-slate-400">•</span>
                <span className="text-cyan-300 font-mono font-bold">@{playerTag}</span>
                <span className="text-slate-400">•</span>
                <span className="text-purple-300 font-mono font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-400" />
                  ID: {playerGameId}
                </span>
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 flex-wrap font-semibold">
                <span className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" style={{ color: activeColor }} />
                  {player.platform || 'CROSSPLAY'}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {player.status || 'Atleta Activo'}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Flag className="w-3.5 h-3.5 text-cyan-400" />
                  {playerNacionalidad}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                className="text-xs font-bold text-slate-300 hover:text-white border border-white/10 rounded-xl"
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
      </div>

      {/* 2. Sub-Sub-Menu Navigation Tabs & Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('ficha')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'ficha'
                ? 'bg-cyan-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Ficha General
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-cyan-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Estadísticas eSports
          </button>
          <button
            onClick={() => setActiveTab('palmares')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'palmares'
                ? 'bg-cyan-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Historial & Palmarés
          </button>
          <button
            onClick={() => setActiveTab('ofertas')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'ofertas'
                ? 'bg-cyan-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
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
              <Card className="p-5 space-y-4 border-cyan-500/30 bg-slate-950">
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Rendimiento eSports en {player.gameSlug.toUpperCase()}:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Partidos Jugados</span>
                    <span className="text-2xl font-black text-white font-mono">{stats.matches}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Goles / Kills</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{stats.goals}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Asistencias</span>
                    <span className="text-2xl font-black text-purple-400 font-mono">{stats.assists}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Efectividad Victoria</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{stats.winrate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-xs font-black uppercase text-slate-300 mb-1">Perfil Competitivo:</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {player.bio || `Jugador profesional disputando ligas y torneos eSports oficiales en la posición ${playerPos}.`}
                  </p>
                </div>
              </Card>

              {/* Redes Sociales & Contacto del Atleta Card */}
              <Card className="p-5 space-y-4 border-purple-500/30 bg-slate-950">
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  Redes Sociales & Canales Oficiales:
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                  {player.instagram && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-pink-500/30 text-pink-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-pink-400" />
                      {player.instagram}
                    </span>
                  )}
                  {player.twitch && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-purple-400" />
                      {player.twitch}
                    </span>
                  )}
                  {player.youtube && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-rose-400" />
                      {player.youtube}
                    </span>
                  )}
                  {player.discord && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      {player.discord}
                    </span>
                  )}
                  {player.whatsapp && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {player.whatsapp}
                    </span>
                  )}
                  {player.website && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      {player.website}
                    </span>
                  )}
                  {!player.instagram && !player.twitch && !player.youtube && !player.discord && !player.whatsapp && !player.website && (
                    <span className="text-slate-400 text-xs italic">
                      Redes sociales registradas en el perfil del atleta.
                    </span>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar Data Card */}
            <Card className="p-5 space-y-4 border-purple-500/30 bg-slate-950">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Ficha Técnica del Atleta:
              </h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Club Actual:</span>
                  <strong className="text-purple-300 uppercase font-mono">{playerTeam}</strong>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Gamertag:</span>
                  <strong className="text-cyan-300 font-mono">@{playerTag}</strong>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">ID Juego ({player.gameSlug}):</span>
                  <strong className="text-amber-300 font-mono">{playerGameId}</strong>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Posición Principal:</span>
                  <strong className="text-white font-bold">{playerPos}</strong>
                </div>
                {playerSecPos && (
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="text-slate-400">Posición Secundaria:</span>
                    <strong className="text-slate-300">{playerSecPos}</strong>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Plataforma:</span>
                  <strong className="text-white">{player.platform || 'CROSSPLAY'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nacionalidad:</span>
                  <strong className="text-emerald-300">{playerNacionalidad}</strong>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'stats' && (
          <Card className="p-6 space-y-4 border-cyan-500/30">
            <h3 className="text-sm font-black uppercase text-white">Métricas Analíticas de Carrera</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                <span className="text-xs font-bold text-slate-400 block uppercase">Promedio MVP por Partido</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{(stats.mvps / (stats.matches || 1)).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                <span className="text-xs font-bold text-slate-400 block uppercase">Goles / Kills por Partido</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{(stats.goals / (stats.matches || 1)).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                <span className="text-xs font-bold text-slate-400 block uppercase">Rating Global eSports</span>
                <span className="text-3xl font-black text-cyan-400 font-mono">★ {playerRating}</span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'palmares' && (
          <Card className="p-6 space-y-4 border-purple-500/30">
            <h3 className="text-sm font-black uppercase text-white">Trofeos & Logros eSports</h3>
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <span className="font-extrabold text-sm text-white uppercase block">Campeón Liga de Elite</span>
                  <span className="text-xs text-slate-400">Temporada Oficial eSports</span>
                </div>
              </div>
              <Badge variant="gold">🥇 1er Lugar</Badge>
            </div>
          </Card>
        )}

        {activeTab === 'ofertas' && (
          <Card className="p-6 space-y-4 border-purple-500/30">
            <h3 className="text-sm font-black uppercase text-white">Historial de Fichajes</h3>
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between text-xs">
              <span className="font-extrabold text-white uppercase">{playerTeam}</span>
              <Badge variant="violet">Contrato Vigente</Badge>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
