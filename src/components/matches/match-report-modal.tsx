'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  CheckCircle2, X, Upload, Camera, AlertCircle, UserCircle2
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
  
  const [gameSchema, setGameSchema] = useState<any[]>([]);
  const [dynamicStats, setDynamicStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && match?.gameSlug) {
      // Fetch games to find the schema
      fetch('/api/admin/games')
        .then(res => res.json())
        .then(data => {
          if (data.games) {
            const game = data.games.find((g: any) => g.slug === match.gameSlug);
            if (game && game.stats_schema) {
              const schema = typeof game.stats_schema === 'string' ? JSON.parse(game.stats_schema) : game.stats_schema;
              setGameSchema(schema);
              const initialStats: Record<string, number> = {};
              schema.forEach((s: any) => { initialStats[s.key] = 0; });
              setDynamicStats(initialStats);
            } else {
              setGameSchema([]);
            }
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, match]);

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

  const handleStatChange = (key: string, val: string) => {
    setDynamicStats(prev => ({ ...prev, [key]: Number(val) }));
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
      const payload = {
        matchId: currentMatch.id,
        homeScore,
        awayScore,
        mvpName,
        dynamicStats,
        participantsStats,
        gameSlug: currentMatch.gameSlug
      };

      const res = await fetch('/api/matches/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el reporte');
      }

      setIsSubmitting(false);
      setSuccessNotice(`¡Marcador ${homeScore} - ${awayScore} reportado exitosamente! Enviado a validación.`);
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar el reporte de partido');
      setIsSubmitting(false);
    }
  };

  const [riotId, setRiotId] = useState('');
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Nuevo estado para múltiples jugadores
  const [participantsStats, setParticipantsStats] = useState<any[] | null>(null);

  const isRiotGame = currentMatch.gameSlug === 'lol' || currentMatch.gameSlug === 'valorant';

  const handleSearchHistory = async () => {
    if (!riotId) {
      setErrorMsg('Ingresa un Riot ID válido (ej. Jugador#LAS)');
      return;
    }
    setIsFetchingHistory(true);
    setErrorMsg('');
    setMatchHistory([]);
    try {
      const res = await fetch(`/api/integrations/riot/history?riotId=${encodeURIComponent(riotId)}&gameSlug=${currentMatch.gameSlug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar con Riot Games');
      setMatchHistory(data.history);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSelectRiotMatch = async (matchId: string) => {
    setIsSyncing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/integrations/riot/match?matchId=${matchId}&gameSlug=${currentMatch.gameSlug}&gamertag=${encodeURIComponent(riotId.split('#')[0])}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar con Riot Games');
      
      if (data.participants) {
        setParticipantsStats(data.participants);
        
        if (data.matchScore) {
          setHomeScore(data.matchScore.team1);
          setAwayScore(data.matchScore.team2);
        }
        
        setSuccessNotice(`¡Estadísticas de ${data.participants.length} jugadores importadas exitosamente!`);
      } else {
        setDynamicStats(data.stats); // Fallback if API hasn't updated
        setSuccessNotice(`¡Estadísticas importadas exitosamente!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Reportar resultado del partido" size="lg" showCloseButton={false} closeDisabled={isSubmitting} className="p-6 sm:p-8 space-y-6 font-mono">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-black text-xl shadow-xl">
              🎮
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
          
          {isRiotGame && (
            <div className="p-4 rounded-xl border border-[#EB0029]/30 bg-[#EB0029]/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#EB0029] block tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EB0029] animate-pulse"></span>
                  Integración Automática Riot Games
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Busca el historial reciente usando un Riot ID para autocompletar las estadísticas del partido.</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Riot ID (ej. Faker#SKT1)"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg input-theme text-xs font-mono"
                />
                <Button type="button" onClick={handleSearchHistory} disabled={isFetchingHistory} className="bg-[#EB0029] hover:bg-[#EB0029]/80 text-white whitespace-nowrap">
                  {isFetchingHistory ? 'Buscando...' : 'Ver Historial'}
                </Button>
              </div>

              {matchHistory.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">Últimas Partidas (Click para importar)</span>
                  {matchHistory.map((h, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleSelectRiotMatch(h.matchId)}
                      className={`p-3 rounded-lg border border-[#EB0029]/20 bg-[var(--bg-card)] hover:border-[#EB0029] cursor-pointer flex justify-between items-center transition-all ${isSyncing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${h.result === 'Victoria' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {h.result}
                          </span>
                          <span className="text-xs font-bold text-white">{h.champion}</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">{h.date} • Duración: {h.duration}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#EB0029]">{h.kda} KDA</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
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


          {!participantsStats ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Atleta Destacado (MVP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle2 className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={mvpName}
                    onChange={(e) => setMvpName(e.target.value)}
                    placeholder="Gamertag del MVP"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-main)] border border-[var(--border-card)] rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {gameSchema.length > 0 && (
                <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-4">
                  <span className="text-[10px] font-black uppercase text-[var(--text-muted)] block tracking-wider">Estadísticas del MVP</span>
                  <div className="grid grid-cols-2 gap-4">
                    {gameSchema.map((stat) => (
                      <div key={stat.key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</label>
                        <input
                          type={stat.type === 'number' ? 'number' : 'text'}
                          required
                          value={dynamicStats[stat.key] || ''}
                          onChange={(e) => handleStatChange(stat.key, e.target.value)}
                          placeholder={`Ej: ${stat.type === 'number' ? '0' : '-'}`}
                          className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-mono transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 uppercase flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    10 Jugadores Cargados
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Revisa las estadísticas importadas antes de enviar el reporte oficial.</p>
                </div>
              </div>
              
              <div className="bg-[var(--bg-main)] border border-[var(--border-card)] rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-card)] sticky top-0 border-b border-[var(--border-card)] z-10">
                      <tr>
                        <th className="px-3 py-2 font-black text-[var(--text-muted)] uppercase">Jugador (Riot ID)</th>
                        {gameSchema.map(stat => (
                          <th key={stat.key} className="px-2 py-2 font-black text-[var(--text-muted)] uppercase text-center">{stat.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)] font-mono">
                      {/* TEAM A HEADER */}
                      <tr className="bg-emerald-500/10 border-l-2 border-emerald-500">
                        <td colSpan={gameSchema.length + 1} className="px-3 py-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          Team A
                        </td>
                      </tr>
                      {/* TEAM A PLAYERS */}
                      {(participantsStats.filter((p: any) => p.teamId === 'Blue' || p.teamId === 100).length === 5 
                        ? participantsStats.filter((p: any) => p.teamId === 'Blue' || p.teamId === 100)
                        : participantsStats.slice(0, 5)
                      ).map((p: any, idx: number) => (
                        <tr key={`a-${idx}`} className="hover:bg-[var(--bg-card-hover)] transition-colors border-l-2 border-emerald-500/20">
                          <td className="px-3 py-2 font-bold text-white truncate max-w-[120px]">{p.riotId}</td>
                          {gameSchema.map(stat => (
                            <td key={stat.key} className={`px-2 py-2 text-center ${stat.key === 'acs' || stat.key === 'kills' ? 'font-bold text-white' : 'text-[var(--text-muted)]'}`}>
                              {p.stats[stat.key] !== undefined ? p.stats[stat.key] : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* TEAM B HEADER */}
                      <tr className="bg-rose-500/10 border-l-2 border-rose-500 mt-2">
                        <td colSpan={gameSchema.length + 1} className="px-3 py-1 text-[10px] font-black uppercase text-rose-400 tracking-wider">
                          Team B
                        </td>
                      </tr>
                      {/* TEAM B PLAYERS */}
                      {(participantsStats.filter((p: any) => p.teamId === 'Red' || p.teamId === 200).length === 5 
                        ? participantsStats.filter((p: any) => p.teamId === 'Red' || p.teamId === 200)
                        : participantsStats.slice(5, 10)
                      ).map((p: any, idx: number) => (
                        <tr key={`b-${idx}`} className="hover:bg-[var(--bg-card-hover)] transition-colors border-l-2 border-rose-500/20">
                          <td className="px-3 py-2 font-bold text-white truncate max-w-[120px]">{p.riotId}</td>
                          {gameSchema.map(stat => (
                            <td key={stat.key} className={`px-2 py-2 text-center ${stat.key === 'acs' || stat.key === 'kills' ? 'font-bold text-white' : 'text-[var(--text-muted)]'}`}>
                              {p.stats[stat.key] !== undefined ? p.stats[stat.key] : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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

    </Modal>
  );
}
