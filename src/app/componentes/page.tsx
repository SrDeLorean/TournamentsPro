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
import { GAMES_CATALOG } from '@/lib/games-data';
import { Trophy, Shield, Search, Sparkles, Send, Mail, User, Bell, Palette } from 'lucide-react';

export default function ComponentsShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="border-b border-[var(--border-card)] pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          eSports Design System & UI Kit v2.0
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-heading)]">
          Catálogo UI Kit con Paletas Oficiales de Juego
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 max-w-3xl">
          Explora la colección de componentes visuales adaptados dinámicamente con las paletas de colores oficiales de VALORANT, EA FC, CS:GO, League of Legends y Rocket League.
        </p>
      </div>

      {/* SECCIÓN ESPECIAL: PALETAS DE COLORES OFICIALES POR JUEGO */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Paletas de Colores Oficiales por Disciplina</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(GAMES_CATALOG).map((game) => (
            <div
              key={game.id}
              className="p-5 rounded-2xl glass-panel border border-[var(--border-card)] space-y-4"
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
                size="sm"
                className="w-full font-bold shadow-md"
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selector de Tema (Theme Switcher)</CardTitle>
              <CardDescription>Soporta Claro, Oscuro (Dark Space) y OLED (Pitch Black)</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>

          <Card>
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
          <h2 className="text-xl font-bold text-[var(--text-heading)]">2. Botones & Variantes (Buttons)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel space-y-6">
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
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Tamaños (Sizes)</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md)</Button>
              <Button size="lg">Large (lg)</Button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Estados de Carga e Iconos</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button isLoading>Procesando...</Button>
              <Button variant="secondary">
                <Send className="w-4 h-4 mr-2" />
                Enviar Reporte
              </Button>
              <Button variant="outline" disabled>Deshabilitado</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN BADGES & ETIQUETAS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Shield className="w-5 h-5 text-[var(--accent-emerald)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">3. Insignias & Etiquetas (Badges)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel flex flex-wrap items-center gap-3">
          <Badge variant="cyan">EA FC 26</Badge>
          <Badge variant="violet">Valorant 5v5</Badge>
          <Badge variant="emerald">Inscripciones Abiertas</Badge>
          <Badge variant="gold">Prize Pool $2,000 USD</Badge>
          <Badge variant="rose">Mercado Cerrado</Badge>
          <Badge variant="slate">Borrador</Badge>
        </div>
      </section>

      {/* 4. SECCIÓN TARJETAS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">4. Tarjetas & Paneles (Cards)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Badge variant="cyan" className="w-max mb-2">Liga Principal</Badge>
              <CardTitle>NGL Temporada 10</CardTitle>
              <CardDescription>Organización: NGL Esports</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[var(--text-secondary)] space-y-2">
              <p>Formato de torneo: Liga Regular + Playoffs Eliminatorios.</p>
              <p className="text-[var(--accent-cyan)] font-bold">16 Equipos Registrados</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full">Ver Fixture</Button>
            </CardFooter>
          </Card>

          <Card className="neon-border-cyan">
            <CardHeader>
              <Badge variant="gold" className="w-max mb-2">Destacado</Badge>
              <CardTitle>Copa Chile AMC</CardTitle>
              <CardDescription>Organización: Comunidad AMC</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[var(--text-secondary)] space-y-2">
              <p>Inscripciones activas hasta el 31 de Julio.</p>
              <p className="text-[var(--accent-emerald)] font-bold">$500,000 CLP Premio</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm" className="w-full">Inscribir Club</Button>
            </CardFooter>
          </Card>

          <Card className="glass-panel-hover">
            <CardHeader>
              <Badge variant="violet" className="w-max mb-2">Tactical FPS</Badge>
              <CardTitle>Valorant Masters</CardTitle>
              <CardDescription>Organización: Torneos Pro FC</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[var(--text-secondary)] space-y-2">
              <p>Modalidad 5v5 con sistema de Upper/Lower Brackets.</p>
              <p className="text-[var(--text-muted)]">Estado: En Curso</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">Ver Brackets</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 5. SECCIÓN FORMULARIOS & INPUTS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Mail className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">5. Controles de Formulario (Inputs)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Gamertag de Jugador"
            placeholder="ej. SrDeLorean"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Ingresa tu ID oficial dentro del juego"
          />

          <Input
            label="Búsqueda de Torneo"
            placeholder="Buscar torneos o clubes..."
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
            label="Observaciones del Partido / Admin"
            placeholder="Escribe detalles del reporte o incidentes durante el partido..."
          />
        </div>
      </section>

      {/* 6. SECCIÓN AVATARES & PRESENCIA */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <User className="w-5 h-5 text-[var(--accent-emerald)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">6. Avatares & Presencia de Usuario (Avatars)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Avatar size="sm" fallback="SD" status="online" />
            <Avatar size="md" fallback="SD" status="online" />
            <Avatar size="lg" fallback="SD" status="away" />
            <Avatar size="xl" fallback="SD" status="offline" />
          </div>

          <div className="border-l border-[var(--border-card)] pl-6 flex items-center gap-3">
            <Avatar size="md" fallback="FC" src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80" status="online" />
            <div>
              <h4 className="text-sm font-bold text-[var(--text-heading)]">SrDeLorean</h4>
              <p className="text-xs text-[var(--accent-emerald)] font-medium">Capitán en San Lorenzo eSp</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECCIÓN ALERTAS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Bell className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">7. Alertas & Mensajes del Sistema (Alerts)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert variant="info" title="Mercado Abierto">
            El mercado de transferencias para la Temporada 10 estará abierto hasta el 31 de Julio.
          </Alert>

          <Alert variant="success" title="Fichaje Aprobado">
            La solicitud de fichaje para el jugador SG Jotta ha sido verificada con éxito.
          </Alert>

          <Alert variant="warning" title="Partido Pendiente">
            Recuerda subir la captura comprobante del encuentro antes de las 23:59 hrs.
          </Alert>

          <Alert variant="danger" title="Acceso Restringido">
            Solo el capitán registrado puede realizar modificaciones en la plantilla del club.
          </Alert>
        </div>
      </section>

      {/* 8. SECCIÓN TABLA DE POSICIONES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">8. Tablas de Posiciones eSports (Data Tables)</h2>
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

      {/* 9. SECCIÓN MODALES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">9. Modales & Diálogos (Modals)</h2>
        </div>

        <div className="p-6 rounded-xl glass-panel">
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
