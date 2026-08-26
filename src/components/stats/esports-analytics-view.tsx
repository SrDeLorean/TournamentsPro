'use client';

import React, { useState } from 'react';
import { GameConfig } from '@/lib/games-data';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  Award, Flame, TrendingUp, Activity, Filter, CheckCircle2
} from 'lucide-react';

interface EsportsAnalyticsViewProps {
  game: GameConfig;
}

// Game-specific role & position selector options mapping
const GAME_SELECTOR_OPTIONS: Record<string, { id: string; label: string; iconLabel: string }[]> = {
  eafc26: [
    { id: 'TODAS', label: 'Todas las Posiciones (11v11)', iconLabel: '⚽' },
    { id: 'DC', label: 'Delanteros (DC, EI, ED)', iconLabel: '⚡' },
    { id: 'MCO', label: 'Mediocampistas (MCO, MC, MCD)', iconLabel: '🧠' },
    { id: 'DFC', label: 'Defensas (DFC, LI, LD)', iconLabel: '🛡️' },
    { id: 'POR', label: 'Porteros (POR)', iconLabel: '🧤' },
  ],
  lol: [
    { id: 'TODOS', label: 'Todas las Líneas (La Grieta)', iconLabel: '⚔️' },
    { id: 'TOP', label: 'Top Lane (Carril Superior)', iconLabel: '🛡️' },
    { id: 'JUG', label: 'Jungle (Jungla)', iconLabel: '🌲' },
    { id: 'MID', label: 'Mid Lane (Carril Central)', iconLabel: '🔥' },
    { id: 'ADC', label: 'ADC / Bot Lane (Tirador)', iconLabel: '🏹' },
    { id: 'SUP', label: 'Support (Soporte)', iconLabel: '✨' },
  ],
  csgo: [
    { id: 'TODOS', label: 'Todos los Roles (5v5 Táctico)', iconLabel: '🎯' },
    { id: 'AWPer', label: 'AWPer (Francotirador)', iconLabel: '🔭' },
    { id: 'IGL', label: 'IGL (Líder Táctico)', iconLabel: '👑' },
    { id: 'Entry', label: 'Entry Fragger (Abridor)', iconLabel: '💥' },
    { id: 'Support', label: 'Support / Grenadier', iconLabel: '💣' },
    { id: 'Lurker', label: 'Lurker / Espía', iconLabel: '🕵️' },
  ],
  valorant: [
    { id: 'TODOS', label: 'Todos los Agentes (5v5)', iconLabel: '💥' },
    { id: 'Duelista', label: 'Duelista (Jett, Reyna, Raze)', iconLabel: '⚔️' },
    { id: 'Iniciador', label: 'Iniciador (Sova, Fade, Breach)', iconLabel: '👁️' },
    { id: 'Controlador', label: 'Controlador (Omen, Viper, Brim)', iconLabel: '🌫️' },
    { id: 'Centinela', label: 'Centinela (Killjoy, Cypher, Sage)', iconLabel: '🔒' },
  ],
  rocketleague: [
    { id: 'TODOS', label: 'Todos los Roles (Arena 3v3)', iconLabel: '🚗' },
    { id: 'Striker', label: 'Striker (Anotador Principal)', iconLabel: '🚀' },
    { id: 'Playmaker', label: 'Playmaker (Pasador & Aéreo)', iconLabel: '🎯' },
    { id: 'Defender', label: 'Defender (Portero & Cierre)', iconLabel: '🛡️' },
  ],
};

// Game and role tailored graphics and infographic metrics dataset
const ROLE_ANALYTICS_DATA: Record<string, Record<string, {
  summaryTitle: string;
  cards: { title: string; value: string; detail: string; color: string }[];
  bars: { name: string; percentage: number; color: string }[];
  topAthletes: { rank: number; name: string; gamertag: string; team: string; stat: string; rating: string }[];
}>> = {
  eafc26: {
    TODAS: {
      summaryTitle: 'Resumen Global de Posiciones 11v11 (EA FC 26)',
      cards: [
        { title: 'Efectividad General Victoria', value: '78.4%', detail: 'Promedio de victorias equipo local', color: '#00F0FF' },
        { title: 'Goles por Partido', value: '3.2', detail: 'Promedio anotaciones por encuentro', color: '#10B981' },
        { title: 'Atletas Inscriptos', value: '248', detail: 'Jugadores eSports verificados', color: '#C084FC' },
        { title: 'Rating Máximo MVP', value: '9.8 ★', detail: 'SrDeLorean (SAN LORENZO ESP)', color: '#F59E0B' },
      ],
      bars: [
        { name: 'Efectividad de Pases en Medio', percentage: 92, color: '#00F0FF' },
        { name: 'Conversión de Tiros a Gol (Delanteros)', percentage: 76, color: '#10B981' },
        { name: 'Éxito en Entradas de Defensas', percentage: 84, color: '#C084FC' },
        { name: 'Porcentaje Atajadas de Porteros', percentage: 81, color: '#F59E0B' },
      ],
      topAthletes: [
        { rank: 1, name: 'Sebastián Rodríguez', gamertag: 'SrDeLorean', team: 'LeguaYork eSp', stat: '18 Goles / 8 Asist', rating: '9.8' },
        { rank: 2, name: 'Lucas Benítez', gamertag: 'Vhaex_CS', team: 'Highfield XX', stat: '14 Goles / 10 Asist', rating: '9.6' },
        { rank: 3, name: 'Valentin Rossi', gamertag: 'ViperX', team: 'Sangre Nueva FC', stat: '12 Goles / 6 Asist', rating: '9.5' },
      ],
    },
    DC: {
      summaryTitle: 'Infografía de Rendimiento: Delanteros (DC, EI, ED)',
      cards: [
        { title: 'Goles por Partido (DC)', value: '2.85', detail: 'Promedio de anotación de atacantes', color: '#10B981' },
        { title: 'Conversión de Tiros %', value: '68%', detail: 'Tiros a puerta convertidos en gol', color: '#00F0FF' },
        { title: 'xG (Goles Esperados)', value: '3.12', detail: 'Métrica de peligro en área rival', color: '#F59E0B' },
        { title: 'Hat-Tricks de la Liga', value: '14', detail: 'Tripletas anotadas en la temporada', color: '#C084FC' },
      ],
      bars: [
        { name: 'Efectividad de Remates al Primer Toque', percentage: 88, color: '#10B981' },
        { name: 'Desmarques Exitosos a la Espalda', percentage: 82, color: '#00F0FF' },
        { name: 'Goles de Cabeza / Juego Aéreo', percentage: 65, color: '#F59E0B' },
      ],
      topAthletes: [
        { rank: 1, name: 'Sebastián Rodríguez', gamertag: 'SrDeLorean', team: 'LeguaYork eSp', stat: '18 Goles (DC)', rating: '9.8' },
        { rank: 2, name: 'Francisco Morales', gamertag: 'Pancho_T10', team: 'Sangre Nueva FC', stat: '14 Goles (EI)', rating: '9.5' },
      ],
    },
    MCO: {
      summaryTitle: 'Infografía de Rendimiento: Mediocampistas (MCO, MC, MCD)',
      cards: [
        { title: 'Pases Clave por Partido', value: '8.4', detail: 'Pases filtrados de gol', color: '#00F0FF' },
        { title: 'Efectividad de Pase %', value: '91.2%', detail: 'Precisión en distribución', color: '#10B981' },
        { title: 'Recuperaciones en Medio', value: '6.8', detail: 'Balones robados en zona media', color: '#C084FC' },
        { title: 'Asistencias Directas', value: '1.85', detail: 'Pases de gol por partido', color: '#F59E0B' },
      ],
      bars: [
        { name: 'Pases Filtrados al Hueco', percentage: 94, color: '#00F0FF' },
        { name: 'Retención de Balón bajo Presión', percentage: 89, color: '#10B981' },
        { name: 'Distribución de Banda a Banda', percentage: 86, color: '#C084FC' },
      ],
      topAthletes: [
        { rank: 1, name: 'AcZinoMeme', gamertag: 'AcZinoMeme', team: 'Highfield XX', stat: '12 Asist (MCO)', rating: '9.4' },
        { rank: 2, name: 'Valentin Rossi', gamertag: 'ViperX', team: 'Sangre Nueva FC', stat: '9 Asist (MC)', rating: '9.3' },
      ],
    },
    DFC: {
      summaryTitle: 'Infografía de Rendimiento: Defensas (DFC, LI, LD)',
      cards: [
        { title: 'Entradas Limpias %', value: '88.5%', detail: 'Duelos defensivos ganados', color: '#C084FC' },
        { title: 'Duelos Aéreos Ganados', value: '76.4%', detail: 'Cabezazos ganados en área', color: '#00F0FF' },
        { title: 'Despejes Efectivos', value: '9.2', detail: 'Balones despejados por juego', color: '#10B981' },
        { title: 'Vallas Invictas Totales', value: '12', detail: 'Partidos sin recibir gol', color: '#F59E0B' },
      ],
      bars: [
        { name: 'Robos de Balón sin Falta', percentage: 91, color: '#C084FC' },
        { name: 'Cobertura de Centro de Área', percentage: 85, color: '#00F0FF' },
        { name: 'Salida de Balón Jugado', percentage: 78, color: '#10B981' },
      ],
      topAthletes: [
        { rank: 1, name: 'Joaquín Silva', gamertag: 'SG Jotta', team: 'San Lorenzo eSp', stat: '42 Robos (DFC)', rating: '9.6' },
        { rank: 2, name: 'Rodrigo Sir', gamertag: 'SirRodrick_FC', team: 'LeguaYork eSp', stat: '38 Robos (DFC)', rating: '9.4' },
      ],
    },
    POR: {
      summaryTitle: 'Infografía de Rendimiento: Porteros (POR)',
      cards: [
        { title: 'Atajadas por Partido', value: '5.6', detail: 'Paradas salvadoras por juego', color: '#F59E0B' },
        { title: 'Paradas Área Chica %', value: '84.2%', detail: 'Efectividad en tiros a bocajarro', color: '#10B981' },
        { title: 'Despejes con Puños', value: '3.1', detail: 'Centros neutralizados en aire', color: '#00F0FF' },
        { title: 'Penalties Detenidos', value: '4', detail: 'Penales parados en la liga', color: '#C084FC' },
      ],
      bars: [
        { name: 'Paradas en Mano a Mano 1v1', percentage: 86, color: '#F59E0B' },
        { name: 'Desvío de Balones a Córner', percentage: 92, color: '#10B981' },
        { name: 'Saques Largos de Precisión', percentage: 80, color: '#00F0FF' },
      ],
      topAthletes: [
        { rank: 1, name: 'Gabriel T', gamertag: 'T_TGaboT_T', team: 'Sangre Nueva FC', stat: '34 Atajadas (POR)', rating: '9.5' },
      ],
    },
  },
  lol: {
    TODOS: {
      summaryTitle: 'Resumen Global de Roles en La Grieta del Invocador (LoL)',
      cards: [
        { title: 'KDA Promedio de Liga', value: '4.2', detail: 'Kill / Death / Assist Ratio', color: '#C084FC' },
        { title: 'DPM (Daño por Minuto)', value: '745', detail: 'Impacto de daño en peleas', color: '#F59E0B' },
        { title: 'Control de Dragones %', value: '78.2%', detail: 'Objetivos neutrales asegurados', color: '#00F0FF' },
        { title: 'Pentakills la Temporada', value: '3', detail: 'Asesinatos quíntuples', color: '#10B981' },
      ],
      bars: [
        { name: 'Mid Lane DPM Impact', percentage: 92, color: '#F59E0B' },
        { name: 'ADC CS por Minuto (Farm)', percentage: 96, color: '#00F0FF' },
        { name: 'Jungle Objective Control', percentage: 84, color: '#10B981' },
        { name: 'Support Vision Score', percentage: 88, color: '#C084FC' },
      ],
      topAthletes: [
        { rank: 1, name: 'Faker Clone', gamertag: 'HideOnBush', team: 'T1 Academy', stat: '780 DPM (MID)', rating: '9.9' },
        { rank: 2, name: 'Chovy Fan', gamertag: 'ChurchOfChovy', team: 'GenG eSports', stat: '10.2 CS/min (MID)', rating: '9.8' },
      ],
    },
    MID: {
      summaryTitle: 'Infografía de Rendimiento: Mid Lane (Carril Central)',
      cards: [
        { title: 'DPM (Daño por Minuto)', value: '785', detail: 'Daño mágico y físico a campeones', color: '#F59E0B' },
        { title: 'Solo Kills en Fase de Líneas', value: '18', detail: 'Asesinatos 1v1 sin ayuda', color: '#10B981' },
        { title: 'Diferencia Oro @15m', value: '+540', detail: 'Ventaja económica sobre rival', color: '#00F0FF' },
        { title: 'Roams Exitosos a Bot', value: '6.2', detail: 'Emboscadas efectivas por juego', color: '#C084FC' },
      ],
      bars: [
        { name: 'Impacto en Teamfights (Zonificación)', percentage: 94, color: '#F59E0B' },
        { name: 'Skillshot Accuracy (Habilidades)', percentage: 88, color: '#00F0FF' },
        { name: 'Control de Oleadas de Súbditos', percentage: 91, color: '#10B981' },
      ],
      topAthletes: [
        { rank: 1, name: 'Faker Clone', gamertag: 'HideOnBush', team: 'T1 Academy', stat: '18 Solo Kills (MID)', rating: '9.9' },
      ],
    },
  },
  csgo: {
    TODOS: {
      summaryTitle: 'Resumen Global Táctico 5v5 (Counter-Strike 2)',
      cards: [
        { title: 'Rating 2.0 Promedio', value: '1.24', detail: 'HLTV Performance Index', color: '#F59E0B' },
        { title: 'Headshot % (HS)', value: '64.8%', detail: 'Porcentaje de disparos a cabeza', color: '#10B981' },
        { title: 'Clutches Ganados 1vX', value: '28', detail: 'Rondas ganadas en desventaja', color: '#00F0FF' },
        { title: 'Rondas Tácticas Ganadas', value: '82%', detail: 'Conversión de rondas de compra', color: '#C084FC' },
      ],
      bars: [
        { name: 'AWPer Impact & Entry Snipes', percentage: 94, color: '#F59E0B' },
        { name: 'Entry Fragger HS Rate', percentage: 89, color: '#10B981' },
        { name: 'IGL Utility & Defuse Efficiency', percentage: 86, color: '#00F0FF' },
      ],
      topAthletes: [
        { rank: 1, name: 'Lucas Benítez', gamertag: 'Vhaex_CS', team: 'Highfield XX', stat: '1.45 Rating (AWPer)', rating: '9.6' },
        { rank: 2, name: 'Francisco Morales', gamertag: 'Pancho_T10', team: 'Sangre Nueva FC', stat: '1.32 Rating (Entry)', rating: '9.5' },
      ],
    },
    AWPer: {
      summaryTitle: 'Infografía de Rendimiento: AWPer (Francotirador)',
      cards: [
        { title: 'Snipe Kill Ratio %', value: '78.5%', detail: 'Kills con AWP en rondas armadas', color: '#F59E0B' },
        { title: 'Opening Kills (First Kills)', value: '4.6', detail: 'Bajas iniciales por mapa', color: '#10B981' },
        { title: 'Impact Rating HLTV', value: '1.42', detail: 'Puntuación de impacto en rondas', color: '#00F0FF' },
        { title: 'Clutches 1v2 Ganados', value: '9', detail: 'Desafíos cerrados en solitario', color: '#C084FC' },
      ],
      bars: [
        { name: 'Flick Shot Accuracy', percentage: 96, color: '#F59E0B' },
        { name: 'Hold Angle Reaction Time (ms)', percentage: 92, color: '#10B981' },
        { name: 'Retake Wallbang Kills', percentage: 82, color: '#00F0FF' },
      ],
      topAthletes: [
        { rank: 1, name: 'Lucas Benítez', gamertag: 'Vhaex_CS', team: 'Highfield XX', stat: '1.45 Rating (AWPer)', rating: '9.6' },
      ],
    },
  },
  valorant: {
    TODOS: {
      summaryTitle: 'Resumen Global de Agentes 5v5 (Valorant)',
      cards: [
        { title: 'Combat Score (ACS)', value: '254', detail: 'Puntuación media de combate', color: '#00F0FF' },
        { title: 'Headshot % (HS)', value: '32.4%', detail: 'Disparos a cabeza con Vandal/Phantom', color: '#10B981' },
        { title: 'First Kills por Mapa', value: '4.8', detail: 'Primeras bajas de la ronda', color: '#F59E0B' },
        { title: 'Rondas Defensivas %', value: '79%', detail: 'Éxito en detención de Spike', color: '#C084FC' },
      ],
      bars: [
        { name: 'Duelista Entry & ACS Impact', percentage: 95, color: '#00F0FF' },
        { name: 'Iniciador Flash & Intel Assists', percentage: 90, color: '#10B981' },
        { name: 'Controlador Smoke Timing', percentage: 87, color: '#C084FC' },
      ],
      topAthletes: [
        { rank: 1, name: 'Valentin Rossi', gamertag: 'ViperX', team: 'Sangre Nueva FC', stat: '284 ACS (Duelista)', rating: '9.7' },
      ],
    },
  },
  rocketleague: {
    TODOS: {
      summaryTitle: 'Resumen Global de Arena 3v3 (Rocket League)',
      cards: [
        { title: 'Goles por Partido', value: '2.4', detail: 'Anotaciones promedio en arena', color: '#00F0FF' },
        { title: 'Atajadas Salvadoras', value: '4.8', detail: 'Paradas en línea de meta', color: '#10B981' },
        { title: 'Asistencias Aéreas', value: '3.2', detail: 'Passes aéreos a gol', color: '#F59E0B' },
        { title: 'Demos / Impactos', value: '8', detail: 'Demoliciones tácticas', color: '#C084FC' },
      ],
      bars: [
        { name: 'Aerial Goal Accuracy', percentage: 91, color: '#00F0FF' },
        { name: 'Boost Management & Rotation', percentage: 88, color: '#10B981' },
        { name: 'Epic Saves Ratio', percentage: 85, color: '#F59E0B' },
      ],
      topAthletes: [
        { rank: 1, name: 'Rocket King', gamertag: 'BoostGod', team: 'Highfield RL', stat: '3.1 Goles/Match', rating: '9.6' },
      ],
    },
  },
};

export function EsportsAnalyticsView({ game }: EsportsAnalyticsViewProps) {
  const gameSlug = game.slug || 'eafc26';

  // Load game specific selector options
  const selectorOptions = GAME_SELECTOR_OPTIONS[gameSlug] || GAME_SELECTOR_OPTIONS['eafc26'];
  const [selectedRole, setSelectedRole] = useState<string>(selectorOptions[0]?.id || 'TODAS');

  // Load role tailored dataset or fallback to 'TODAS' / 'TODOS'
  const gameDataset = ROLE_ANALYTICS_DATA[gameSlug] || ROLE_ANALYTICS_DATA['eafc26'];
  const currentAnalytics = gameDataset[selectedRole] || gameDataset['TODAS'] || gameDataset['TODOS'] || Object.values(gameDataset)[0];

  return (
    <div className="w-full space-y-6 animate-in fade-in pb-12">
      
      {/* 1. Header Hero Banner */}
      <PageHeader
        badgeText={`INFOGRAFÍA OFICIAL ${game.name}`}
        badgeIcon={<Flame className="w-3.5 h-3.5" style={{ color: 'var(--game-brand)', fill: 'var(--game-brand)' }} />}
        title="Métricas & Análisis Gráfico"
        highlightTitle="por Posición"
        description={`Selecciona una posición o rol táctico a continuación para filtrar e inspeccionar las métricas gráficas independientes de ${game.name}.`}
        brandColor="var(--game-brand)"
      />

      {/* 2. GAME-SPECIFIC POSITION / ROLE SELECTOR BAR */}
      <div className="p-3 rounded-2xl glass-panel border border-[var(--border-card)] space-y-3 shadow-xl">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-cyan-400" />
            FILTRAR INFOGRAFÍA POR POSICIÓN / ROL ({game.name}):
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
            Seleccionado: <strong className="text-white">{selectedRole}</strong>
          </span>
        </div>

        {/* Dynamic Selector Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {selectorOptions.map((opt) => {
            const isSelected = selectedRole === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedRole(opt.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 shadow-md border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 border-cyan-300 shadow-xl scale-[1.02]'
                    : 'bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: game.brandColor,
                        borderColor: game.brandColor,
                        color: '#020617',
                      }
                    : {}
                }
              >
                <span>{opt.iconLabel}</span>
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-slate-950 fill-slate-950" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DYNAMIC INFOGRAPHIC METRICS HUD CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            {currentAnalytics.summaryTitle}
          </h3>
          <Badge variant="emerald" className="text-[10px] font-mono font-bold">POSICIÓN: {selectedRole}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentAnalytics.cards.map((c, idx) => (
            <Card key={idx} className="p-5 space-y-2 glass-panel-hover border-[var(--border-card)] bg-[var(--bg-card)]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{c.title}</span>
              <span className="text-2xl sm:text-3xl font-black font-mono block" style={{ color: c.color }}>
                {c.value}
              </span>
              <span className="text-[11px] text-slate-300 font-semibold block">{c.detail}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. GRAPHICAL BARS & TOP ATHLETES IN ROLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual Attributes Chart Bars */}
        <Card className="p-6 space-y-5 border-cyan-500/30 bg-[var(--bg-card)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Métricas Clave del Rol ({selectedRole})
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">Atributos eSports</span>
          </div>

          <div className="space-y-4">
            {currentAnalytics.bars.map((bar, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>{bar.name}</span>
                  <span className="font-mono text-cyan-300">{bar.percentage}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700 shadow-lg"
                    style={{
                      width: `${bar.percentage}%`,
                      backgroundColor: bar.color || game.brandColor,
                      boxShadow: `0 0 10px ${bar.color || game.brandColor}66`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Leaderboard Top Athletes in Selected Position/Role */}
        <Card className="p-6 space-y-5 border-purple-500/30 bg-[var(--bg-card)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Top Atletas Destacados en {selectedRole}
            </h3>
            <Badge variant="gold">RANKING ROL</Badge>
          </div>

          <div className="space-y-3">
            {currentAnalytics.topAthletes.map((ath) => (
              <div key={ath.gamertag} className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-amber-400 text-sm">#{ath.rank}</span>
                  <Avatar fallback={ath.name} size="sm" status="online" />
                  <div>
                    <span className="font-extrabold text-sm text-white block">{ath.name}</span>
                    <span className="text-[10px] text-cyan-300 font-mono font-bold">@{ath.gamertag} • {ath.team}</span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="font-mono font-bold text-amber-400 block text-xs">★ {ath.rating}</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block">{ath.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
