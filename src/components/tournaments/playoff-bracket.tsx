import React from 'react';
import { Avatar } from '@/components/ui/avatar';

interface PlayoffMatch {
  id: string | number;
  home_team_name: string;
  home_team_tag: string;
  away_team_name: string;
  away_team_tag: string;
  score_home: number | null;
  score_away: number | null;
  status: string;
  round_name: string;
  matchday?: number;
}

interface PlayoffPair {
  ida: PlayoffMatch;
  vuelta?: PlayoffMatch;
}

interface PlayoffBracketProps {
  matches: PlayoffMatch[];
  brandColor?: string;
}

const ROUND_ORDER_MAP: Record<string, number> = {
  'treintaidosavos': 1,
  'treintaidosavos de final': 1,
  'dieciseisavos': 2,
  'dieciseisavos de final': 2,
  'octavos': 3,
  'octavos de final': 3,
  'cuartos': 4,
  'cuartos de final': 4,
  'semifinal': 5,
  'semifinales': 5,
  'tercer puesto': 6,
  'tercer lugar': 6,
  'final': 7,
};

function getRoundWeight(roundName: string): number {
  if (!roundName) return 0;
  const lower = roundName.toLowerCase().trim();
  for (const [key, weight] of Object.entries(ROUND_ORDER_MAP)) {
    if (lower.includes(key)) return weight;
  }
  const matchMatchday = roundName.match(/\d+/);
  if (matchMatchday) return parseInt(matchMatchday[0], 10);
  return 0;
}

export function PlayoffBracket({ matches, brandColor = 'var(--game-brand)' }: PlayoffBracketProps) {
  // 1. Group matches by Base Round (e.g. "Cuartos" instead of "Cuartos (Ida)")
  const matchesByBaseRound = new Map<string, PlayoffMatch[]>();

  matches.forEach(m => {
    const rName = m.round_name || 'Ronda Única';
    const lower = rName.toLowerCase();
    const isPlayoffRound = Object.keys(ROUND_ORDER_MAP).some(key => lower.includes(key));
    
    if (isPlayoffRound) {
      const baseRoundName = rName.replace(/ \((Ida|Vuelta)\)/i, '').trim();
      if (!matchesByBaseRound.has(baseRoundName)) matchesByBaseRound.set(baseRoundName, []);
      matchesByBaseRound.get(baseRoundName)!.push(m);
    }
  });

  // 2. Pair Ida & Vuelta matches
  const baseRoundsMap = new Map<string, PlayoffPair[]>();

  for (const [baseRound, roundMatches] of matchesByBaseRound.entries()) {
    const pairs: PlayoffPair[] = [];
    const processedIds = new Set<string | number>();

    for (const m of roundMatches) {
      if (processedIds.has(m.id)) continue;

      const isVuelta = (m.round_name || '').toLowerCase().includes('(vuelta)');
      const isIda = (m.round_name || '').toLowerCase().includes('(ida)');
      
      let idaMatch: PlayoffMatch | undefined;
      let vueltaMatch: PlayoffMatch | undefined;

      if (isVuelta || isIda) {
        const baseId = m.id.toString().replace(/-ida|-vuelta/i, '');
        const findPair = (targetMatch: PlayoffMatch) => {
          return roundMatches.find(other => 
            other.id !== targetMatch.id && 
            !processedIds.has(other.id) &&
            other.id.toString().replace(/-ida|-vuelta/i, '') === baseId
          );
        };
        
        const findPairLegacy = (targetMatch: PlayoffMatch) => {
          return roundMatches.find(other => 
            other.id !== targetMatch.id && 
            !processedIds.has(other.id) &&
            other.home_team_name === targetMatch.away_team_name && 
            other.away_team_name === targetMatch.home_team_name &&
            other.home_team_name !== 'Por Definir'
          );
        };

        if (isVuelta) {
          vueltaMatch = m;
          idaMatch = findPair(m) || findPairLegacy(m);
        } else {
          idaMatch = m;
          vueltaMatch = findPair(m) || findPairLegacy(m);
        }
      } else {
        idaMatch = m;
        vueltaMatch = undefined;
      }

      if (idaMatch) processedIds.add(idaMatch.id);
      if (vueltaMatch) processedIds.add(vueltaMatch.id);

      // If somehow idaMatch wasn't found (shouldn't happen, but fallback to m)
      pairs.push({ ida: idaMatch || m, vuelta: vueltaMatch });
    }

    baseRoundsMap.set(baseRound, pairs);
  }

  // 3. Sort rounds conceptually
  const sortedRounds = Array.from(baseRoundsMap.keys()).sort((a, b) => {
    return getRoundWeight(a) - getRoundWeight(b);
  });

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] border border-[var(--border-card)] rounded-2xl glass-panel">
        No hay cruces de playoffs generados para esta competencia aún.
      </div>
    );
  }

  return (
    <div
      className="game-bracket w-full overflow-x-auto py-4 hide-scrollbar"
      style={{ '--bracket-brand': brandColor } as React.CSSProperties}
    >
      <div className="flex items-stretch justify-start md:justify-center gap-8 min-w-max px-4">
        {sortedRounds.map((roundName) => {
          const roundPairs = baseRoundsMap.get(roundName) || [];
          
          return (
            <div key={roundName} className="flex flex-col" style={{ minWidth: '270px' }}>
              {/* Round Header */}
              <div className="text-center pb-2 mb-4 border-b border-[var(--border-card)]">
                <span className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider">
                  {roundName}
                </span>
                <div className="text-[10px] text-[var(--text-muted)] font-bold">
                  {roundPairs.length} CRUCES
                </div>
              </div>

              {/* Match Cards */}
              <div className="flex flex-col flex-1 relative">
                {roundPairs.map((pair, idx) => {
                  const ida = pair.ida;
                  const vuelta = pair.vuelta;
                  const isIdaVuelta = !!vuelta;

                  const hasIdaPlayed = ida.status === 'FINALIZADO' && ida.score_home !== null;
                  const hasVueltaPlayed = isIdaVuelta && vuelta.status === 'FINALIZADO' && vuelta.score_home !== null;

                  const teamA_Name = ida.home_team_name || 'Por Definir';
                  const teamA_Tag = ida.home_team_tag || 'LOC';
                  const teamA_Ida = hasIdaPlayed ? ida.score_home! : null;
                  const teamA_Vuelta = hasVueltaPlayed ? vuelta!.score_away! : null;
                  const teamA_Global = (teamA_Ida ?? 0) + (teamA_Vuelta ?? 0);

                  const teamB_Name = ida.away_team_name || 'Por Definir';
                  const teamB_Tag = ida.away_team_tag || 'VIS';
                  const teamB_Ida = hasIdaPlayed ? ida.score_away! : null;
                  const teamB_Vuelta = hasVueltaPlayed ? vuelta!.score_home! : null;
                  const teamB_Global = (teamB_Ida ?? 0) + (teamB_Vuelta ?? 0);

                  // Who won?
                  let teamAWon = false;
                  let teamBWon = false;

                  if (isIdaVuelta) {
                    if (hasIdaPlayed && hasVueltaPlayed) {
                      if (teamA_Global > teamB_Global) teamAWon = true;
                      else if (teamB_Global > teamA_Global) teamBWon = true;
                    }
                  } else {
                    if (hasIdaPlayed) {
                      if (teamA_Ida! > teamB_Ida!) teamAWon = true;
                      else if (teamB_Ida! > teamA_Ida!) teamBWon = true;
                    }
                  }

                  return (
                    <div key={ida.id || idx} className="flex-1 flex flex-col justify-center py-2 relative">
                      <div className="game-bracket-card relative z-10 flex flex-col bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl overflow-hidden transition-all">
                        
                        {/* TEAM A */}
                        <div className={`flex items-center justify-between p-2.5 border-b border-[var(--border-card)] ${teamAWon ? 'bg-[var(--accent-cyan-bg)]' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Avatar fallback={teamA_Tag} size="sm" className="ring-1 ring-[var(--border-card)]" />
                            <span className={`text-xs font-bold truncate max-w-[120px] ${teamAWon ? 'text-[var(--text-primary)]' : 'text-[var(--text-heading)]'}`}>
                              {teamA_Name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono">
                            {isIdaVuelta ? (
                              <>
                                <div className="flex items-center text-[var(--text-muted)] bg-black/20 rounded px-1" title="Resultados Ida y Vuelta">
                                  <span className="w-3.5 text-center">{hasIdaPlayed ? teamA_Ida : '-'}</span>
                                  <span className="text-[9px] opacity-50 mx-0.5">-</span>
                                  <span className="w-3.5 text-center">{hasVueltaPlayed ? teamA_Vuelta : '-'}</span>
                                </div>
                                <span className={`w-6 text-center text-sm font-black ${teamAWon ? 'text-[var(--bracket-brand)]' : 'text-[var(--text-secondary)]'}`} title="Resultado Global">
                                  {(hasIdaPlayed || hasVueltaPlayed) ? teamA_Global : '-'}
                                </span>
                              </>
                            ) : (
                              <span className={`w-6 text-center text-sm font-black ${teamAWon ? 'text-[var(--bracket-brand)]' : 'text-[var(--text-secondary)]'}`}>
                                {hasIdaPlayed ? teamA_Ida : '-'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* TEAM B */}
                        <div className={`flex items-center justify-between p-2.5 ${teamBWon ? 'bg-[var(--accent-cyan-bg)]' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Avatar fallback={teamB_Tag} size="sm" className="ring-1 ring-[var(--border-card)]" />
                            <span className={`text-xs font-bold truncate max-w-[120px] ${teamBWon ? 'text-[var(--text-primary)]' : 'text-[var(--text-heading)]'}`}>
                              {teamB_Name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono">
                            {isIdaVuelta ? (
                              <>
                                <div className="flex items-center text-[var(--text-muted)] bg-black/20 rounded px-1" title="Resultados Ida y Vuelta">
                                  <span className="w-3.5 text-center">{hasIdaPlayed ? teamB_Ida : '-'}</span>
                                  <span className="text-[9px] opacity-50 mx-0.5">-</span>
                                  <span className="w-3.5 text-center">{hasVueltaPlayed ? teamB_Vuelta : '-'}</span>
                                </div>
                                <span className={`w-6 text-center text-sm font-black ${teamBWon ? 'text-[var(--bracket-brand)]' : 'text-[var(--text-secondary)]'}`} title="Resultado Global">
                                  {(hasIdaPlayed || hasVueltaPlayed) ? teamB_Global : '-'}
                                </span>
                              </>
                            ) : (
                              <span className={`w-6 text-center text-sm font-black ${teamBWon ? 'text-[var(--bracket-brand)]' : 'text-[var(--text-secondary)]'}`}>
                                {hasIdaPlayed ? teamB_Ida : '-'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
