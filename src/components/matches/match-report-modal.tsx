'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, X, Upload, Camera, AlertCircle
} from 'lucide-react';

interface MatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    gameSlug: string;
    tournamentName: string;
  };
}

export function MatchReportModal({ isOpen, onClose, match }: MatchReportModalProps) {
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [mvpName, setMvpName] = useState('');
  const [evidencePreview, setEvidencePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentMatch = match || {
    id: 'm-103',
    homeTeam: 'SAN LORENZO ESP',
    awayTeam: 'SANGRE NUEVA FC',
    gameSlug: 'eafc26',
    tournamentName: 'Liga Élite Pro 11v11 2026',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (homeScore < 0 || awayScore < 0) {
      setErrorMsg('Ingresa un marcador válido');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate backend match report submission
      await new Promise((resolve) => setTimeout(resolve, 800));

      setIsSubmitting(false);
      setSuccessNotice(`¡Marcador ${homeScore} - ${awayScore} reportado exitosamente! Enviado a validación del organizador.`);
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 3000);
    } catch {
      setErrorMsg('Error al enviar el reporte de partido');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-mono">
      <div className="w-full max-w-xl bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-card)] space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 text-[var(--text-primary)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-black text-xl shadow-xl">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black uppercase text-[var(--text-heading)]">
                  Reporte de Marcador Oficial
                </h3>
                <Badge variant="emerald">Capitán Matchday</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {currentMatch.tournamentName}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitReport} className="space-y-5">
          
          {/* Score Counter Box */}
          <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-4">
            <span className="text-[10px] font-black uppercase text-purple-400 block tracking-wider text-center">
              🛡️ Marcador Final del Encuentro
            </span>

            <div className="grid grid-cols-5 items-center gap-2 text-center">
              {/* Home Team */}
              <div className="col-span-2 space-y-2">
                <span className="text-xs font-black text-[var(--text-heading)] uppercase block truncate">{currentMatch.homeTeam}</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={homeScore}
                  onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                  className="w-16 h-14 mx-auto text-center rounded-xl bg-[var(--bg-card)] border-2 border-cyan-400 font-black text-2xl text-cyan-400 focus:outline-none"
                />
              </div>

              <span className="text-xl font-black text-[var(--text-muted)] font-mono">VS</span>

              {/* Away Team */}
              <div className="col-span-2 space-y-2">
                <span className="text-xs font-black text-[var(--text-heading)] uppercase block truncate">{currentMatch.awayTeam}</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={awayScore}
                  onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                  className="w-16 h-14 mx-auto text-center rounded-xl bg-[var(--bg-card)] border-2 border-purple-400 font-black text-2xl text-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* MVP Selection Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">Jugador MVP del Partido (Opcional)</label>
            <input
              type="text"
              placeholder="ej. @SrDeLorean (3 Goles)"
              value={mvpName}
              onChange={(e) => setMvpName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl input-theme text-xs font-bold font-mono"
            />
          </div>

          {/* Upload Screenshot Evidence */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[var(--text-heading)] block flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              Adjuntar Captura de Pantalla / Evidencia del Marcador
            </label>

            <div className="p-4 rounded-2xl border-2 border-dashed border-[var(--border-card)] bg-[var(--bg-main)] text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="evidence-upload"
              />
              <label htmlFor="evidence-upload" className="cursor-pointer space-y-2 block">
                {evidencePreview ? (
                  <div className="space-y-2">
                    <Image src={evidencePreview} alt="Evidencia" width={512} height={128} unoptimized className="h-32 w-auto mx-auto rounded-xl object-cover border border-emerald-500" />
                    <span className="text-[11px] text-emerald-400 font-bold block">✓ Captura cargada correctamente</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                    <span className="text-xs font-bold text-[var(--text-primary)] block">Haz clic para subir la captura del juego</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">Soporta PNG, JPG o AVIF (Máx 5MB)</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-card)] pt-4">
            <Button type="button" onClick={onClose} variant="ghost" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-black text-xs uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl shadow-lg"
            >
              {isSubmitting ? 'Enviando Reporte...' : 'Enviar Reporte de Marcador'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
