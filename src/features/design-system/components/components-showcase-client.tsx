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
} from 'lucide-react';

export default function ComponentsShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [input3DValue, setInput3DValue] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Page Header */}
      <div className="border-b border-[var(--border-card)] pb-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-mono font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>eSports Design System & 3D UI Engine v3.0</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-heading)] uppercase font-display">
          Catálogo UI Kit con Estilos 3D eSports
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 max-w-3xl">
          Explora la colección de componentes visuales con elevación 3D, botones táctiles con relieve físico, tarjetas con perspectiva giroscópica y paletas oficiales de juego.
        </p>
      </div>

      {/* 🚀 NUEVA SECCIÓN ESTRELLA: 3D UI KIT & INTERACTIVE PLAYGROUND */}
      <section className="space-y-6 p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(0,240,255,0.15)] relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 size-80 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 size-80 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Box className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest block">
                [ DEMOSTRACIÓN EN TIEMPO REAL ]
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">
                Laboratorio de Componentes 3D
              </h2>
            </div>
          </div>

          <Badge variant="cyan" is3D>
            ★ 3D Activo
          </Badge>
        </div>

        {/* 1. Botones 3D con Extrusión Táctil */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              1. Botones Táctiles con Relieve 3D Físico (Prensa & Profundidad)
            </h3>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Haz clic en los botones para sentir el efecto de presión física 3D con sombras dinámicas de profundidad:
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Button variant="3d-cyan" size="md">
              <Zap className="w-4 h-4 mr-1.5" />
              3D Cyan Pro
            </Button>
            <Button variant="3d-violet" size="md">
              <Sparkles className="w-4 h-4 mr-1.5" />
              3D Violet Arena
            </Button>
            <Button variant="3d-emerald" size="md">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              3D Emerald Match
            </Button>
            <Button variant="3d-gold" size="md">
              <Crown className="w-4 h-4 mr-1.5" />
              3D Gold Champion
            </Button>
            <Button variant="3d-crimson" size="md">
              <Flame className="w-4 h-4 mr-1.5" />
              3D Crimson Danger
            </Button>
            <Button variant="3d-glass" size="md">
              3D Glassmorphism
            </Button>
          </div>
        </div>

        {/* 2. Insignias y Badges 3D */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              2. Badges e Insignias 3D con Brillo Especular
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="cyan" is3D>
              EA FC 26 11v11
            </Badge>
            <Badge variant="violet" is3D>
              VALORANT 5v5
            </Badge>
            <Badge variant="emerald" is3D>
              Torneo Verificado
            </Badge>
            <Badge variant="gold" is3D>
              Premio $5,000 USD
            </Badge>
            <Badge variant="rose" is3D>
              Sanción Disciplinaria
            </Badge>
            <Badge variant="slate" is3D>
              Borrador Técnico
            </Badge>
          </div>
        </div>

        {/* 3. Tarjetas con Perspectiva 3D Interactiva & Inputs 3D */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              3. Tarjetas con Perspectiva 3D (Gira el Cursor) & Inputs 3D Inset
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 3D Interactiva 1 */}
            <Card3D maxTilt={12} className="h-full">
              <div className="p-6 space-y-4 h-full flex flex-col justify-between">
                <Card3DItem depth={30} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="cyan" is3D>Matchday #14</Badge>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">20:30 HRS</span>
                  </div>
                  <h4 className="text-lg font-black text-white uppercase">San Lorenzo vs LeguaYork</h4>
                  <p className="text-xs text-slate-300">
                    Gran Final Copa de Oro 11v11 EA Sports FC 26.
                  </p>
                </Card3DItem>

                <Card3DItem depth={20} className="pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-white">SL [3]</span>
                    <span className="text-cyan-400 font-extrabold">VS</span>
                    <span className="font-bold text-white">[1] LY</span>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button variant="3d-cyan" size="sm" className="w-full">
                    Ver Transmisión 3D
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>

            {/* Card 3D Interactiva 2 */}
            <Card3D maxTilt={12} className="h-full">
              <div className="p-6 space-y-4 h-full flex flex-col justify-between">
                <Card3DItem depth={30} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="gold" is3D>Fichaje Top</Badge>
                    <span className="text-[10px] font-mono text-amber-300 font-bold">AGENCIA LIBRE</span>
                  </div>
                  <h4 className="text-lg font-black text-white uppercase">SrDeLorean #10</h4>
                  <p className="text-xs text-slate-300">
                    Mediapunta Creativo • Valor de Mercado: 1,850 Pts.
                  </p>
                </Card3DItem>

                <Card3DItem depth={20} className="pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-white/10">
                      <span className="text-slate-400 block">GOLES</span>
                      <span className="text-emerald-400 font-bold text-xs">28 Goles</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-white/10">
                      <span className="text-slate-400 block">ASISTENCIAS</span>
                      <span className="text-cyan-400 font-bold text-xs">19 Asist</span>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button variant="3d-gold" size="sm" className="w-full">
                    Enviar Oferta de Club
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>

            {/* Formulario con Inputs 3D */}
            <Card is3D className="p-6 space-y-4">
              <div>
                <Badge variant="violet" is3D className="mb-2">Formulario 3D</Badge>
                <h4 className="text-base font-black text-white uppercase">Controles Inset 3D</h4>
                <p className="text-xs text-slate-300">
                  Inputs con profundidad inset de alta gama:
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  is3D
                  label="Gamertag Atleta"
                  placeholder="ej. SrDeLorean"
                  value={input3DValue}
                  onChange={(e) => setInput3DValue(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                />
                <Input
                  is3D
                  label="Búsqueda de Torneo"
                  placeholder="Buscar torneos 3D..."
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <Button variant="3d-violet" size="sm" className="w-full">
                Guardar con Relieve 3D
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN PALETAS DE COLORES OFICIALES POR JUEGO */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Paletas de Colores Oficiales por Disciplina</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(GAMES_CATALOG).map((game) => (
            <div
              key={game.id}
              className="p-5 rounded-2xl card-3d-elevated border border-[var(--border-card)] space-y-4"
              style={{
                borderColor: `${game.brandColor}40`,
                boxShadow: `0 10px 30px -10px ${game.brandColor}20`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{game.icon}</span>
                  <div>
                    <h3 className="font-extrabold text-base text-[var(--text-heading)]">{game.name}</h3>
                    <span className="text-[10px] text-[var(--text-muted)] block">{game.category}</span>
                  </div>
                </div>
                <Badge
                  is3D
                  style={{
                    backgroundColor: `${game.brandColor}20`,
                    color: game.brandColor,
                    borderColor: `${game.brandColor}40`,
                  }}
                >
                  Oficial
                </Badge>
              </div>

              {/* Swatches */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Muestras de Color</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm" style={{ backgroundColor: game.brandColor }}>
                    {game.brandColor}
                  </div>
                  <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm" style={{ backgroundColor: game.accentColor }}>
                    {game.accentColor}
                  </div>
                  <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm border border-slate-700" style={{ backgroundColor: game.secondaryAccent }}>
                    {game.secondaryAccent}
                  </div>
                </div>
              </div>

              {/* Interactive Button Preview */}
              <Button
                variant="3d-cyan"
                size="sm"
                className="w-full"
                style={{
                  backgroundColor: game.brandColor,
                  color: '#FFFFFF',
                }}
              >
                Inscribir Equipo en {game.name}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* 1. SECCIÓN CONTROLES GLOBALES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-violet)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">1. Controles Globales (Tema e Idioma)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card is3D>
            <CardHeader>
              <CardTitle className="text-base">Selector de Tema (Theme Switcher)</CardTitle>
              <CardDescription>Soporta Claro, Oscuro (Dark Space) y OLED (Pitch Black)</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>

          <Card is3D>
            <CardHeader>
              <CardTitle className="text-base">Selector de Idioma (Language Switcher)</CardTitle>
              <CardDescription>Soporta Español (ES), Inglés (EN) y Portugués (PT)</CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. SECCIÓN BOTONES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">2. Botones Estándar & 3D (Buttons)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel space-y-6">
          <div>
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Variantes con Profundidad 3D</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="3d-cyan">3D Cyan</Button>
              <Button variant="3d-violet">3D Violet</Button>
              <Button variant="3d-emerald">3D Emerald</Button>
              <Button variant="3d-gold">3D Gold</Button>
              <Button variant="3d-crimson">3D Crimson</Button>
              <Button variant="3d-glass">3D Glass</Button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Variantes Flat Glass</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Cyan</Button>
              <Button variant="secondary">Secondary Violet</Button>
              <Button variant="outline">Outline Glass</Button>
              <Button variant="danger">Danger Crimson</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN TABLA DE POSICIONES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">3. Tablas de Posiciones eSports (Data Tables)</h2>
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

      {/* 4. SECCIÓN MODALES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">4. Modales & Diálogos (Modals)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel">
          <Button variant="3d-cyan" onClick={() => setIsModalOpen(true)}>
            Abrir Modal de Ejemplo con Botón 3D
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirmar Reporte de Partido 3D"
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
                <Button variant="3d-cyan" size="sm" onClick={() => setIsModalOpen(false)}>Confirmar y Guardar</Button>
              </div>
            </div>
          </Modal>
        </div>
      </section>
    </div>
  );
}
