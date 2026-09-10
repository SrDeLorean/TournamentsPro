'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  CheckCircle2,
  X,
  Upload,
  Camera,
  AlertCircle,
  Sparkles,
  Users,
  Trophy,
  RefreshCw,
  Plus,
  Trash2,
  Star,
  Gamepad2,
  Search,
  Layers,
  Calculator,
} from 'lucide-react';

interface MatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number | null;
    awayScore?: number | null;
    gameSlug: string;
    tournamentName: string;
    competitionId?: string;
  };
}

export interface StatFieldDefinition {
  key: string;
  label: string;
  shortLabel?: string;
  type: 'number' | 'text';
  placeholder?: string;
  isPrimaryScore?: boolean;
}

export interface PlayerRosterEntry {
  id: string;
  gamertag: string;
  position?: string;
  isMvp: boolean;
  stats: Record<string, number | string>;
}

// Default stat schemas for each game slug
const DEFAULT_GAME_STAT_SCHEMAS: Record<string, StatFieldDefinition[]> = {
  eafc26: [
    { key: 'goals', label: 'Goles', shortLabel: 'G', type: 'number', isPrimaryScore: true },
    { key: 'assists', label: 'Asistencias', shortLabel: 'A', type: 'number' },
    { key: 'passes', label: 'Pases', shortLabel: 'P', type: 'number' },
    { key: 'tackles', label: 'Entradas', shortLabel: 'E', type: 'number' },
    { key: 'saves', label: 'Atajadas / VI', shortLabel: 'ATA', type: 'number' },
    { key: 'rating', label: 'Calificación (1-10)', shortLabel: 'RTG', type: 'number', placeholder: '7.5' },
  ],
  rocketleague: [
    { key: 'goals', label: 'Goles', shortLabel: 'G', type: 'number', isPrimaryScore: true },
    { key: 'assists', label: 'Asistencias', shortLabel: 'A', type: 'number' },
    { key: 'saves', label: 'Salvadas', shortLabel: 'S', type: 'number' },
    { key: 'shots', label: 'Tiros', shortLabel: 'T', type: 'number' },
    { key: 'score', label: 'Puntos', shortLabel: 'PTS', type: 'number' },
  ],
  fortnite: [
    { key: 'eliminations', label: 'Eliminaciones', shortLabel: 'K', type: 'number', isPrimaryScore: true },
    { key: 'damage_dealt', label: 'Daño Realizado', shortLabel: 'DMG', type: 'number' },
    { key: 'placement', label: 'Top Rank', shortLabel: 'POS', type: 'number' },
    { key: 'revives', label: 'Revividos', shortLabel: 'REV', type: 'number' },
    { key: 'accuracy', label: 'Precisión %', shortLabel: 'ACC', type: 'number' },
  ],
  valorant: [
    { key: 'kills', label: 'Kills', shortLabel: 'K', type: 'number', isPrimaryScore: true },
    { key: 'deaths', label: 'Deaths', shortLabel: 'D', type: 'number' },
    { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'number' },
    { key: 'acs', label: 'ACS (Combat Score)', shortLabel: 'ACS', type: 'number' },
    { key: 'hs_percent', label: 'HS %', shortLabel: 'HS%', type: 'number' },
  ],
  csgo: [
    { key: 'kills', label: 'Kills', shortLabel: 'K', type: 'number', isPrimaryScore: true },
    { key: 'deaths', label: 'Deaths', shortLabel: 'D', type: 'number' },
    { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'number' },
    { key: 'adr', label: 'ADR', shortLabel: 'ADR', type: 'number' },
    { key: 'hs_percent', label: 'HS %', shortLabel: 'HS%', type: 'number' },
    { key: 'mvps', label: 'MVPs Ronda', shortLabel: 'MVP', type: 'number' },
  ],
  lol: [
    { key: 'kills', label: 'Kills', shortLabel: 'K', type: 'number', isPrimaryScore: true },
    { key: 'deaths', label: 'Deaths', shortLabel: 'D', type: 'number' },
    { key: 'assists', label: 'Assists', shortLabel: 'A', type: 'number' },
    { key: 'cs', label: 'CS (Minions)', shortLabel: 'CS', type: 'number' },
    { key: 'gold', label: 'Oro Obtenido', shortLabel: 'ORO', type: 'number' },
    { key: 'damage', label: 'Daño a Campeones', shortLabel: 'DMG', type: 'number' },
  ],
};

// Mode configuration per game slug
interface GameModePreset {
  id: string;
  name: string;
  squadSize: number;
  description: string;
}

function getModePresetsForGame(gameSlug: string): GameModePreset[] {
  switch (gameSlug) {
    case 'eafc26':
      return [
        { id: '11v11', name: '11v11 Clubes Pro', squadSize: 11, description: '11 jugadores por equipo (plantilla completa)' },
        { id: '2v2', name: '2v2 Co-Op', squadSize: 2, description: '2 jugadores por equipo' },
        { id: '1v1', name: '1v1 Individual', squadSize: 1, description: '1 jugador por equipo' },
      ];
    case 'rocketleague':
      return [
        { id: '3v3', name: '3v3 Estándar', squadSize: 3, description: '3 jugadores por equipo' },
        { id: '2v2', name: '2v2 Parejas', squadSize: 2, description: '2 jugadores por equipo' },
        { id: '1v1', name: '1v1 Solo', squadSize: 1, description: '1 jugador por equipo' },
      ];
    case 'fortnite':
      return [
        { id: 'escuadrones', name: 'Escuadrones (4v4)', squadSize: 4, description: '4 jugadores por escuadra' },
        { id: 'trios', name: 'Tríos (3v3)', squadSize: 3, description: '3 jugadores por escuadra' },
        { id: 'duos', name: 'Dúos (2v2)', squadSize: 2, description: '2 jugadores por escuadra' },
        { id: 'solo', name: 'Solo (1v1)', squadSize: 1, description: '1 jugador por escuadra' },
      ];
    case 'valorant':
    case 'csgo':
    case 'lol':
    default:
      return [
        { id: '5v5', name: '5v5 Estándar', squadSize: 5, description: '5 jugadores por equipo' },
        { id: '2v2', name: '2v2 Táctico', squadSize: 2, description: '2 jugadores por equipo' },
        { id: '1v1', name: '1v1 Duelo', squadSize: 1, description: '1 jugador por equipo' },
      ];
  }
}

export function MatchReportModal({ isOpen, onClose, match }: MatchReportModalProps) {
  const router = useRouter();
  const currentMatch = useMemo(() => match || {
    id: 'm-103',
    homeTeam: 'SAN LORENZO ESP',
    awayTeam: 'SANGRE NUEVA FC',
    gameSlug: 'eafc26',
    tournamentName: 'Liga Élite Pro 11v11 2026',
  }, [match]);

  const gameCatalog = GAMES_CATALOG[currentMatch.gameSlug] || GAMES_CATALOG['eafc26'];
  const modePresets = useMemo(() => getModePresetsForGame(currentMatch.gameSlug), [currentMatch.gameSlug]);

  // Selected mode & squad size state
  const [selectedModeId, setSelectedModeId] = useState<string>(modePresets[0]?.id || 'std');
  const [squadSize, setSquadSize] = useState<number>(modePresets[0]?.squadSize || 5);

  // Scores
  const [homeScore, setHomeScore] = useState<number>(typeof match?.homeScore === 'number' ? match.homeScore : 0);
  const [awayScore, setAwayScore] = useState<number>(typeof match?.awayScore === 'number' ? match.awayScore : 0);

  // Evidence Screenshot
  const [evidencePreview, setEvidencePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active Team Tab for lineup editing: 'home' | 'away'
  const [activeRosterTab, setActiveRosterTab] = useState<'home' | 'away'>('home');

  // Stats Schema
  const [statSchema, setStatSchema] = useState<StatFieldDefinition[]>(
    DEFAULT_GAME_STAT_SCHEMAS[currentMatch.gameSlug] || DEFAULT_GAME_STAT_SCHEMAS.eafc26
  );

  // Home & Away Rosters
  const [homePlayers, setHomePlayers] = useState<PlayerRosterEntry[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerRosterEntry[]>([]);

  // External API Integration States
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiHistoryItems, setApiHistoryItems] = useState<any[]>([]);
  const [apiSuccessMessage, setApiSuccessMessage] = useState('');

  // Generate blank players helper
  const createBlankPlayer = useCallback((team: 'home' | 'away', index: number, schema: StatFieldDefinition[]): PlayerRosterEntry => {
    const teamName = team === 'home' ? currentMatch.homeTeam : currentMatch.awayTeam;
    const cleanPrefix = teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    const positions = gameCatalog?.positions || [];
    const initialStats: Record<string, number | string> = {};
    schema.forEach((s) => {
      initialStats[s.key] = s.type === 'number' ? 0 : '';
    });

    return {
      id: `${team}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`,
      gamertag: `${cleanPrefix}_P${index + 1}`,
      position: positions[index % positions.length] || 'JUG',
      isMvp: false,
      stats: initialStats,
    };
  }, [currentMatch.homeTeam, currentMatch.awayTeam, gameCatalog?.positions]);

  // Synchronize squad size with presets when gameSlug changes
  useEffect(() => {
    const presets = getModePresetsForGame(currentMatch.gameSlug);
    const initialPreset = presets[0];
    setSelectedModeId(initialPreset?.id || 'std');
    setSquadSize(initialPreset?.squadSize || 5);

    const schema = DEFAULT_GAME_STAT_SCHEMAS[currentMatch.gameSlug] || DEFAULT_GAME_STAT_SCHEMAS.eafc26;
    setStatSchema(schema);

    // Populate initial rosters
    const count = initialPreset?.squadSize || 5;
    const initialHome: PlayerRosterEntry[] = [];
    const initialAway: PlayerRosterEntry[] = [];
    for (let i = 0; i < count; i++) {
      initialHome.push(createBlankPlayer('home', i, schema));
      initialAway.push(createBlankPlayer('away', i, schema));
    }
    setHomePlayers(initialHome);
    setAwayPlayers(initialAway);

    // Initialize scores if passed from match
    setHomeScore(typeof match?.homeScore === 'number' ? match.homeScore : 0);
    setAwayScore(typeof match?.awayScore === 'number' ? match.awayScore : 0);

    // Reset API states
    setApiSearchQuery('');
    setApiHistoryItems([]);
    setApiSuccessMessage('');
    setErrorMsg('');
    setSuccessNotice('');
  }, [currentMatch.gameSlug, currentMatch.id, match?.homeScore, match?.awayScore, createBlankPlayer]);

  // Adjust player array size when squadSize changes
  const adjustRosterSize = useCallback((newSize: number) => {
    const safeSize = Math.max(1, Math.min(newSize, 11));
    setSquadSize(safeSize);

    const schema = statSchema;

    setHomePlayers((prev) => {
      if (prev.length === safeSize) return prev;
      if (prev.length < safeSize) {
        const next = [...prev];
        for (let i = prev.length; i < safeSize; i++) {
          next.push(createBlankPlayer('home', i, schema));
        }
        return next;
      }
      return prev.slice(0, safeSize);
    });

    setAwayPlayers((prev) => {
      if (prev.length === safeSize) return prev;
      if (prev.length < safeSize) {
        const next = [...prev];
        for (let i = prev.length; i < safeSize; i++) {
          next.push(createBlankPlayer('away', i, schema));
        }
        return next;
      }
      return prev.slice(0, safeSize);
    });
  }, [statSchema, createBlankPlayer]);

  const handleSelectModePreset = (preset: GameModePreset) => {
    setSelectedModeId(preset.id);
    adjustRosterSize(preset.squadSize);
  };

  // Player field update helpers
  const handleUpdatePlayerGamertag = (team: 'home' | 'away', index: number, value: string) => {
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], gamertag: value };
      return next;
    });
  };

  const handleUpdatePlayerStat = (team: 'home' | 'away', index: number, statKey: string, value: string) => {
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    const numVal = value === '' ? 0 : Number(value);
    setter((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          stats: {
            ...next[index].stats,
            [statKey]: isNaN(numVal) ? value : numVal,
          },
        };
      }
      return next;
    });
  };

  const handleSetMvp = (team: 'home' | 'away', index: number) => {
    setHomePlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        isMvp: team === 'home' && i === index,
      }))
    );
    setAwayPlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        isMvp: team === 'away' && i === index,
      }))
    );
  };

  // Auto-calculate score from players' primary stat (e.g. goals or kills)
  const handleAutoCalculateScore = () => {
    const primaryField = statSchema.find((s) => s.isPrimaryScore) || statSchema[0];
    if (!primaryField) return;

    let hTotal = 0;
    homePlayers.forEach((p) => {
      hTotal += Number(p.stats[primaryField.key]) || 0;
    });

    let aTotal = 0;
    awayPlayers.forEach((p) => {
      aTotal += Number(p.stats[primaryField.key]) || 0;
    });

    setHomeScore(hTotal);
    setAwayScore(aTotal);
    setSuccessNotice(`Marcador autocalculado según ${primaryField.label}: ${hTotal} - ${aTotal}`);
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  // File evidence handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  // API Integration: Search external data
  const handleSearchExternalApi = async () => {
    if (!apiSearchQuery.trim()) {
      setErrorMsg('Ingresa un Gamertag, Riot ID, Epic Username o Replay ID');
      return;
    }

    setIsApiLoading(true);
    setErrorMsg('');
    setApiSuccessMessage('');
    setApiHistoryItems([]);

    try {
      const slug = currentMatch.gameSlug;

      if (slug === 'lol' || slug === 'valorant') {
        const res = await fetch(`/api/integrations/riot/history?riotId=${encodeURIComponent(apiSearchQuery)}&gameSlug=${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con Riot Games');
        setApiHistoryItems(data.history || []);
        setApiSuccessMessage(`Se encontraron ${data.history?.length || 0} partidas recientes en Riot Games`);
      } else if (slug === 'fortnite') {
        const res = await fetch(
          `/api/integrations/fortnite?username=${encodeURIComponent(apiSearchQuery)}&mode=${selectedModeId}&homeTeam=${encodeURIComponent(currentMatch.homeTeam)}&awayTeam=${encodeURIComponent(currentMatch.awayTeam)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con Fortnite API');
        applyImportedData(data);
      } else if (slug === 'rocketleague') {
        const res = await fetch(
          `/api/integrations/rocketleague?gamertag=${encodeURIComponent(apiSearchQuery)}&mode=${selectedModeId}&homeTeam=${encodeURIComponent(currentMatch.homeTeam)}&awayTeam=${encodeURIComponent(currentMatch.awayTeam)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con Rocket League API');
        applyImportedData(data);
      } else if (slug === 'eafc26') {
        const res = await fetch(
          `/api/integrations/eafc?clubId=${encodeURIComponent(apiSearchQuery)}&mode=${selectedModeId}&homeTeam=${encodeURIComponent(currentMatch.homeTeam)}&awayTeam=${encodeURIComponent(currentMatch.awayTeam)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con EA Sports FC');
        applyImportedData(data);
      } else if (slug === 'csgo') {
        const res = await fetch(
          `/api/integrations/cs2?gamertag=${encodeURIComponent(apiSearchQuery)}&mode=${selectedModeId}&homeTeam=${encodeURIComponent(currentMatch.homeTeam)}&awayTeam=${encodeURIComponent(currentMatch.awayTeam)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al conectar con CS2 API');
        applyImportedData(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error durante la consulta a la API');
    } finally {
      setIsApiLoading(false);
    }
  };

  // Select Riot Match from history list
  const handleSelectRiotMatchItem = async (matchId: string) => {
    setIsApiLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/integrations/riot/match?matchId=${matchId}&gameSlug=${currentMatch.gameSlug}&gamertag=${encodeURIComponent(apiSearchQuery.split('#')[0])}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al sincronizar partida de Riot');
      applyImportedData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al importar partida');
    } finally {
      setIsApiLoading(false);
    }
  };

  // Helper to apply imported data to rosters and scores
  const applyImportedData = (data: any) => {
    if (data.matchScore) {
      setHomeScore(Number(data.matchScore.team1) || 0);
      setAwayScore(Number(data.matchScore.team2) || 0);
    }

    if (data.participants && Array.isArray(data.participants)) {
      const rawParticipants = data.participants;
      const homeRaw = rawParticipants.filter((p: any) => p.team === 'home' || p.teamId === 100 || p.teamId === 'Blue');
      const awayRaw = rawParticipants.filter((p: any) => p.team === 'away' || p.teamId === 200 || p.teamId === 'Red');

      const resolvedHome = homeRaw.length > 0 ? homeRaw : rawParticipants.slice(0, Math.ceil(rawParticipants.length / 2));
      const resolvedAway = awayRaw.length > 0 ? awayRaw : rawParticipants.slice(Math.ceil(rawParticipants.length / 2));

      const newSize = Math.max(resolvedHome.length, resolvedAway.length, 1);
      setSquadSize(newSize);

      setHomePlayers(
        resolvedHome.map((p: any, i: number) => ({
          id: `imp-h-${i}`,
          gamertag: p.gamertag || p.riotId || `${currentMatch.homeTeam}_P${i + 1}`,
          position: p.position || undefined,
          isMvp: !!p.isMvp,
          stats: { ...(p.stats || {}) },
        }))
      );

      setAwayPlayers(
        resolvedAway.map((p: any, i: number) => ({
          id: `imp-a-${i}`,
          gamertag: p.gamertag || p.riotId || `${currentMatch.awayTeam}_P${i + 1}`,
          position: p.position || undefined,
          isMvp: !!p.isMvp,
          stats: { ...(p.stats || {}) },
        }))
      );

      setApiSuccessMessage(`¡${rawParticipants.length} jugadores y estadísticas sincronizados correctamente!`);
      setSuccessNotice(`Datos oficiales cargados desde la API (${rawParticipants.length} atletas)`);
    }
  };

  // Submit Match Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (homeScore < 0 || awayScore < 0) {
      setErrorMsg('Ingresa un marcador válido');
      return;
    }

    // Identify MVP
    const allPlayers = [
      ...homePlayers.map((p) => ({ ...p, team: 'home' })),
      ...awayPlayers.map((p) => ({ ...p, team: 'away' })),
    ];
    const mvpPlayer = allPlayers.find((p) => p.isMvp) || allPlayers[0];

    setIsSubmitting(true);

    try {
      const participantsStatsPayload = allPlayers.map((p) => ({
        gamertag: p.gamertag,
        team: p.team,
        position: p.position,
        isMvp: p.isMvp,
        stats: p.stats,
      }));

      const payload = {
        matchId: currentMatch.id,
        competition_id: currentMatch.competitionId,
        gameSlug: currentMatch.gameSlug,
        homeScore,
        awayScore,
        mvpName: mvpPlayer ? mvpPlayer.gamertag : '',
        participantsStats: participantsStatsPayload,
        proofUrl: evidencePreview || undefined,
      };

      const res = await fetch('/api/matches/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el reporte');
      }

      setIsSubmitting(false);
      setSuccessNotice(`¡Marcador ${homeScore} - ${awayScore} guardado correctamente! Actualizando...`);
      router.refresh();
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar el reporte de partido');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Reportar resultado del partido"
      size="xl"
      showCloseButton={false}
      closeDisabled={isSubmitting}
      className="p-5 sm:p-7 space-y-6 font-[family-name:var(--font-active)] max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl border-2 bg-[var(--app-accent-soft)] border-[var(--app-accent)]">
            {gameCatalog?.icon || '🎮'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black uppercase text-[var(--text-heading)]">
                Ficha Oficial de Partido
              </h3>
              <Badge variant="neutral" className="text-[10px] font-black uppercase tracking-wider">
                {gameCatalog?.name || currentMatch.gameSlug}
              </Badge>
              <Badge variant="emerald" className="text-[10px]">
                Capitán Matchday
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              {currentMatch.tournamentName} • {currentMatch.homeTeam} vs {currentMatch.awayTeam}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Success Notice */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-[var(--app-positive-soft)] border border-[var(--app-positive)] text-[var(--app-positive)] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--app-positive)] flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[var(--app-danger-soft)] border border-[var(--app-danger)] text-[var(--app-danger)] text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--app-danger)] flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitReport} className="space-y-6">
        {/* Format & Squad Size Selector */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--app-accent)]" />
              <span className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider">
                Formato y Jugadores por Equipo ({currentMatch.gameSlug.toUpperCase()})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
              <span>Plantilla:</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] font-black">
                {squadSize} vs {squadSize}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {modePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectModePreset(preset)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  selectedModeId === preset.id
                    ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-sm'
                    : 'border-[var(--border-card)] bg-[var(--bg-main)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[var(--text-heading)]">{preset.name}</span>
                  <span className="text-[10px] font-bold text-[var(--app-accent)]">{preset.squadSize}P</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">{preset.description}</p>
              </button>
            ))}
          </div>

          {/* Stepper to adjust squad size */}
          <div className="flex items-center justify-between pt-1 border-t border-[var(--border-card)] text-xs">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              ¿Ajustar número de cupos en la planilla?
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={squadSize <= 1}
                onClick={() => adjustRosterSize(squadSize - 1)}
              >
                -
              </Button>
              <span className="w-8 text-center font-black text-xs text-[var(--text-heading)]">{squadSize}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={squadSize >= 11}
                onClick={() => adjustRosterSize(squadSize + 1)}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* API Integration Hub */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--app-warning)] animate-pulse" />
              <span className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider">
                Integración API Oficial ({gameCatalog?.name || currentMatch.gameSlug})
              </span>
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Autocompletado de Alineación y Estadísticas
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            {currentMatch.gameSlug === 'lol' || currentMatch.gameSlug === 'valorant'
              ? 'Busca por Riot ID (ej. Faker#SKT o TenZ#VCT) para autocompletar la alineación y marcador.'
              : currentMatch.gameSlug === 'fortnite'
              ? 'Conecta con la API de Fortnite ingresando el Gamertag de Epic Games para importar la partida.'
              : currentMatch.gameSlug === 'rocketleague'
              ? 'Busca repetición oficial en Ballchasing o ingresa el Gamertag del piloto para cargar las estadísticas del partido.'
              : currentMatch.gameSlug === 'eafc26'
              ? 'Ingresa el Club ID de EA Sports FC Pro Clubs o Gamertag del capitán para sincronizar la ficha oficial.'
              : 'Ingresa el ID de la partida o Gamertag del capitán para importar las estadísticas oficiales.'}
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={
                  currentMatch.gameSlug === 'lol' || currentMatch.gameSlug === 'valorant'
                    ? 'Riot ID (ej. Jugador#LAS)'
                    : currentMatch.gameSlug === 'fortnite'
                    ? 'Epic Games Nickname (ej. Ninja)'
                    : currentMatch.gameSlug === 'rocketleague'
                    ? 'Gamertag o Replay ID (Ballchasing)'
                    : currentMatch.gameSlug === 'eafc26'
                    ? 'EA Club ID o Gamertag Capitán'
                    : 'Gamertag o Match ID'
                }
                value={apiSearchQuery}
                onChange={(e) => setApiSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] font-[family-name:var(--font-active)] outline-none focus:border-[var(--app-accent)]"
              />
            </div>
            <Button
              type="button"
              onClick={handleSearchExternalApi}
              disabled={isApiLoading}
              className="bg-[var(--app-accent)] hover:bg-[var(--app-accent)] text-[var(--accent-contrast)] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              {isApiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Buscar y Cargar API</span>
                </>
              )}
            </Button>
          </div>

          {apiSuccessMessage && (
            <div className="p-2.5 rounded-lg bg-[var(--app-positive-soft)] border border-[var(--app-positive)] text-[var(--app-positive)] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{apiSuccessMessage}</span>
            </div>
          )}

          {/* Riot Match History Dropdown/List */}
          {apiHistoryItems.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block">
                Partidas Recientes Encontradas (Haz clic para importar)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {apiHistoryItems.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectRiotMatchItem(h.matchId)}
                    className="p-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] hover:border-[var(--app-accent)] cursor-pointer transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          h.result === 'Victoria'
                            ? 'bg-[var(--app-positive-soft)] text-[var(--app-positive)]'
                            : 'bg-[var(--app-danger-soft)] text-[var(--app-danger)]'
                        }`}
                      >
                        {h.result}
                      </span>
                      <span className="font-bold text-[var(--text-heading)]">{h.champion}</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">KDA: {h.kda} • {h.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Match Final Score */}
        <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[var(--app-accent)] block tracking-wider">
              Marcador Final del Encuentro
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoCalculateScore}
              className="text-[11px] h-7 px-2.5 flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Autocalcular Marcador</span>
            </Button>
          </div>

          <div className="grid grid-cols-5 items-center gap-2 text-center">
            {/* Home Team */}
            <div className="col-span-2 space-y-2">
              <span className="text-xs font-black text-[var(--text-heading)] uppercase block truncate">
                {currentMatch.homeTeam}
              </span>
              <input
                type="number"
                min="0"
                max="99"
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                className="w-16 h-14 mx-auto text-center rounded-xl bg-[var(--bg-card)] border-2 border-[var(--app-accent)] font-black text-2xl text-[var(--app-accent)] focus:outline-none"
              />
            </div>

            <span className="text-xl font-black text-[var(--text-muted)] font-[family-name:var(--font-active)]">
              VS
            </span>

            {/* Away Team */}
            <div className="col-span-2 space-y-2">
              <span className="text-xs font-black text-[var(--text-heading)] uppercase block truncate">
                {currentMatch.awayTeam}
              </span>
              <input
                type="number"
                min="0"
                max="99"
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                className="w-16 h-14 mx-auto text-center rounded-xl bg-[var(--bg-card)] border-2 border-[var(--app-accent-2)] font-black text-2xl text-[var(--app-accent-2)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Lineup Rosters by Team */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRosterTab('home')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
                  activeRosterTab === 'home'
                    ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                }`}
              >
                <span>🏠 {currentMatch.homeTeam}</span>
                <span className="px-1.5 py-0.2 rounded bg-[var(--app-surface-2)] text-[var(--text-heading)] text-[10px]">
                  {homePlayers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRosterTab('away')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
                  activeRosterTab === 'away'
                    ? 'bg-[var(--app-accent-2)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                }`}
              >
                <span>✈️ {currentMatch.awayTeam}</span>
                <span className="px-1.5 py-0.2 rounded bg-[var(--app-surface-2)] text-[var(--text-heading)] text-[10px]">
                  {awayPlayers.length}
                </span>
              </button>
            </div>

            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Haz clic en ⭐ para seleccionar al MVP del encuentro
            </span>
          </div>

          {/* Active Roster Table */}
          {(() => {
            const currentRoster = activeRosterTab === 'home' ? homePlayers : awayPlayers;
            const teamName = activeRosterTab === 'home' ? currentMatch.homeTeam : currentMatch.awayTeam;

            return (
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[var(--text-heading)]">
                    Alineación Oficial: {teamName} ({currentRoster.length} Atletas)
                  </span>
                  <Badge variant="neutral" className="text-[10px]">
                    {currentMatch.gameSlug.toUpperCase()}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-card)] text-[10px] font-black uppercase text-[var(--text-muted)]">
                        <th className="py-2 px-2 w-10 text-center">MVP</th>
                        <th className="py-2 px-2 w-10 text-center">#</th>
                        <th className="py-2 px-2 min-w-[140px]">Gamertag / Jugador</th>
                        {statSchema.map((field) => (
                          <th key={field.key} className="py-2 px-2 text-center min-w-[64px]">
                            {field.shortLabel || field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)]">
                      {currentRoster.map((player, idx) => (
                        <tr
                          key={player.id}
                          className={`hover:bg-[var(--bg-card-hover)] transition-colors ${
                            player.isMvp ? 'bg-[var(--app-warning-soft)]/40' : ''
                          }`}
                        >
                          {/* MVP Star */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleSetMvp(activeRosterTab, idx)}
                              title="Marcar como MVP del partido"
                              className={`p-1 rounded-lg transition-transform active:scale-95 ${
                                player.isMvp
                                  ? 'text-[var(--app-warning)] scale-110'
                                  : 'text-[var(--text-muted)] hover:text-[var(--app-warning)]'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${player.isMvp ? 'fill-[var(--app-warning)]' : ''}`} />
                            </button>
                          </td>

                          {/* Index / Position */}
                          <td className="py-2 px-2 text-center text-[10px] font-bold text-[var(--text-muted)]">
                            {player.position || idx + 1}
                          </td>

                          {/* Gamertag Input */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={player.gamertag}
                              onChange={(e) =>
                                handleUpdatePlayerGamertag(activeRosterTab, idx, e.target.value)
                              }
                              placeholder="Gamertag"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--app-accent)]"
                            />
                          </td>

                          {/* Stats Inputs */}
                          {statSchema.map((field) => (
                            <td key={field.key} className="py-2 px-2 text-center">
                              <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                min={field.type === 'number' ? 0 : undefined}
                                value={player.stats[field.key] ?? 0}
                                onChange={(e) =>
                                  handleUpdatePlayerStat(activeRosterTab, idx, field.key, e.target.value)
                                }
                                placeholder={field.placeholder || '0'}
                                className={`w-14 px-1.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] text-center text-xs outline-none focus:border-[var(--app-accent)] ${
                                  field.isPrimaryScore
                                    ? 'font-black text-[var(--app-accent)]'
                                    : 'font-bold text-[var(--text-primary)]'
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Evidence Upload */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-[var(--text-heading)] block flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[var(--app-positive)]" />
            Adjuntar Captura de Pantalla / Evidencia Oficial
          </label>

          <div className="p-4 rounded-2xl border-2 border-dashed border-[var(--border-card)] bg-[var(--bg-main)] text-center hover:border-[var(--app-positive)] transition-colors">
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
                  <Image
                    src={evidencePreview}
                    alt="Evidencia"
                    width={512}
                    height={128}
                    unoptimized
                    className="h-32 w-auto mx-auto rounded-xl object-cover border border-[var(--app-positive)]"
                  />
                  <span className="text-[11px] text-[var(--app-positive)] font-bold block">
                    ✓ Captura cargada correctamente
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Haz clic para subir la captura del juego
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">
                    Soporta PNG, JPG o WEBP (Captura de marcador final o tabla de estadísticas)
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-card)] pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            disabled={isSubmitting}
            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-black text-xs uppercase bg-[var(--app-positive)] hover:bg-[var(--app-positive)] text-[var(--accent-contrast)] px-6 py-2.5 rounded-xl shadow-lg"
          >
            {isSubmitting ? 'Enviando Ficha...' : 'Enviar Reporte y Ficha Oficial'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
