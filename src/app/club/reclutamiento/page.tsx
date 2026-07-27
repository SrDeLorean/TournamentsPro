'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Plus, Users, Shield, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ClubReclutamientoPage() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Bolsa Abierta de Convocatorias eSports"
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
        title="VACANTES &"
        highlightTitle="RECLUTAMIENTO."
        description="Publica ofertas de empleo deportivo y busca posiciones tácticas para completar el roster de tu escuadra."
      />

      <Card className="border-[var(--border-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Convocatorias de Posición Abiertas
          </CardTitle>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Publicar Vacante
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2">
            <Badge variant="cyan" className="font-mono font-bold">DFC (Defensa Central)</Badge>
            <p className="text-xs text-slate-300 font-medium">Buscamos defensor sólido con buen pase en salida y juego aéreo.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2">
            <Badge variant="cyan" className="font-mono font-bold">MCD (Medio Defensivo)</Badge>
            <p className="text-xs text-slate-300 font-medium">Requerimos mediocampista táctico para contención y recuperación.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
