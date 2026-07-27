'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Award, Shield, CheckCircle2, Calendar, FileCheck, Upload, ImageIcon, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageUploadCard } from '@/components/ui/image-upload-card';

export default function ClubMatchdayPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'matchday' | 'report' | 'approval'>('report');

  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('match-2');
  const [reportProofUrl, setReportProofUrl] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');

  const isAdminOrOrganizer = currentUser?.role === 'Administrador' || currentUser?.role === 'Organizador';

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/organizer/fixture?tournamentId=tourn-eafc-liga');
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (e) {
      console.error('Error cargando partidos:', e);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Captain score report
  const handleReportScore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/matches/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatchId,
          action: 'REPORT_SCORE',
          scoreHome: Number(formData.get('scoreHome')),
          scoreAway: Number(formData.get('scoreAway')),
          proofUrl: reportProofUrl,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg('¡Marcador y comprobante enviados! El partido pasa a estado POR_REVISAR.');
        fetchMatches();
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      console.error('Error enviando reporte:', e);
    }
  };

  // Organizer approval (Visto Bueno)
  const handleApproveMatch = async (matchId: string, scoreHome: number, scoreAway: number) => {
    try {
      const res = await fetch('/api/matches/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          action: 'APPROVE',
          scoreHome,
          scoreAway,
          requesterRole: currentUser?.role || 'Organizador',
        }),
      });

      if (res.ok) {
        setStatusMsg('¡Visto bueno otorgado! Resultado marcado como TERMINADO.');
        fetchMatches();
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      console.error('Error otorgando visto bueno:', e);
    }
  };

  const pendingMatches = matches.filter((m) => m.status === 'POR_REVISAR');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Módulo de Partidos & Encuentros"
        badgeIcon={<Award className="w-3.5 h-3.5 text-amber-400" />}
        title="CONVOCATORIA, REPORTE &"
        highlightTitle="MATCHDAY."
        description="Gestión de alineaciones, reporte de marcadores por capitanes con captura de comprobante y visto bueno oficial."
      />

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'report' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          1. Reportar Marcador (Capitán)
        </button>

        {isAdminOrOrganizer && (
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'approval' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <Check className="w-4 h-4" />
            2. Visto Bueno (Organizador) ({pendingMatches.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('matchday')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'matchday' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Award className="w-4 h-4" />
          3. Alineación del Club
        </button>
      </div>

      {/* TAB 1: REPORTE DE MARCADOR */}
      {activeTab === 'report' && (
        <Card className="p-6 bg-slate-950 border border-cyan-500/40 space-y-6">
          <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Enviar Marcador y Captura de Comprobante (Capitanes)
          </h3>

          <form onSubmit={handleReportScore} className="space-y-6 max-w-xl">
            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-300 uppercase block">Seleccionar Encuentro a Reportar:</label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-300 font-bold focus:outline-none"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    Jornada {m.matchday}: {m.home_team_name || 'Local'} VS {m.away_team_name || 'Visitante'} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-slate-300 uppercase block">Goles Local:</label>
                <input type="number" name="scoreHome" required defaultValue={2} className="w-full p-2.5 rounded-xl bg-slate-900 border text-white font-mono text-center text-lg font-black" />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 uppercase block">Goles Visitante:</label>
                <input type="number" name="scoreAway" required defaultValue={1} className="w-full p-2.5 rounded-xl bg-slate-900 border text-white font-mono text-center text-lg font-black" />
              </div>
            </div>

            <ImageUploadCard
              label="Comprobante / Captura de Pantalla del Partido"
              subtitle="Formato WebP HD optimizado"
              currentUrl={reportProofUrl}
              fallbackType="banner"
              uploadType="banner"
              maxDimension={1200}
              brandColor="#00F0FF"
              uploadButtonText="Subir Captura de Comprobante"
              entityName="match-proof"
              entityId={selectedMatchId}
              onUploadSuccess={(url) => setReportProofUrl(url)}
            />

            <Button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-xl">
              Enviar Marcador a Revisión (POR_REVISAR)
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: VISTO BUENO DEL ORGANIZADOR */}
      {activeTab === 'approval' && isAdminOrOrganizer && (
        <Card className="p-6 bg-slate-950 border border-amber-500/40 space-y-6">
          <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
            <Check className="w-4 h-4 text-amber-400" />
            Módulo de Visto Bueno y Homologación de Resultados
          </h3>

          <div className="space-y-4">
            {pendingMatches.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-900 border border-amber-400/30 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-white text-sm uppercase">{m.home_team_name} VS {m.away_team_name}</span>
                  <p className="text-xs font-mono text-amber-300">Reportado: {m.reported_score_home} - {m.reported_score_away}</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleApproveMatch(m.id, m.reported_score_home || 0, m.reported_score_away || 0)}
                  className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Dar Visto Bueno
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: CONVOCATORIA DE ALINEACIÓN */}
      {activeTab === 'matchday' && (
        <Card className="p-6 bg-slate-950 border border-white/10 space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Convocatoria & Titulares Confirmados
          </h3>
          <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
            <span className="text-sm font-extrabold text-white uppercase">{currentUser?.name || 'Atleta Confirmado'}</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">● Titular Confirmado</span>
          </div>
        </Card>
      )}
    </div>
  );
}
