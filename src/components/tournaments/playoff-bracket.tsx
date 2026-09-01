import React from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, GitBranch } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface PlayoffMatch {
  id: string | number;
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

interface PlayoffPair { ida: PlayoffMatch; vuelta?: PlayoffMatch }
interface PlayoffBracketProps { matches: PlayoffMatch[]; brandColor?: string; matchMode?: string }

const ROUND_ORDER_MAP: Record<string, number> = {
  treintaidosavos: 1, 'treintaidosavos de final': 1,
  dieciseisavos: 2, 'dieciseisavos de final': 2,
  octavos: 3, 'octavos de final': 3,
  cuartos: 4, 'cuartos de final': 4,
  semifinal: 5, semifinales: 5,
  'tercer puesto': 6, 'tercer lugar': 6,
  final: 7,
};

function getRoundWeight(roundName: string): number {
  const lower = roundName.toLowerCase().trim();
  for (const [key, weight] of Object.entries(ROUND_ORDER_MAP)) {
    if (lower.includes(key)) return weight;
  }
  const matchday = roundName.match(/\d+/);
  return matchday ? Number(matchday[0]) : 0;
}

function isPlaceholderTeam(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes('definir') || normalized === 'tbd' || normalized.includes('ganador') || normalized.includes('perdedor') || normalized.includes('grupo');
}

export function buildRoundPairs(matches: PlayoffMatch[]): Map<string, PlayoffPair[]> {
  const matchesByRound = new Map<string, PlayoffMatch[]>();

  matches.forEach((match) => {
    const roundName = match.round_name || 'Ronda Única';
    const isPlayoff = Object.keys(ROUND_ORDER_MAP).some((key) => roundName.toLowerCase().includes(key));
    if (!isPlayoff) return;
    const baseRound = roundName.replace(/ \((Ida|Vuelta)\)/i, '').trim();
    matchesByRound.set(baseRound, [...(matchesByRound.get(baseRound) || []), match]);
  });

  const rounds = new Map<string, PlayoffPair[]>();
  matchesByRound.forEach((roundMatches, roundName) => {
    const pairs: PlayoffPair[] = [];
    const used = new Set<string | number>();

    roundMatches.forEach((match) => {
      if (used.has(match.id)) return;
      const isTwoLegged = /\((ida|vuelta)\)/i.test(match.round_name || '');
      let ida = match;
      let vuelta: PlayoffMatch | undefined;

      if (isTwoLegged) {
        const baseId = String(match.id).replace(/-ida|-vuelta/i, '');
        const counterpart = roundMatches.find((candidate) =>
          candidate.id !== match.id && !used.has(candidate.id) &&
          (String(candidate.id).replace(/-ida|-vuelta/i, '') === baseId ||
            (candidate.home_team_name === match.away_team_name && candidate.away_team_name === match.home_team_name)),
        );
        if (/\(vuelta\)/i.test(match.round_name || '') && counterpart) {
          ida = counterpart;
          vuelta = match;
        } else {
          vuelta = counterpart;
        }
      }

      used.add(ida.id);
      if (vuelta) used.add(vuelta.id);
      pairs.push({ ida, vuelta });
    });
    rounds.set(roundName, pairs);
  });
  return rounds;
}

interface TeamRowProps {
  name: string; tag: string; logoUrl?: string | null;
  firstLeg: number | null; secondLeg: number | null; total: number | null;
  hasSecondLeg: boolean; winner: boolean;
}

function TeamRow({ name, tag, logoUrl, firstLeg, secondLeg, total, hasSecondLeg, winner }: TeamRowProps) {
  const placeholder = isPlaceholderTeam(name);
  return (
    <div className={`game-bracket-team ${winner ? 'is-winner' : ''} ${placeholder ? 'is-placeholder' : ''}`}>
      <div className="game-bracket-team-identity">
        <Avatar src={logoUrl || undefined} alt={`Logo de ${name}`} fallback={placeholder ? '?' : tag} size="sm" className="game-bracket-team-logo" />
        <span className="game-bracket-team-copy">
          <strong>{name}</strong>
          <small>{placeholder ? 'Clasificación pendiente' : tag}</small>
        </span>
      </div>
      <div className="game-bracket-score font-mono">
        {hasSecondLeg && (
          <span className="game-bracket-legs" title="Marcadores de ida y vuelta">
            <span>{firstLeg ?? '-'}</span><i>/</i><span>{secondLeg ?? '-'}</span>
          </span>
        )}
        <strong className={winner ? 'is-winner' : ''}>{total ?? '-'}</strong>
      </div>
    </div>
  );
}

function isFinished(status: string): boolean {
  return ['FINALIZADO', 'TERMINADO'].includes(status.toUpperCase());
}

export function PlayoffBracket({ matches, brandColor = 'var(--game-brand)', matchMode }: PlayoffBracketProps) {
  const rounds = buildRoundPairs(matches);
  const sortedRounds = [...rounds.keys()].sort((a, b) => getRoundWeight(a) - getRoundWeight(b));
  const hasTwoLeggedSeries = matchMode === 'IdaVuelta' || matches.some((match) => /\((ida|vuelta)\)/i.test(match.round_name));
  const totalSeries = [...rounds.values()].reduce((total, pairs) => total + pairs.length, 0);

  if (sortedRounds.length === 0) {
    return <div className="p-8 text-center text-[var(--text-muted)] border border-[var(--border-card)] rounded-2xl glass-panel">No hay cruces de playoffs generados para esta competencia aún.</div>;
  }

  return (
    <div className="game-bracket" style={{ '--bracket-brand': brandColor } as React.CSSProperties}>
      <div className="game-bracket-guide">
        <div className="game-bracket-guide-copy">
          <span><GitBranch className="size-4" /> Cuadro eliminatorio</span>
          <strong>Ruta al campeonato</strong>
          <small>{sortedRounds.length} rondas · {totalSeries} cruces</small>
        </div>
        <div className="game-bracket-guide-actions">
          <span className={`game-bracket-format ${hasTwoLeggedSeries ? 'is-two-legged' : ''}`}>
            {hasTwoLeggedSeries ? 'Ida y vuelta · marcador global' : 'Partido único'}
          </span>
          <span className="game-bracket-swipe-hint">Desliza para recorrer las rondas <ChevronRight className="size-4" /></span>
        </div>
      </div>
      <div className="game-bracket-track hide-scrollbar">
        {sortedRounds.map((roundName, roundIndex) => {
          const roundPairs = rounds.get(roundName) || [];
          return (
            <section key={roundName} className="game-bracket-round" aria-labelledby={`round-${roundIndex}`}>
              <header className="game-bracket-round-heading">
                <span className="game-bracket-round-index">{String(roundIndex + 1).padStart(2, '0')}</span>
                <div><h3 id={`round-${roundIndex}`}>{roundName}</h3><p>{roundPairs.length} {roundPairs.length === 1 ? 'cruce' : 'cruces'} · Ronda {roundIndex + 1}</p></div>
              </header>
              <div className="game-bracket-round-matches">
                {roundPairs.map(({ ida, vuelta }, index) => {
                  const idaPlayed = isFinished(ida.status) && ida.score_home !== null && ida.score_away !== null;
                  const vueltaPlayed = Boolean(vuelta && isFinished(vuelta.status) && vuelta.score_home !== null && vuelta.score_away !== null);
                  const homeFirst = idaPlayed ? Number(ida.score_home) : null;
                  const awayFirst = idaPlayed ? Number(ida.score_away) : null;
                  const homeSecond = vueltaPlayed ? Number(vuelta!.score_away) : null;
                  const awaySecond = vueltaPlayed ? Number(vuelta!.score_home) : null;
                  const homeTotal = idaPlayed || vueltaPlayed ? (homeFirst || 0) + (homeSecond || 0) : null;
                  const awayTotal = idaPlayed || vueltaPlayed ? (awayFirst || 0) + (awaySecond || 0) : null;
                  const finished = Boolean(idaPlayed && (!vuelta || vueltaPlayed));
                  return (
                    <article key={ida.id || index} className="game-bracket-match">
                      <div className="game-bracket-card">
                        <div className="game-bracket-match-meta">
                          <span>Cruce {String(index + 1).padStart(2, '0')} {vuelta ? <b>2 partidos</b> : <b>Partido único</b>}</span>
                          <span className={finished ? 'is-finished' : ''}>{finished ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}{finished ? 'Finalizado' : 'Pendiente'}</span>
                        </div>
                        <div className="game-bracket-schedule"><CalendarDays />Jornada {ida.matchday || roundIndex + 1}{ida.scheduled_time ? ` · ${ida.scheduled_time}` : ''}</div>
                        {vuelta ? <div className="game-bracket-leg-labels"><span>Ida</span><span>Vuelta</span><strong>Global</strong></div> : null}
                        <TeamRow name={ida.home_team_name || 'Por Definir'} tag={ida.home_team_tag || 'LOC'} logoUrl={ida.home_team_logo_url} firstLeg={homeFirst} secondLeg={homeSecond} total={homeTotal} hasSecondLeg={Boolean(vuelta)} winner={finished && homeTotal !== null && awayTotal !== null && homeTotal > awayTotal} />
                        <TeamRow name={ida.away_team_name || 'Por Definir'} tag={ida.away_team_tag || 'VIS'} logoUrl={ida.away_team_logo_url} firstLeg={awayFirst} secondLeg={awaySecond} total={awayTotal} hasSecondLeg={Boolean(vuelta)} winner={finished && homeTotal !== null && awayTotal !== null && awayTotal > homeTotal} />
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
