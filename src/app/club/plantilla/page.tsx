'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Shield, Award, UserCheck, Plus, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ClubPlantillaPage() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Gestión Oficial de Roster de Escuadra"
        badgeIcon={<Users className="w-3.5 h-3.5 text-purple-400" />}
        title="PLANTILLA DEL"
        highlightTitle="CLUB."
        description="Administra la nómina completa de integrantes del club, asigna dorsales, posiciones tácticas y gestiona roles de Capitán/Titular."
      />

      <Card className="border-[var(--border-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Integrantes de la Escuadra
          </CardTitle>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Añadir Atleta
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center font-mono font-black text-purple-300">
                #10
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white uppercase">{currentUser?.name || 'SrDeLorean'}</h4>
                <p className="text-xs text-cyan-400 font-mono">@{currentUser?.gamertag || 'SrDeLorean'} • Posición: DC</p>
              </div>
            </div>
            <Badge variant="violet">Capitán / Fundador</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
