'use client';

import React from 'react';
import { Newspaper, Flame } from 'lucide-react';
import { GameConfig } from '@/lib/games-data';

interface GameHighlightsSectionProps {
  game: GameConfig;
}

export function GameHighlightsSection({ game }: GameHighlightsSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-purple-400" />
          Novedades & Comunicados ({game.name})
        </h3>
        <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" />
          ENVIVO DISCIPLINA
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-[var(--border-card)] space-y-2 shadow-lg hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>Publicado hace 2 horas</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">PARCHE OFICIAL</span>
          </div>
          <h4 className="font-extrabold text-base text-[var(--text-heading)] uppercase">
            Se abre la ventana de inscripciones para el torneo apertura
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Los capitanes de escuadra de {game.name} pueden revisar las fechas y normas para registrar sus plantillas de la temporada.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-[var(--border-card)] space-y-2 shadow-lg hover:border-cyan-400/50 transition-all">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>Publicado ayer</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">REGLAMENTO</span>
          </div>
          <h4 className="font-extrabold text-base text-[var(--text-heading)] uppercase">
            Actualización en las reglas de prórroga y tiempo extra
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Consulta los ajustes aprobados por los organizadores para los encuentros decisivos de playoffs en {game.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
