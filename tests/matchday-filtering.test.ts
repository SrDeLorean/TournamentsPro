import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/matches/route';
import { dbProvider } from '../src/lib/db/provider';

describe('Matchday & Time Filtering', () => {
  const mockMatches = [
    {
      id: 'match-1',
      competitionId: 'comp-1',
      homeTeamId: 't1',
      awayTeamId: 't2',
      homeTeamName: 'Colo Colo',
      awayTeamName: 'Universidad de Chile',
      status: 'PROGRAMADO',
      round_name: 'JORNADA 1',
      matchday: 1,
      scheduled_time: '21:00',
      transmission_time: '21:00',
    },
    {
      id: 'match-2',
      competitionId: 'comp-1',
      homeTeamId: 't3',
      awayTeamId: 't4',
      homeTeamName: 'Universidad Católica',
      awayTeamName: 'Cobreloa',
      status: 'PROGRAMADO',
      round_name: 'JORNADA 1',
      matchday: 1,
      scheduled_time: '22:00',
      transmission_time: '22:00',
    },
    {
      id: 'match-3',
      competitionId: 'comp-1',
      homeTeamId: 't1',
      awayTeamId: 't3',
      homeTeamName: 'Colo Colo',
      awayTeamName: 'Universidad Católica',
      status: 'PROGRAMADO',
      round_name: 'JORNADA 2',
      matchday: 2,
      scheduled_time: '21:30',
      transmission_time: '21:30',
    },
    {
      id: 'match-4',
      competitionId: 'comp-1',
      homeTeamId: 't2',
      awayTeamId: 't4',
      homeTeamName: 'Universidad de Chile',
      awayTeamName: 'Cobreloa',
      status: 'PROGRAMADO',
      round_name: 'Cuartos de Final',
      matchday: null,
      scheduled_time: '23:00',
      transmission_time: '23:00',
    },
  ];

  beforeEach(() => {
    vi.spyOn(dbProvider.matches, 'findAll').mockResolvedValue(mockMatches as any);
    vi.spyOn(dbProvider.competitions, 'findAll').mockResolvedValue([
      { id: 'comp-1', name: 'Liga Clausura', gameSlug: 'eafc26' } as any,
    ]);
    vi.spyOn(dbProvider.teams, 'findAll').mockResolvedValue([
      { id: 't1', name: 'Colo Colo', tag: 'COL' } as any,
      { id: 't2', name: 'Universidad de Chile', tag: 'UCH' } as any,
      { id: 't3', name: 'Universidad Católica', tag: 'UCA' } as any,
      { id: 't4', name: 'Cobreloa', tag: 'COB' } as any,
    ]);
    vi.spyOn(dbProvider.users, 'findAll').mockResolvedValue([]);
    vi.spyOn(dbProvider.organizations, 'findAll').mockResolvedValue([]);
  });

  it('filters matches via API by matchday query param', async () => {
    const req = new Request('http://localhost:3000/api/matches?matchday=JORNADA 1');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.matches).toHaveLength(2);
    expect(data.matches.every((m: any) => m.round_name === 'JORNADA 1')).toBe(true);
  });

  it('filters matches via API by jornada query param (alias)', async () => {
    const req = new Request('http://localhost:3000/api/matches?jornada=JORNADA 2');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-3');
  });

  it('filters matches via API by playoff round name', async () => {
    const req = new Request('http://localhost:3000/api/matches?matchday=Cuartos de Final');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-4');
  });

  it('filters matches via API by time query param', async () => {
    const req = new Request('http://localhost:3000/api/matches?time=22:00');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-2');
  });

  it('filters matches via API by horario query param (alias)', async () => {
    const req = new Request('http://localhost:3000/api/matches?horario=21:00');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-1');
  });

  it('filters matches via API combining both jornada and horario', async () => {
    const req = new Request('http://localhost:3000/api/matches?jornada=JORNADA 1&horario=22:00');
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-2');
  });

  it('sorts derived availableJornadas numerically then alphabetically', () => {
    const items = [
      { groupJornada: 'JORNADA 10' },
      { groupJornada: 'JORNADA 2' },
      { groupJornada: 'JORNADA 1' },
      { groupJornada: 'Semifinales' },
      { groupJornada: 'Gran Final' },
    ];

    const uniqueJornadas = Array.from(new Set(items.map((i) => i.groupJornada.trim()))).sort((a, b) => {
      const numA = a.match(/\d+/);
      const numB = b.match(/\d+/);
      if (numA && numB) {
        const diff = parseInt(numA[0], 10) - parseInt(numB[0], 10);
        if (diff !== 0) return diff;
      } else if (numA && !numB) {
        return -1;
      } else if (!numA && numB) {
        return 1;
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });

    expect(uniqueJornadas).toEqual([
      'JORNADA 1',
      'JORNADA 2',
      'JORNADA 10',
      'Gran Final',
      'Semifinales',
    ]);
  });

  it('sorts derived availableTimes chronologically', () => {
    const items = [
      { transmissionTime: '23:30' },
      { transmissionTime: '21:00' },
      { transmissionTime: '22:45' },
      { transmissionTime: '21:30' },
    ];

    const uniqueTimes = Array.from(new Set(items.map((i) => i.transmissionTime.trim()))).sort((a, b) =>
      a.localeCompare(b)
    );

    expect(uniqueTimes).toEqual(['21:00', '21:30', '22:45', '23:30']);
  });
});
