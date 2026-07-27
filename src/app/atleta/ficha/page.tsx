'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Trophy, Award, Gamepad2, CheckCircle2, Edit3, Sparkles } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';

export default function AtletaFichaPage() {
  const { currentUser } = useAuth();
  const primaryGame = GAMES_CATALOG[currentUser?.primaryGame || 'eafc26'] || GAMES_CATALOG['eafc26'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Ficha Oficial de Atleta eSports"
        badgeIcon={<User className="w-3.5 h-3.5 text-cyan-400" />}
        title="MI FICHA DE"
        highlightTitle="ATLETA."
        description="Consulta y administra tu perfil deportivo, posición preferida en cancha, valoración eSports e información de contacto."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Summary Card */}
        <Card className="lg:col-span-1 border-[var(--border-card)]">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <Avatar fallback={currentUser?.name || 'User'} status="online" size="xl" />
            </div>
            <CardTitle className="text-xl font-black uppercase text-[var(--text-heading)]">
              {currentUser?.name || 'Atleta Sin Nombre'}
            </CardTitle>
            <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold">
              @{currentUser?.gamertag || 'Gamertag'}
            </span>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase">Rol en Plataforma:</span>
                <Badge variant="cyan">{currentUser?.role || 'Jugador'}</Badge>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-slate-400 font-bold uppercase">Valoración eSports:</span>
                <span className="font-mono font-black text-emerald-400">★ {currentUser?.rating || '9.5'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-slate-400 font-bold uppercase">Plataforma Principal:</span>
                <span className="font-mono font-bold text-cyan-300">{currentUser?.platform || 'PS5'}</span>
              </div>
            </div>

            <Button variant="primary" className="w-full font-bold text-xs flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" />
              Editar Mi Ficha
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Technical Details */}
        <Card className="lg:col-span-2 border-[var(--border-card)] space-y-6">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              Perfil Técnico en Disciplina {primaryGame.name}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Posición Principal:</span>
                <p className="text-base font-black text-cyan-400 font-mono">{currentUser?.position || 'DFC (Defensa Central)'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Rango / Distinción:</span>
                <p className="text-base font-black text-purple-400 font-mono">{currentUser?.rankBadge || 'División 1'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 space-y-3">
              <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Estado de Contratación
              </h4>
              <p className="text-xs text-slate-300">
                Tu perfil se encuentra actualmente registrado como <strong className="text-cyan-300 font-bold">{currentUser?.status || 'Buscando Club'}</strong>. Los directores técnicos y capitanes de escuadras pueden enviarte ofertas de fichaje directamente.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
