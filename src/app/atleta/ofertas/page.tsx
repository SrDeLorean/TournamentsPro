'use client';

import React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Shield, CheckCircle2, XCircle, ArrowRightLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AtletaOfertasPage() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Bolsa de Trabajo & Mercado de Pases"
        badgeIcon={<ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />}
        title="MIS OFERTAS &"
        highlightTitle="FICHAJES."
        description="Revisa las propuestas de contrato enviadas por capitanes y clubes para unirte a sus plantillas oficiales."
      />

      <Card className="border-[var(--border-card)]">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Ofertas Recibidas de Escuadras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center font-black text-purple-300">
                SN
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white uppercase">Sangre Nueva FC</h4>
                <p className="text-xs text-slate-400">Oferta de Contrato como Titular (Posición: DFC)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aceptar Fichaje
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Rechazar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
