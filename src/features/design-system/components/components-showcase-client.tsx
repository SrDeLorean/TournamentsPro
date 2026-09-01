'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';
import { HologramStage3D } from '@/components/3d/hologram-stage-3d';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  Trophy,
  Shield,
  Search,
  Sparkles,
  Send,
  Mail,
  User,
  Bell,
  Palette,
  Box,
  Layers,
  Flame,
  Zap,
  Swords,
  Crown,
  Activity,
  CheckCircle2,
  Gamepad2,
  Calendar,
  Clock,
  TrendingUp,
  Eye,
  Sliders,
} from 'lucide-react';

export default function ComponentsShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedThemePreview, setSelectedThemePreview] = useState<'cyan-void' | 'gold-apex' | 'mint-cyber' | 'crimson-val'>('cyan-void');

  // Themes palette definitions for live testing
  const themePresets = [
    {
      id: 'cyan-void',
      name: 'Cyber Void (Recomendada)',
      description: 'Cian Neón Eléctrico (#00f0ff) + Púrpura Profundo (#c084fc) sobre Fondo Void (#05070d)',
      cyan: '#00f0ff',
      violet: '#c084fc',
      gold: '#fbbf24',
      bg: '#05070d',
      tag: 'Principal Recomendada',
    },
    {
      id: 'gold-apex',
      name: 'Apex Gold & Titanium',
      description: 'Oro Radiante Champions (#fbbf24) + Cian Glacial (#38bdf8) sobre Gris Titanio (#0b0f19)',
      cyan: '#fbbf24',
      violet: '#38bdf8',
      gold: '#f59e0b',
      bg: '#0b0f19',
      tag: 'Prestigio / Champions',
    },
    {
      id: 'mint-cyber',
      name: 'Cyber Mint & Emerald',
      description: 'Menta Neón eSports (#34d399) + Púrpura Cyber (#a855f7) sobre Fondo Pitch (#030712)',
      cyan: '#34d399',
      violet: '#a855f7',
      gold: '#fde047',
      bg: '#030712',
      tag: 'Moderna / VCT Style',
    },
    {
      id: 'crimson-val',
      name: 'Crimson Pulse',
      description: 'Rojo Carmesí (#ff4655) + Oro Eléctrico (#f8ae3c) sobre Obsidiana (#060810)',
      cyan: '#ff4655',
      violet: '#f8ae3c',
      gold: '#fbbf24',
      bg: '#060810',
      tag: 'Alta Competencia / FPS',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      
      {/* Page Header */}
      <div className="border-b border-[var(--border-card)] pb-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-mono font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>eSports Design System & 3D Cards Engine v3.0</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-heading)] uppercase font-display">
          Catálogo UI Kit con Tarjetas 3D eSports
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 max-w-3xl">
          Colección de componentes visuales impulsados por variables CSS (`var(--accent-cyan)`, `var(--bg-card)`), con tarjetas en perspectiva 3D giroscópica, reflejo holográfico y física de resorte.
        </p>
      </div>

      {/* 🎨 SECCIÓN 1: RECOMENDADOR & SIMULADOR DE PALETAS DE COLOR */}
      <section className="space-y-6 p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ PALETAS RECOMENDADAS PARA LA PÁGINA PRINCIPAL ]
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
              Estilos de Color Globales
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Las páginas de disciplinas (`/[gameSlug]`) ya usan su color específico. Para la portada global y el portal principal, elige o prueba una de estas combinaciones:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-xs font-mono font-bold text-[var(--text-muted)]">Live Preview</span>
          </div>
        </div>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {themePresets.map((preset) => {
            const isSelected = selectedThemePreview === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedThemePreview(preset.id as any)}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'bg-slate-900 border-[var(--accent-cyan)] shadow-[0_0_25px_rgba(0,240,255,0.25)] scale-[1.02]'
                    : 'bg-slate-950/60 border-[var(--border-card)] hover:border-[var(--border-card-hover)] hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {preset.tag}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white uppercase pt-1">{preset.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{preset.description}</p>
                </div>

                {/* Color Swatch Bars */}
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: preset.cyan }} />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: preset.violet }} />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: preset.gold }} />
                  <div className="h-6 flex-1 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: preset.bg }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🌟 SECCIÓN 2: SUITE DE TARJETAS 3D eSPORTS (3D CARDS SHOWCASE) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Suite de Tarjetas 3D eSports (Giroscópicas & Reflejo)</h2>
          </div>
          <Badge variant="cyan" is3D>Perspectiva 3D Activa</Badge>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Mueve el cursor sobre las tarjetas para experimentar la inclinación giroscópica tridimensional, la profundidad de capas Z y el destello especular holográfico:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* TARJETA 3D #1: MATCHDAY & PARTIDO EN VIVO */}
          <Card3D maxTilt={12} variant="cyan" className="h-full">
            <div className="p-6 space-y-5 h-full flex flex-col justify-between">
              
              {/* Header con Z-Depth */}
              <Card3DItem depth={35} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan" is3D>EA FC 26 • Matchday #14</Badge>
                  <span className="text-[10px] font-mono text-[var(--accent-cyan)] font-extrabold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    EN VIVO
                  </span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight font-display">
                  Gran Final Copa de Campeones
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Transmisión oficial del circuito sudamericano 11v11.
                </p>
              </Card3DItem>

              {/* Scoreboard con Z-Depth */}
              <Card3DItem depth={25}>
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-black text-xs text-cyan-300">
                      SL
                    </div>
                    <span className="font-bold text-xs text-white">San Lorenzo</span>
                  </div>

                  <div className="text-center px-2">
                    <span className="text-base font-black text-cyan-400">3 - 1</span>
                    <span className="text-[9px] text-slate-400 block font-bold">MIN 78'</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">LeguaYork</span>
                    <div className="size-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center font-black text-xs text-purple-300">
                      LY
                    </div>
                  </div>
                </div>
              </Card3DItem>

              {/* Action Button con Z-Depth */}
              <Card3DItem depth={35} className="pt-2">
                <Button variant="primary" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-1.5" />
                  Ver Transmisión en Vivo
                </Button>
              </Card3DItem>
            </div>
          </Card3D>

          {/* TARJETA 3D #2: FICHA DE ATLETA PRO & VALOR DE MERCADO */}
          <Card3D maxTilt={12} variant="gold" className="h-full">
            <div className="p-6 space-y-5 h-full flex flex-col justify-between">
              
              <Card3DItem depth={35} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="gold" is3D>Mercado de Pases</Badge>
                  <span className="text-[10px] font-mono text-amber-400 font-extrabold">AGENCIA LIBRE</span>
                </div>
                
                <div className="flex items-center gap-3 pt-1">
                  <Avatar size="lg" fallback="SD" status="online" className="border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      SrDeLorean <span className="text-amber-400 font-mono">#10</span>
                    </h3>
                    <span className="text-xs text-slate-300 font-semibold block">Mediapunta Táctico • 11v11</span>
                  </div>
                </div>
              </Card3DItem>

              {/* Stats Matrix con Z-Depth */}
              <Card3DItem depth={20}>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10">
                    <span className="text-slate-400 block font-bold">GOLES</span>
                    <span className="text-emerald-400 font-black text-xs">28</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10">
                    <span className="text-slate-400 block font-bold">ASIST.</span>
                    <span className="text-cyan-400 font-black text-xs">19</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10">
                    <span className="text-slate-400 block font-bold">RATING</span>
                    <span className="text-amber-400 font-black text-xs">9.4</span>
                  </div>
                </div>
              </Card3DItem>

              <Card3DItem depth={35} className="pt-2">
                <Button variant="secondary" size="sm" className="w-full">
                  <Send className="w-4 h-4 mr-1.5" />
                  Enviar Oferta de Contrato
                </Button>
              </Card3DItem>
            </div>
          </Card3D>

          {/* TARJETA 3D #3: COPA & PRIZE POOL */}
          <Card3D maxTilt={12} variant="violet" className="h-full">
            <div className="p-6 space-y-5 h-full flex flex-col justify-between">
              
              <Card3DItem depth={35} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="violet" is3D>Major Season 2026</Badge>
                  <span className="text-[10px] font-mono text-purple-300 font-extrabold">32 EQUIPOS</span>
                </div>

                <h3 className="text-lg font-black text-white uppercase tracking-tight font-display">
                  Copa Libertadores eSports
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Torneo eliminatorio con fase de grupos y brackets Upper/Lower.
                </p>
              </Card3DItem>

              {/* Prize Pool Spotlight con Z-Depth */}
              <Card3DItem depth={25}>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/80 to-slate-900/90 border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Bolsa de Premios</span>
                      <span className="text-sm font-black text-white font-mono">$10,000 USD</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    FASE FINAL
                  </span>
                </div>
              </Card3DItem>

              <Card3DItem depth={35} className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Trophy className="w-4 h-4 mr-1.5 text-purple-400" />
                  Explorar Cuadro de Brackets
                </Button>
              </Card3DItem>
            </div>
          </Card3D>
        </div>
      </section>

      {/* SECCIÓN 3: PALETAS DE COLORES OFICIALES POR JUEGO */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Paletas de Colores por Disciplina (`/[gameSlug]`)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(GAMES_CATALOG).map((game) => (
            <Card3D
              key={game.id}
              maxTilt={8}
              accentColor={game.brandColor}
              className="h-full"
            >
              <div className="p-5 space-y-4 h-full flex flex-col justify-between">
                <Card3DItem depth={20} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{game.icon}</span>
                      <div>
                        <h3 className="font-extrabold text-base text-white">{game.name}</h3>
                        <span className="text-[10px] text-slate-400 block font-mono">{game.category}</span>
                      </div>
                    </div>
                    <Badge
                      is3D
                      style={{
                        backgroundColor: `${game.brandColor}25`,
                        color: game.brandColor,
                        borderColor: `${game.brandColor}50`,
                      }}
                    >
                      Oficial
                    </Badge>
                  </div>

                  {/* Swatches */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      Muestras de Color Oficiales
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm" style={{ backgroundColor: game.brandColor }}>
                        {game.brandColor}
                      </div>
                      <div className="flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm" style={{ backgroundColor: game.accentColor }}>
                        {game.accentColor}
                      </div>
                      <div className="flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm border border-slate-700" style={{ backgroundColor: game.secondaryAccent }}>
                        {game.secondaryAccent}
                      </div>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={25} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full font-bold"
                    style={{
                      backgroundColor: game.brandColor,
                      color: '#FFFFFF',
                    }}
                  >
                    Inscribir Equipo en {game.name}
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* SECCIÓN 4: CONTROLES & FORMULARIOS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Mail className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Controles de Formulario & Inputs</h2>
        </div>

        <div className="p-6 rounded-2xl glass-panel grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Gamertag Oficial"
            placeholder="ej. SrDeLorean"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Ingresa tu ID oficial dentro del juego"
            icon={<User className="w-4 h-4 text-[var(--text-muted)]" />}
          />

          <Input
            label="Búsqueda de Torneos"
            placeholder="Buscar ligas, copas o clubes..."
            icon={<Search className="w-4 h-4 text-[var(--text-muted)]" />}
          />

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="usuario@ejemplo.com"
            error="El formato del correo electrónico no es válido"
            icon={<Mail className="w-4 h-4 text-[var(--text-muted)]" />}
          />

          <Textarea
            label="Observaciones del Partido / Acta"
            placeholder="Detalla incidentes, MVP o acuerdos entre capitanes..."
          />
        </div>
      </section>

      {/* SECCIÓN 5: BOTONES & VARIANTES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Botones & Acciones (Buttons)</h2>
        </div>

        <div className="p-6 rounded-2xl glass-panel space-y-6">
          <div>
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Variantes Estilizadas</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Cyan</Button>
              <Button variant="secondary">Secondary Violet</Button>
              <Button variant="outline">Outline Glass</Button>
              <Button variant="danger">Danger Crimson</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Tamaños</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md)</Button>
              <Button size="lg">Large (lg)</Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: TABLA DE POSICIONES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Tablas de Posiciones eSports</h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Pos</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">PG</TableHead>
              <TableHead className="text-center">PE</TableHead>
              <TableHead className="text-center">PP</TableHead>
              <TableHead className="text-center">GF</TableHead>
              <TableHead className="text-center">GC</TableHead>
              <TableHead className="text-center">DIF</TableHead>
              <TableHead className="text-center">PTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-[var(--accent-cyan-bg)]">
              <TableCell className="text-center font-bold text-[var(--accent-cyan)]">1</TableCell>
              <TableCell className="font-bold flex items-center gap-2 text-[var(--text-heading)]">
                <div className="w-6 h-6 rounded bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 flex items-center justify-center text-xs font-black text-[var(--accent-cyan)]">LY</div>
                LeguaYork eSp
              </TableCell>
              <TableCell className="text-center font-mono">10</TableCell>
              <TableCell className="text-center font-mono">8</TableCell>
              <TableCell className="text-center font-mono">1</TableCell>
              <TableCell className="text-center font-mono">1</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-emerald)] font-bold">24</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-crimson)] font-bold">8</TableCell>
              <TableCell className="text-center font-mono font-semibold">+16</TableCell>
              <TableCell className="text-center font-bold text-[var(--accent-cyan)] text-base">25</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-center font-bold text-[var(--accent-violet)]">2</TableCell>
              <TableCell className="font-semibold flex items-center gap-2 text-[var(--text-heading)]">
                <div className="w-6 h-6 rounded bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)]/30 flex items-center justify-center text-xs font-black text-[var(--accent-violet)]">SN</div>
                Sangre Nueva FC
              </TableCell>
              <TableCell className="text-center font-mono">10</TableCell>
              <TableCell className="text-center font-mono">7</TableCell>
              <TableCell className="text-center font-mono">2</TableCell>
              <TableCell className="text-center font-mono">1</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-emerald)] font-bold">19</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-crimson)] font-bold">9</TableCell>
              <TableCell className="text-center font-mono font-semibold">+10</TableCell>
              <TableCell className="text-center font-bold text-[var(--accent-violet)] text-base">23</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* SECCIÓN 7: MODALES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Modales & Diálogos (Modals)</h2>
        </div>

        <div className="p-6 rounded-2xl glass-panel">
          <Button onClick={() => setIsModalOpen(true)}>
            Abrir Modal de Ejemplo
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirmar Reporte de Partido"
            description="Revisa los datos del encuentro antes de guardar la información en Supabase."
          >
            <div className="space-y-4 text-xs text-[var(--text-secondary)]">
              <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex justify-between items-center">
                <span className="font-bold text-[var(--text-heading)]">LeguaYork eSp</span>
                <span className="text-base font-bold text-[var(--accent-cyan)]">3 - 1</span>
                <span className="font-bold text-[var(--text-heading)]">Sangre Nueva FC</span>
              </div>
              <p>Al confirmar el resultado, las estadísticas se procesarán automáticamente en la tabla de posiciones.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>Confirmar y Guardar</Button>
              </div>
            </div>
          </Modal>
        </div>
      </section>
    </div>
  );
}
