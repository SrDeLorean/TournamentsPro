import React from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, GitBranch, Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

export interface PlayoffMatch {
  id: string | number;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_team_name: string;
  home_team_tag: string;
  home_team_logo_url?: string | null;
  away_team_name: string;
  away_team_tag: string;
  away_team_logo_url?: string | null;
  score_home: number | null;
  score_away: number | null;
  status: string;
  round_name: string;
  matchday?: number;
  scheduled_time?: string | null;
}

export interface PlayoffPair {
  ida: PlayoffMatch;
  vuelta?: PlayoffMatch;
  game3?: PlayoffMatch;
  isBo3?: boolean;
}

export interface PlayoffBracketProps {
  matches: PlayoffMatch[];
  brandColor?: string;
  matchMode?: string;
  onAdvanceWinner?: (matchId: string, winnerId: string, winnerName: string) => void;
  isPending?: boolean;
  hideGuide?: boolean;
}

const ROUND_ORDER_MAP: Record<string, number> = {
  treintaidosavos: 1, '32avos': 1,
  dieciseisavos: 2, '16avos': 2,
  octavos: 3,
  cuartos: 4,
  semifinal: 5, semifinales: 5,
  'tercer puesto': 6, 'tercer lugar': 6,
  final: 7,
};

export function normalizeRoundName(rawName: string): { canonicalName: string; weight: number } {
  const lower = (rawName || '').toLowerCase().trim();

  if (lower.includes('treintaidosavos') || lower.includes('32avos')) {
    return { canonicalName: '32avos de Final', weight: 1 };
  }
  if (lower.includes('dieciseisavos') || lower.includes('16avos')) {
    return { canonicalName: '16avos de Final', weight: 2 };
  }
  if (lower.includes('octavos')) {
    return { canonicalName: 'Octavos de Final', weight: 3 };
  }
  if (lower.includes('cuartos')) {
    return { canonicalName: 'Cuartos de Final', weight: 4 };
  }
  if (lower.includes('semifinal')) {
    return { canonicalName: 'Semifinales', weight: 5 };
  }
  if (lower.includes('tercer')) {
    return { canonicalName: 'Tercer Lugar', weight: 6 };
  }
  if (lower.includes('final')) {
    return { canonicalName: 'Gran Final', weight: 7 };
  }

  const matchday = lower.match(/\d+/);
  const num = matchday ? Number(matchday[0]) : 1;
  return { canonicalName: rawName || `Ronda ${num}`, weight: num };
}

function getRoundWeight(roundName: string): number {
  return normalizeRoundName(roundName).weight;
}

function isPlaceholderTeam(name: string): boolean {
  const normalized = (name || '').toLowerCase().trim();
  return !name || normalized.includes('definir') || normalized === 'tbd' || normalized.includes('ganador') || normalized.includes('perdedor') || normalized.includes('grupo') || normalized.includes('bye');
}

function isByeTeam(name: string): boolean {
  const normalized = (name || '').toLowerCase().trim();
  return normalized.includes('bye') || normalized.includes('descanso');
}

export function buildRoundPairs(matches: PlayoffMatch[]): Map<string, PlayoffPair[]> {
  const matchesByRound = new Map<string, PlayoffMatch[]>();

  matches.forEach((match) => {
    const rawRound = match.round_name || 'Ronda Única';
    const isPlayoff =
      /treintaidosavos|32avos|dieciseisavos|16avos|octavos|cuartos|semifinal|tercer|final|llave|playoff|eliminator/i.test(rawRound) ||
      Object.keys(ROUND_ORDER_MAP).some((key) => rawRound.toLowerCase().includes(key));
    if (!isPlayoff) return;

    const { canonicalName } = normalizeRoundName(rawRound);
    matchesByRound.set(canonicalName, [...(matchesByRound.get(canonicalName) || []), match]);
  });

  const rounds = new Map<string, PlayoffPair[]>();
  matchesByRound.forEach((roundMatches, roundName) => {
    const sortedRoundMatches = [...roundMatches].sort((a, b) => {
      const extractM = (id: string | number) => {
        const match = String(id).match(/-m(\d+)/i);
        return match ? Number(match[1]) : 999;
      };
      const mA = extractM(a.id);
      const mB = extractM(b.id);
      if (mA !== mB) return mA - mB;
      return String(a.id).localeCompare(String(b.id));
    });

    const pairs: PlayoffPair[] = [];
    const used = new Set<string | number>();

    sortedRoundMatches.forEach((match) => {
      if (used.has(match.id)) return;

      const isBo3 = /-j[123]$/i.test(String(match.id)) || /\(juego\s*[123]\)/i.test(match.round_name || '');
      const isTwoLegged = !isBo3 && /\((ida|vuelta)\)/i.test(match.round_name || '');

      if (isBo3) {
        const baseId = String(match.id).replace(/-j[123]$/i, '');
        const seriesMatches = roundMatches.filter(
          (candidate) => !used.has(candidate.id) && String(candidate.id).replace(/-j[123]$/i, '') === baseId,
        );

        let j1 = seriesMatches.find((m) => /-j1$/i.test(String(m.id)) || /\(juego\s*1\)/i.test(m.round_name || '')) || seriesMatches[0];
        let j2 = seriesMatches.find((m) => /-j2$/i.test(String(m.id)) || /\(juego\s*2\)/i.test(m.round_name || '')) || seriesMatches[1];
        let j3 = seriesMatches.find((m) => /-j3$/i.test(String(m.id)) || /\(juego\s*3\)/i.test(m.round_name || '')) || seriesMatches[2];

        if (j1) used.add(j1.id);
        if (j2) used.add(j2.id);
        if (j3) used.add(j3.id);

        pairs.push({ ida: j1 || match, vuelta: j2, game3: j3, isBo3: true });
      } else if (isTwoLegged) {
        const baseId = String(match.id).replace(/-ida|-vuelta/i, '');
        const counterpart = roundMatches.find((candidate) =>
          candidate.id !== match.id && !used.has(candidate.id) &&
          (String(candidate.id).replace(/-ida|-vuelta/i, '') === baseId ||
            (candidate.home_team_name === match.away_team_name && candidate.away_team_name === match.home_team_name)),
        );
        let ida = match;
        let vuelta: PlayoffMatch | undefined;
        if (/\(vuelta\)/i.test(match.round_name || '') && counterpart) {
          ida = counterpart;
          vuelta = match;
        } else {
          vuelta = counterpart;
        }

        used.add(ida.id);
        if (vuelta) used.add(vuelta.id);
        pairs.push({ ida, vuelta, isBo3: false });
      } else {
        used.add(match.id);
        pairs.push({ ida: match, isBo3: false });
      }
    });
    rounds.set(roundName, pairs);
  });
  return rounds;
}

interface TeamRowProps {
  name: string;
  tag: string;
  logoUrl?: string | null;
  firstLeg: number | null;
  secondLeg: number | null;
  thirdLeg?: number | null;
  total: number | null;
  hasSecondLeg: boolean;
  isBo3?: boolean;
  winner: boolean;
}

function TeamRow({ name, tag, logoUrl, firstLeg, secondLeg, thirdLeg, total, hasSecondLeg, isBo3, winner }: TeamRowProps) {
  const placeholder = isPlaceholderTeam(name);
  const isBye = isByeTeam(name);

  return (
    <div className={`game-bracket-team ${winner ? 'is-winner' : ''} ${placeholder ? 'is-placeholder' : ''}`}>
      <div className="game-bracket-team-identity">
        <Avatar src={logoUrl || undefined} alt={`Logo de ${name}`} fallback={isBye ? 'BYE' : placeholder ? '?' : tag} size="sm" className="game-bracket-team-logo" />
        <span className="game-bracket-team-copy">
          <strong className={isBye ? 'text-[var(--app-accent-2)] italic' : ''}>{name}</strong>
          <small>{isBye ? 'Pase directo' : placeholder ? 'Clasificación pendiente' : tag}</small>
        </span>
      </div>
      <div className="game-bracket-score font-[family-name:var(--font-active)]">
        {isBo3 ? (
          <span className="game-bracket-legs" title="Marcadores de cada juego (J1 / J2 / J3)">
            <span>{firstLeg ?? '-'}</span><i>/</i>
            <span>{secondLeg ?? '-'}</span><i>/</i>
            <span>{thirdLeg ?? '-'}</span>
          </span>
        ) : hasSecondLeg && (
          <span className="game-bracket-legs" title="Marcadores de ida y vuelta">
            <span>{firstLeg ?? '-'}</span><i>/</i><span>{secondLeg ?? '-'}</span>
          </span>
        )}
        <strong className={winner ? 'is-winner' : ''}>{isBye ? '—' : (total ?? '-')}</strong>
      </div>
    </div>
  );
}

function isFinished(status: string): boolean {
  const s = (status || '').toUpperCase().trim();
  return ['FINALIZADO', 'TERMINADO', 'COMPLETADO', 'JUGADO', 'VERIFICADO'].includes(s);
}

export function PlayoffBracket({
  matches,
  brandColor = 'var(--game-brand)',
  matchMode,
  onAdvanceWinner,
  isPending,
  hideGuide = false,
}: PlayoffBracketProps) {
  const rounds = buildRoundPairs(matches);
  const sortedRounds = [...rounds.keys()].sort((a, b) => getRoundWeight(a) - getRoundWeight(b));
  const isBo3SeriesFormat = matchMode === 'MejorDe3' || matches.some((match) => /\(juego\s*[123]\)/i.test(match.round_name) || /-j[123]$/i.test(String(match.id)));
  const hasTwoLeggedSeries = !isBo3SeriesFormat && (matchMode === 'IdaVuelta' || matches.some((match) => /\((ida|vuelta)\)/i.test(match.round_name)));
  const totalSeries = [...rounds.values()].reduce((total, pairs) => total + pairs.length, 0);

  if (sortedRounds.length === 0) {
    return <div className="p-8 text-center text-[var(--text-muted)] border border-[var(--border-card)] rounded-2xl glass-panel">No hay cruces de playoffs generados para esta competencia aún.</div>;
  }

  return (
    <div className="game-bracket" style={{ '--bracket-brand': brandColor } as React.CSSProperties}>
      {!hideGuide && (
        <div className="game-bracket-guide">
          <div className="game-bracket-guide-copy">
            <span><GitBranch className="size-4" /> Cuadro eliminatorio</span>
            <strong>Ruta al campeonato</strong>
            <small>{sortedRounds.length} rondas · {totalSeries} cruces</small>
          </div>
          <div className="game-bracket-guide-actions">
            <span className={`game-bracket-format ${isBo3SeriesFormat ? 'is-bo3' : hasTwoLeggedSeries ? 'is-two-legged' : ''}`}>
              {isBo3SeriesFormat ? '🎮 Mejor de 3 (Bo3) · al ganador de 2' : hasTwoLeggedSeries ? 'Ida y vuelta · marcador global' : 'Partido único'}
            </span>
            <span className="game-bracket-swipe-hint">Desliza para recorrer las rondas <ChevronRight className="size-4" /></span>
          </div>
        </div>
      )}
      <div className="game-bracket-track hide-scrollbar">
        {sortedRounds.map((roundName, roundIndex) => {
          const roundPairs = rounds.get(roundName) || [];
          const isGrandFinal = roundName === 'Gran Final' || roundIndex === sortedRounds.length - 1;

          return (
            <section key={roundName} className="game-bracket-round" aria-labelledby={`round-${roundIndex}`}>
              <header className="game-bracket-round-heading">
                <span className="game-bracket-round-index">
                  {isGrandFinal ? <Trophy className="size-3.5 text-[var(--app-warning)]" /> : String(roundIndex + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 id={`round-${roundIndex}`}>{roundName}</h3>
                  <p>{roundPairs.length} {roundPairs.length === 1 ? 'cruce' : 'cruces'} · Ronda {roundIndex + 1}</p>
                </div>
              </header>
              <div className="game-bracket-round-matches">
                {roundPairs.map(({ ida, vuelta, game3, isBo3 }, index) => {
                  if (isBo3) {
                    const j1Played = isFinished(ida.status) && ida.score_home !== null && ida.score_away !== null;
                    const homeJ1 = j1Played ? Number(ida.score_home) : null;
                    const awayJ1 = j1Played ? Number(ida.score_away) : null;
                    const homeWonJ1 = j1Played && homeJ1! > awayJ1!;
                    const awayWonJ1 = j1Played && awayJ1! > homeJ1!;

                    const j2Played = Boolean(vuelta && isFinished(vuelta.status) && vuelta.score_home !== null && vuelta.score_away !== null);
                    const homeJ2 = j2Played ? Number(vuelta!.score_away) : null;
                    const awayJ2 = j2Played ? Number(vuelta!.score_home) : null;
                    const homeWonJ2 = j2Played && homeJ2! > awayJ2!;
                    const awayWonJ2 = j2Played && awayJ2! > homeJ2!;

                    const isGame3Cancelled = game3?.status === 'CANCELADO' || (homeWonJ1 && homeWonJ2) || (awayWonJ1 && awayWonJ2);
                    const j3Played = Boolean(game3 && isFinished(game3.status) && game3.score_home !== null && game3.score_away !== null);
                    const homeJ3 = j3Played ? Number(game3!.score_home) : null;
                    const awayJ3 = j3Played ? Number(game3!.score_away) : null;
                    const homeWonJ3 = j3Played && homeJ3! > awayJ3!;
                    const awayWonJ3 = j3Played && awayJ3! > homeJ3!;

                    const homeIsBye = isByeTeam(ida.home_team_name);
                    const awayIsBye = isByeTeam(ida.away_team_name);

                    const homeSeriesWins = (homeWonJ1 ? 1 : 0) + (homeWonJ2 ? 1 : 0) + (homeWonJ3 ? 1 : 0);
                    const awaySeriesWins = (awayWonJ1 ? 1 : 0) + (awayWonJ2 ? 1 : 0) + (awayWonJ3 ? 1 : 0);
                    const finished = homeSeriesWins >= 2 || awaySeriesWins >= 2 || (j1Played && j2Played && (j3Played || isGame3Cancelled)) || homeIsBye || awayIsBye;
                    const homeWinner = homeSeriesWins >= 2 || (finished && homeSeriesWins > awaySeriesWins) || (finished && awayIsBye && !homeIsBye);
                    const awayWinner = awaySeriesWins >= 2 || (finished && awaySeriesWins > homeSeriesWins) || (finished && homeIsBye && !awayIsBye);

                    const canAdvance = onAdvanceWinner && !finished && ida.home_team_id && ida.away_team_id && !isPlaceholderTeam(ida.home_team_name) && !isPlaceholderTeam(ida.away_team_name);

                    return (
                      <article key={ida.id || index} className="game-bracket-match">
                        <div className="game-bracket-card">
                          <div className="game-bracket-match-meta">
                            <span>Cruce {String(index + 1).padStart(2, '0')} <b>Mejor de 3 (Bo3)</b></span>
                            <span className={finished ? 'is-finished' : ''}>
                              {finished ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
                              {finished ? (isGame3Cancelled && (homeSeriesWins === 2 || awaySeriesWins === 2) ? 'Serie 2-0' : 'Finalizado') : 'Pendiente'}
                            </span>
                          </div>
                          <div className="game-bracket-schedule">
                            <CalendarDays />Jornada {ida.matchday || roundIndex + 1}{ida.scheduled_time ? ` · ${ida.scheduled_time}` : ''}
                          </div>
                          <div className="game-bracket-leg-labels">
                            <span>J1</span><span>J2</span><span>J3</span><strong>Serie</strong>
                          </div>
                          <TeamRow
                            name={ida.home_team_name || 'Por Definir'}
                            tag={ida.home_team_tag || 'LOC'}
                            logoUrl={ida.home_team_logo_url}
                            firstLeg={homeJ1}
                            secondLeg={homeJ2}
                            thirdLeg={homeJ3}
                            total={homeSeriesWins}
                            hasSecondLeg={true}
                            isBo3={true}
                            winner={homeWinner}
                          />
                          <TeamRow
                            name={ida.away_team_name || 'Por Definir'}
                            tag={ida.away_team_tag || 'VIS'}
                            logoUrl={ida.away_team_logo_url}
                            firstLeg={awayJ1}
                            secondLeg={awayJ2}
                            thirdLeg={awayJ3}
                            total={awaySeriesWins}
                            hasSecondLeg={true}
                            isBo3={true}
                            winner={awayWinner}
                          />
                          {canAdvance && (
                            <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => onAdvanceWinner(String(ida.id), String(ida.home_team_id), ida.home_team_name)}
                                className="flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase bg-[var(--app-accent-2-soft)] text-[var(--app-accent-2)] border border-[var(--app-accent-2)]/30 hover:bg-[var(--app-accent-2)] hover:text-white transition-all text-center truncate disabled:opacity-50"
                              >
                                Gana {ida.home_team_name.split(' ')[0]}
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => onAdvanceWinner(String(ida.id), String(ida.away_team_id), ida.away_team_name)}
                                className="flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent)]/30 hover:bg-[var(--app-accent)] hover:text-white transition-all text-center truncate disabled:opacity-50"
                              >
                                Gana {ida.away_team_name.split(' ')[0]}
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }

                  const homeIsBye = isByeTeam(ida.home_team_name);
                  const awayIsBye = isByeTeam(ida.away_team_name);

                  const idaPlayed = (isFinished(ida.status) && ida.score_home !== null && ida.score_away !== null) || homeIsBye || awayIsBye;
                  const vueltaPlayed = Boolean(vuelta && isFinished(vuelta.status) && vuelta.score_home !== null && vuelta.score_away !== null);
                  const homeFirst = idaPlayed ? Number(ida.score_home) : null;
                  const awayFirst = idaPlayed ? Number(ida.score_away) : null;
                  const homeSecond = vueltaPlayed ? Number(vuelta!.score_away) : null;
                  const awaySecond = vueltaPlayed ? Number(vuelta!.score_home) : null;
                  const homeTotal = idaPlayed || vueltaPlayed ? (homeFirst || 0) + (homeSecond || 0) : null;
                  const awayTotal = idaPlayed || vueltaPlayed ? (awayFirst || 0) + (awaySecond || 0) : null;
                  const finished = Boolean((idaPlayed && (!vuelta || vueltaPlayed)) || homeIsBye || awayIsBye);
                  const homeWinner = (finished && homeTotal !== null && awayTotal !== null && homeTotal > awayTotal) || (finished && awayIsBye && !homeIsBye);
                  const awayWinner = (finished && homeTotal !== null && awayTotal !== null && awayTotal > homeTotal) || (finished && homeIsBye && !awayIsBye);

                  const canAdvance = onAdvanceWinner && !finished && ida.home_team_id && ida.away_team_id && !isPlaceholderTeam(ida.home_team_name) && !isPlaceholderTeam(ida.away_team_name);

                  return (
                    <article key={ida.id || index} className="game-bracket-match">
                      <div className="game-bracket-card">
                        <div className="game-bracket-match-meta">
                          <span>Cruce {String(index + 1).padStart(2, '0')} {vuelta ? <b>2 partidos</b> : <b>Partido único</b>}</span>
                          <span className={finished ? 'is-finished' : ''}>
                            {finished ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
                            {finished ? 'Finalizado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="game-bracket-schedule">
                          <CalendarDays />Jornada {ida.matchday || roundIndex + 1}{ida.scheduled_time ? ` · ${ida.scheduled_time}` : ''}
                        </div>
                        {vuelta ? (
                          <div className="game-bracket-leg-labels">
                            <span>Ida</span><span>Vuelta</span><strong>Global</strong>
                          </div>
                        ) : null}
                        <TeamRow
                          name={ida.home_team_name || 'Por Definir'}
                          tag={ida.home_team_tag || 'LOC'}
                          logoUrl={ida.home_team_logo_url}
                          firstLeg={homeFirst}
                          secondLeg={homeSecond}
                          total={homeTotal}
                          hasSecondLeg={Boolean(vuelta)}
                          winner={homeWinner}
                        />
                        <TeamRow
                          name={ida.away_team_name || 'Por Definir'}
                          tag={ida.away_team_tag || 'VIS'}
                          logoUrl={ida.away_team_logo_url}
                          firstLeg={awayFirst}
                          secondLeg={awaySecond}
                          total={awayTotal}
                          hasSecondLeg={Boolean(vuelta)}
                          winner={awayWinner}
                        />
                        {canAdvance && (
                          <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => onAdvanceWinner(String(ida.id), String(ida.home_team_id), ida.home_team_name)}
                              className="flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase bg-[var(--app-accent-2-soft)] text-[var(--app-accent-2)] border border-[var(--app-accent-2)]/30 hover:bg-[var(--app-accent-2)] hover:text-white transition-all text-center truncate disabled:opacity-50"
                            >
                              Gana {ida.home_team_name.split(' ')[0]}
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => onAdvanceWinner(String(ida.id), String(ida.away_team_id), ida.away_team_name)}
                              className="flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent)]/30 hover:bg-[var(--app-accent)] hover:text-white transition-all text-center truncate disabled:opacity-50"
                            >
                              Gana {ida.away_team_name.split(' ')[0]}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
