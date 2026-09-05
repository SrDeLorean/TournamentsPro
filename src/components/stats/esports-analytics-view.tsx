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
        { title: 'Efectividad General Victoria', value: '78.4%', detail: 'Promedio de victorias equipo local', color: 'var(--app-accent)' },
        { title: 'Goles por Partido', value: '3.2', detail: 'Promedio anotaciones por encuentro', color: 'var(--app-positive)' },
        { title: 'Atletas Inscriptos', value: '248', detail: 'Jugadores eSports verificados', color: 'var(--app-accent-2)' },
        { title: 'Rating Máximo MVP', value: '9.8 ★', detail: 'SrDeLorean (SAN LORENZO ESP)', color: 'var(--app-warning)' },
      ],
      bars: [
        { name: 'Efectividad de Pases en Medio', percentage: 92, color: 'var(--app-accent)' },
        { name: 'Conversión de Tiros a Gol (Delanteros)', percentage: 76, color: 'var(--app-positive)' },
        { name: 'Éxito en Entradas de Defensas', percentage: 84, color: 'var(--app-accent-2)' },
        { name: 'Porcentaje Atajadas de Porteros', percentage: 81, color: 'var(--app-warning)' },
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
        { title: 'Goles por Partido (DC)', value: '2.85', detail: 'Promedio de anotación de atacantes', color: 'var(--app-positive)' },
        { title: 'Conversión de Tiros %', value: '68%', detail: 'Tiros a puerta convertidos en gol', color: 'var(--app-accent)' },
        { title: 'xG (Goles Esperados)', value: '3.12', detail: 'Métrica de peligro en área rival', color: 'var(--app-warning)' },
        { title: 'Hat-Tricks de la Liga', value: '14', detail: 'Tripletas anotadas en la temporada', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'Efectividad de Remates al Primer Toque', percentage: 88, color: 'var(--app-positive)' },
        { name: 'Desmarques Exitosos a la Espalda', percentage: 82, color: 'var(--app-accent)' },
        { name: 'Goles de Cabeza / Juego Aéreo', percentage: 65, color: 'var(--app-warning)' },
      ],
      topAthletes: [
        { rank: 1, name: 'Sebastián Rodríguez', gamertag: 'SrDeLorean', team: 'LeguaYork eSp', stat: '18 Goles (DC)', rating: '9.8' },
        { rank: 2, name: 'Francisco Morales', gamertag: 'Pancho_T10', team: 'Sangre Nueva FC', stat: '14 Goles (EI)', rating: '9.5' },
      ],
    },
    MCO: {
      summaryTitle: 'Infografía de Rendimiento: Mediocampistas (MCO, MC, MCD)',
      cards: [
        { title: 'Pases Clave por Partido', value: '8.4', detail: 'Pases filtrados de gol', color: 'var(--app-accent)' },
        { title: 'Efectividad de Pase %', value: '91.2%', detail: 'Precisión en distribución', color: 'var(--app-positive)' },
        { title: 'Recuperaciones en Medio', value: '6.8', detail: 'Balones robados en zona media', color: 'var(--app-accent-2)' },
        { title: 'Asistencias Directas', value: '1.85', detail: 'Pases de gol por partido', color: 'var(--app-warning)' },
      ],
      bars: [
        { name: 'Pases Filtrados al Hueco', percentage: 94, color: 'var(--app-accent)' },
        { name: 'Retención de Balón bajo Presión', percentage: 89, color: 'var(--app-positive)' },
        { name: 'Distribución de Banda a Banda', percentage: 86, color: 'var(--app-accent-2)' },
      ],
      topAthletes: [
        { rank: 1, name: 'AcZinoMeme', gamertag: 'AcZinoMeme', team: 'Highfield XX', stat: '12 Asist (MCO)', rating: '9.4' },
        { rank: 2, name: 'Valentin Rossi', gamertag: 'ViperX', team: 'Sangre Nueva FC', stat: '9 Asist (MC)', rating: '9.3' },
      ],
    },
    DFC: {
      summaryTitle: 'Infografía de Rendimiento: Defensas (DFC, LI, LD)',
      cards: [
        { title: 'Entradas Limpias %', value: '88.5%', detail: 'Duelos defensivos ganados', color: 'var(--app-accent-2)' },
        { title: 'Duelos Aéreos Ganados', value: '76.4%', detail: 'Cabezazos ganados en área', color: 'var(--app-accent)' },
        { title: 'Despejes Efectivos', value: '9.2', detail: 'Balones despejados por juego', color: 'var(--app-positive)' },
        { title: 'Vallas Invictas Totales', value: '12', detail: 'Partidos sin recibir gol', color: 'var(--app-warning)' },
      ],
      bars: [
        { name: 'Robos de Balón sin Falta', percentage: 91, color: 'var(--app-accent-2)' },
        { name: 'Cobertura de Centro de Área', percentage: 85, color: 'var(--app-accent)' },
        { name: 'Salida de Balón Jugado', percentage: 78, color: 'var(--app-positive)' },
      ],
      topAthletes: [
        { rank: 1, name: 'Joaquín Silva', gamertag: 'SG Jotta', team: 'San Lorenzo eSp', stat: '42 Robos (DFC)', rating: '9.6' },
        { rank: 2, name: 'Rodrigo Sir', gamertag: 'SirRodrick_FC', team: 'LeguaYork eSp', stat: '38 Robos (DFC)', rating: '9.4' },
      ],
    },
    POR: {
      summaryTitle: 'Infografía de Rendimiento: Porteros (POR)',
      cards: [
        { title: 'Atajadas por Partido', value: '5.6', detail: 'Paradas salvadoras por juego', color: 'var(--app-warning)' },
        { title: 'Paradas Área Chica %', value: '84.2%', detail: 'Efectividad en tiros a bocajarro', color: 'var(--app-positive)' },
        { title: 'Despejes con Puños', value: '3.1', detail: 'Centros neutralizados en aire', color: 'var(--app-accent)' },
        { title: 'Penalties Detenidos', value: '4', detail: 'Penales parados en la liga', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'Paradas en Mano a Mano 1v1', percentage: 86, color: 'var(--app-warning)' },
        { name: 'Desvío de Balones a Córner', percentage: 92, color: 'var(--app-positive)' },
        { name: 'Saques Largos de Precisión', percentage: 80, color: 'var(--app-accent)' },
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
        { title: 'KDA Promedio de Liga', value: '4.2', detail: 'Kill / Death / Assist Ratio', color: 'var(--app-accent-2)' },
        { title: 'DPM (Daño por Minuto)', value: '745', detail: 'Impacto de daño en peleas', color: 'var(--app-warning)' },
        { title: 'Control de Dragones %', value: '78.2%', detail: 'Objetivos neutrales asegurados', color: 'var(--app-accent)' },
        { title: 'Pentakills la Temporada', value: '3', detail: 'Asesinatos quíntuples', color: 'var(--app-positive)' },
      ],
      bars: [
        { name: 'Mid Lane DPM Impact', percentage: 92, color: 'var(--app-warning)' },
        { name: 'ADC CS por Minuto (Farm)', percentage: 96, color: 'var(--app-accent)' },
        { name: 'Jungle Objective Control', percentage: 84, color: 'var(--app-positive)' },
        { name: 'Support Vision Score', percentage: 88, color: 'var(--app-accent-2)' },
      ],
      topAthletes: [
        { rank: 1, name: 'Faker Clone', gamertag: 'HideOnBush', team: 'T1 Academy', stat: '780 DPM (MID)', rating: '9.9' },
        { rank: 2, name: 'Chovy Fan', gamertag: 'ChurchOfChovy', team: 'GenG eSports', stat: '10.2 CS/min (MID)', rating: '9.8' },
      ],
    },
    MID: {
      summaryTitle: 'Infografía de Rendimiento: Mid Lane (Carril Central)',
      cards: [
        { title: 'DPM (Daño por Minuto)', value: '785', detail: 'Daño mágico y físico a campeones', color: 'var(--app-warning)' },
        { title: 'Solo Kills en Fase de Líneas', value: '18', detail: 'Asesinatos 1v1 sin ayuda', color: 'var(--app-positive)' },
        { title: 'Diferencia Oro @15m', value: '+540', detail: 'Ventaja económica sobre rival', color: 'var(--app-accent)' },
        { title: 'Roams Exitosos a Bot', value: '6.2', detail: 'Emboscadas efectivas por juego', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'Impacto en Teamfights (Zonificación)', percentage: 94, color: 'var(--app-warning)' },
        { name: 'Skillshot Accuracy (Habilidades)', percentage: 88, color: 'var(--app-accent)' },
        { name: 'Control de Oleadas de Súbditos', percentage: 91, color: 'var(--app-positive)' },
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
        { title: 'Rating 2.0 Promedio', value: '1.24', detail: 'HLTV Performance Index', color: 'var(--app-warning)' },
        { title: 'Headshot % (HS)', value: '64.8%', detail: 'Porcentaje de disparos a cabeza', color: 'var(--app-positive)' },
        { title: 'Clutches Ganados 1vX', value: '28', detail: 'Rondas ganadas en desventaja', color: 'var(--app-accent)' },
        { title: 'Rondas Tácticas Ganadas', value: '82%', detail: 'Conversión de rondas de compra', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'AWPer Impact & Entry Snipes', percentage: 94, color: 'var(--app-warning)' },
        { name: 'Entry Fragger HS Rate', percentage: 89, color: 'var(--app-positive)' },
        { name: 'IGL Utility & Defuse Efficiency', percentage: 86, color: 'var(--app-accent)' },
      ],
      topAthletes: [
        { rank: 1, name: 'Lucas Benítez', gamertag: 'Vhaex_CS', team: 'Highfield XX', stat: '1.45 Rating (AWPer)', rating: '9.6' },
        { rank: 2, name: 'Francisco Morales', gamertag: 'Pancho_T10', team: 'Sangre Nueva FC', stat: '1.32 Rating (Entry)', rating: '9.5' },
      ],
    },
    AWPer: {
      summaryTitle: 'Infografía de Rendimiento: AWPer (Francotirador)',
      cards: [
        { title: 'Snipe Kill Ratio %', value: '78.5%', detail: 'Kills con AWP en rondas armadas', color: 'var(--app-warning)' },
        { title: 'Opening Kills (First Kills)', value: '4.6', detail: 'Bajas iniciales por mapa', color: 'var(--app-positive)' },
        { title: 'Impact Rating HLTV', value: '1.42', detail: 'Puntuación de impacto en rondas', color: 'var(--app-accent)' },
        { title: 'Clutches 1v2 Ganados', value: '9', detail: 'Desafíos cerrados en solitario', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'Flick Shot Accuracy', percentage: 96, color: 'var(--app-warning)' },
        { name: 'Hold Angle Reaction Time (ms)', percentage: 92, color: 'var(--app-positive)' },
        { name: 'Retake Wallbang Kills', percentage: 82, color: 'var(--app-accent)' },
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
        { title: 'Combat Score (ACS)', value: '254', detail: 'Puntuación media de combate', color: 'var(--app-accent)' },
        { title: 'Headshot % (HS)', value: '32.4%', detail: 'Disparos a cabeza con Vandal/Phantom', color: 'var(--app-positive)' },
        { title: 'First Kills por Mapa', value: '4.8', detail: 'Primeras bajas de la ronda', color: 'var(--app-warning)' },
        { title: 'Rondas Defensivas %', value: '79%', detail: 'Éxito en detención de Spike', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'Duelista Entry & ACS Impact', percentage: 95, color: 'var(--app-accent)' },
        { name: 'Iniciador Flash & Intel Assists', percentage: 90, color: 'var(--app-positive)' },
        { name: 'Controlador Smoke Timing', percentage: 87, color: 'var(--app-accent-2)' },
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
        { title: 'Goles por Partido', value: '2.4', detail: 'Anotaciones promedio en arena', color: 'var(--app-accent)' },
        { title: 'Atajadas Salvadoras', value: '4.8', detail: 'Paradas en línea de meta', color: 'var(--app-positive)' },
        { title: 'Asistencias Aéreas', value: '3.2', detail: 'Passes aéreos a gol', color: 'var(--app-warning)' },
        { title: 'Demos / Impactos', value: '8', detail: 'Demoliciones tácticas', color: 'var(--app-accent-2)' },
      ],
      bars: [
        { name: 'Aerial Goal Accuracy', percentage: 91, color: 'var(--app-accent)' },
        { name: 'Boost Management & Rotation', percentage: 88, color: 'var(--app-positive)' },
        { name: 'Epic Saves Ratio', percentage: 85, color: 'var(--app-warning)' },
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
    <div
      className="w-full space-y-6 animate-in fade-in pb-12"
      style={{ '--ui-dynamic-brand': game.brandColor } as React.CSSProperties}
    >
      
      {/* 1. Header Hero Banner */}
      <PageHeader
        badgeText={`INFOGRAFÍA OFICIAL ${game.name}`}
        badgeIcon={<Flame className="ui-dynamic-brand-icon w-3.5 h-3.5" />}
        title="Métricas & Análisis Gráfico"
        highlightTitle="por Posición"
        description={`Selecciona una posición o rol táctico a continuación para filtrar e inspeccionar las métricas gráficas independientes de ${game.name}.`}
        brandColor="var(--game-brand)"
      />

      {/* 2. GAME-SPECIFIC POSITION / ROLE SELECTOR BAR */}
      <div className="p-3 rounded-2xl glass-panel border border-[var(--border-card)] space-y-3 shadow-xl">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-[var(--app-accent)] tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[var(--app-accent)]" />
            FILTRAR INFOGRAFÍA POR POSICIÓN / ROL ({game.name}):
          </span>
          <span className="text-[10px]  text-[var(--text-muted)] uppercase font-bold">
            Seleccionado: <strong className="text-[var(--text-heading)]">{selectedRole}</strong>
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
                    ? 'ui-dynamic-brand-button shadow-xl scale-[1.02]'
                    : 'bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{opt.iconLabel}</span>
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-[var(--accent-contrast)] fill-[var(--accent-contrast)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DYNAMIC INFOGRAPHIC METRICS HUD CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2">
          <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--app-positive)]" />
            {currentAnalytics.summaryTitle}
          </h3>
          <Badge variant="emerald" className="text-[10px]  font-bold">POSICIÓN: {selectedRole}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentAnalytics.cards.map((c, idx) => (
            <Card
              key={idx}
              className="p-5 space-y-2 glass-panel-hover border-[var(--border-card)] bg-[var(--bg-card)]"
              style={{ '--ui-dynamic-brand': c.color } as React.CSSProperties}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block">{c.title}</span>
              <span className="ui-dynamic-brand-ink text-2xl sm:text-3xl font-black block">
                {c.value}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] font-semibold block">{c.detail}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. GRAPHICAL BARS & TOP ATHLETES IN ROLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual Attributes Chart Bars */}
        <Card className="p-6 space-y-5 border-[var(--app-accent)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--app-accent)]" />
              Métricas Clave del Rol ({selectedRole})
            </h3>
            <span className="text-[10px]  text-[var(--app-accent)] font-bold">Atributos eSports</span>
          </div>

          <div className="space-y-4">
            {currentAnalytics.bars.map((bar, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>{bar.name}</span>
                  <span className=" text-[var(--app-accent)]">{bar.percentage}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden p-0.5 border border-[var(--border-card)]">
                  <div
                    className="analytics-progress-fill h-full rounded-full transition-all duration-700"
                    style={{
                      '--analytics-progress': `${bar.percentage}%`,
                      '--ui-dynamic-brand': bar.color || game.brandColor,
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Leaderboard Top Athletes in Selected Position/Role */}
        <Card className="p-6 space-y-5 border-[var(--app-accent-2)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--app-warning)]" />
              Top Atletas Destacados en {selectedRole}
            </h3>
            <Badge variant="gold">RANKING ROL</Badge>
          </div>

          <div className="space-y-3">
            {currentAnalytics.topAthletes.map((ath) => (
              <div key={ath.gamertag} className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className=" font-black text-[var(--app-warning)] text-sm">#{ath.rank}</span>
                  <Avatar fallback={ath.name} size="sm" status="online" />
                  <div>
                    <span className="font-extrabold text-sm text-[var(--text-heading)] block">{ath.name}</span>
                    <span className="text-[10px] text-[var(--app-accent)]  font-bold">@{ath.gamertag} • {ath.team}</span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className=" font-bold text-[var(--app-warning)] block text-xs">★ {ath.rating}</span>
                  <span className="text-[10px] text-[var(--app-positive)]  font-bold block">{ath.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
