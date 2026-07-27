'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trophy, Shield, Gamepad2, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function InformationPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          Acerca de TorneosEsport PRO
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-heading)] tracking-tight">
          La Plataforma de Gestión eSports Multijuego
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Diseñada para conectar organizaciones de torneos, clubes eSports y jugadores en un entorno seguro, veloz y personalizado para cada disciplina.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel-hover">
          <CardHeader>
            <Gamepad2 className="w-8 h-8 text-[var(--accent-cyan)] mb-2" />
            <CardTitle>Portales Exclusivos</CardTitle>
            <CardDescription>Experiencia inmersiva por juego</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Cada disciplina (EA FC, Valorant, Rocket League, League of Legends) posee su propia paleta de colores, tablas de posiciones y estadísticas avanzadas.
          </CardContent>
        </Card>

        <Card className="glass-panel-hover">
          <CardHeader>
            <Shield className="w-8 h-8 text-[var(--accent-emerald)] mb-2" />
            <CardTitle>Multitenancy de Organizaciones</CardTitle>
            <CardDescription>Control total para organizadores</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Crea ligas, torneos de eliminatoria, controla el mercado de fichajes y verifica las solicitudes de transferencia de los equipos.
          </CardContent>
        </Card>

        <Card className="glass-panel-hover">
          <CardHeader>
            <Users className="w-8 h-8 text-[var(--accent-violet)] mb-2" />
            <CardTitle>Perfiles eSports de Jugador</CardTitle>
            <CardDescription>Cuentas unificadas por usuario</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Vincula tus Gamertags y Riot IDs bajo una sola cuenta y construye tu historial de clubes y estadísticas competitivas.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
