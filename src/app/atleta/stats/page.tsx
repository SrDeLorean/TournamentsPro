'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart2, Award, Trophy, Activity, Target, Zap, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AtletaStatsPage() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Estadísticas de Rendimiento Individual"
        badgeIcon={<BarChart2 className="w-3.5 h-3.5 text-emerald-400" />}
        title="MIS STATS"
        highlightTitle="ESPORTS."
        description="Analítica detallada de tu rendimiento competitivo, precisión de pases/disparos, premios MVP e historial de minutos disputados."
      />

      {/* Grid Cards Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[var(--border-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Partidos Jugados</span>
              <span className="text-2xl font-black text-white font-mono">42</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-950 text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Goles / Bajas</span>
              <span className="text-2xl font-black text-white font-mono">18</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-950 text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Asistencias</span>
              <span className="text-2xl font-black text-white font-mono">14</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-950 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Premios MVP</span>
              <span className="text-2xl font-black text-white font-mono">7</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Chart Block */}
      <Card className="border-[var(--border-card)]">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Rendimiento Táctico Promedio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Efectividad de Pase / Apoyo</span>
              <span className="text-emerald-400 font-mono">89%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '89%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Recuperaciones de Balón / Intercepciones</span>
              <span className="text-cyan-400 font-mono">76%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '76%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
