'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicProfileShell } from '@/components/public/public-profile-shell';
import { SubSubNavbar } from '@/components/layout/sub-sub-navbar';
import {
  User, Shield, Trophy, Star, ArrowRightLeft, BarChart3, MessageSquare, Sparkles, Send, Globe, Share2, Video, Tv, Phone, Gamepad2, Monitor, CheckCircle2
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

export function PlayerProfileView({ player, brandColor = 'var(--app-accent)' }: PlayerProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'ficha' | 'stats' | 'palmares' | 'ofertas'>('ficha');

  const activeColor = brandColor || 'var(--app-accent)';
  const playerName = player.name || player.gamertag || 'Atleta eSports';
  const playerTag = player.gamertag || player.name || 'ATLETA';
  const playerPos = player.position || 'DFC';
  const playerSecPos = player.secondaryPosition;
  const playerGameId = player.gameId || `${player.gameSlug.toUpperCase()}-ID 998877`;
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

  const profileTabs = [
    { id: 'ficha' as const, label: 'Ficha General', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'stats' as const, label: 'Estadísticas eSports', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'palmares' as const, label: 'Historial & Palmarés', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'ofertas' as const, label: 'Ofertas de Fichaje', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  ];

  return (
    <PublicProfileShell
      entityId={player.id}
      transitionPrefix="player"
      accentColor={activeColor}
      bannerUrl={player.bannerUrl || '/images/default/banner-default.jpg'}
      bannerAlt={playerName}
      logoUrl={player.avatarUrl}
      logoAlt={playerName}
      logoFallback={playerName.slice(0, 2).toUpperCase()}
      eyebrow={<><Sparkles className="size-3.5" />Ficha competitiva verificada</>}
      title={playerName}
      badge={playerPos}
      description={player.bio || `Atleta oficial de ${playerTeam}.`}
      facts={<><span><Gamepad2 className="size-3.5" />@{playerTag}</span><span><Monitor className="size-3.5" />{player.platform || 'CROSSPLAY'}</span><span className="is-active"><CheckCircle2 className="size-3.5" />{player.status || 'Activo'}</span></>}
      actions={<Button className="public-team-primary-action"><Send className="size-4" />Proponer fichaje</Button>}
      metrics={[{ value: playerRating, label: 'rating' }, { value: stats.matches, label: 'partidos' }, { value: stats.goals, label: 'goles / kills' }, { value: stats.winrate, label: 'victorias' }]}
      tabs={<SubSubNavbar tabs={profileTabs} activeTab={activeTab} onSelectTab={setActiveTab} brandColor={activeColor} />}
      contentClassName="public-player-content space-y-6"
    >

        {/* 3. Tab Contents */}
        {activeTab === 'ficha' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats & Bio Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-[var(--app-warning)]" />
                  Rendimiento eSports en {player.gameSlug.toUpperCase()}:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Partidos Jugados</span>
                    <span className="text-2xl font-black text-[var(--text-heading)] font-[family-name:var(--font-active)]">{stats.matches}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Goles / Kills</span>
                    <span className="text-2xl font-black text-[var(--app-positive)] font-[family-name:var(--font-active)]">{stats.goals}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Asistencias</span>
                    <span className="text-2xl font-black text-[var(--app-accent-2)] font-[family-name:var(--font-active)]">{stats.assists}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Efectividad Victoria</span>
                    <span className="text-2xl font-black text-[var(--app-accent)] font-[family-name:var(--font-active)]">{stats.winrate}</span>
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
                  <Globe className="w-4 h-4 text-[var(--app-accent-2)]" />
                  Redes Sociales & Canales Oficiales:
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                  {player.instagram && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--app-accent-2)]/30 text-[var(--app-accent-2)] flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
                      {player.instagram}
                    </span>
                  )}
                  {player.twitch && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--app-accent-2)]/30 text-[var(--app-accent-2)] flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
                      {player.twitch}
                    </span>
                  )}
                  {player.youtube && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--app-danger)]/30 text-[var(--app-danger)] flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[var(--app-danger)]" />
                      {player.youtube}
                    </span>
                  )}
                  {player.discord && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--app-accent-2)]/30 text-[var(--app-accent-2)] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
                      {player.discord}
                    </span>
                  )}
                  {player.whatsapp && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--app-positive)]/30 text-[var(--app-positive)] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[var(--app-positive)]" />
                      {player.whatsapp}
                    </span>
                  )}
                  {player.website && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--app-accent)]/30 text-[var(--app-accent)] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[var(--app-accent)]" />
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
                <Shield className="w-4 h-4 text-[var(--app-accent-2)]" />
                Ficha Técnica del Atleta:
              </h3>
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">Club Actual:</span>
                  <strong className="text-[var(--app-accent-2)] uppercase font-[family-name:var(--font-active)]">{playerTeam}</strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">Gamertag:</span>
                  <strong className="text-[var(--app-accent)] font-[family-name:var(--font-active)]">@{playerTag}</strong>
                </div>
                <div className="flex justify-between border-b border-[var(--border-card)] pb-1.5">
                  <span className="text-[var(--text-secondary)]">ID Juego ({player.gameSlug}):</span>
                  <strong className="text-[var(--app-warning)] font-[family-name:var(--font-active)]">{playerGameId}</strong>
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
                  <strong className="text-[var(--app-positive)]">{playerNacionalidad}</strong>
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
                <span className="text-3xl font-black text-[var(--app-warning)] font-[family-name:var(--font-active)]">{(stats.mvps / (stats.matches || 1)).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-xs font-bold text-[var(--text-muted)] block uppercase">Goles / Kills por Partido</span>
                <span className="text-3xl font-black text-[var(--app-positive)] font-[family-name:var(--font-active)]">{(stats.goals / (stats.matches || 1)).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-xs font-bold text-[var(--text-muted)] block uppercase">Rating Global eSports</span>
                <span className="text-3xl font-black text-[var(--app-accent)] font-[family-name:var(--font-active)]">★ {playerRating}</span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'palmares' && (
          <Card className="p-6 space-y-4 border-[var(--border-card)] bg-[var(--bg-card)]">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)]">Trofeos & Logros eSports</h3>
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[var(--app-warning)]" />
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
    </PublicProfileShell>
  );
}
