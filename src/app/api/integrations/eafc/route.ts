import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';

interface EafcStatPayload {
  goals: number;
  assists: number;
  passes: number;
  tackles: number;
  saves: number;
  rating: number;
  clean_sheets?: number;
}

interface EafcParticipant {
  gamertag: string;
  position?: string;
  team: 'home' | 'away';
  isMvp?: boolean;
  stats: EafcStatPayload;
}

const FC_POSITIONS = ['POR', 'LD', 'DFC', 'DFC', 'LI', 'MCD', 'MC', 'MCO', 'ED', 'EI', 'DC'];

export async function GET(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId') || searchParams.get('clubName');
    const gamertag = searchParams.get('gamertag') || 'CapitanFC';
    const mode = searchParams.get('mode') || '11v11'; // 11v11, 2v2, 1v1
    const homeTeam = searchParams.get('homeTeam') || 'Club Local';
    const awayTeam = searchParams.get('awayTeam') || 'Club Visitante';

    // Helper for squad size in FC26: 11, 2, or 1
    const getMockEafcMatch = (squadMode: string) => {
      let squadSize = 11;
      if (squadMode === '1v1') squadSize = 1;
      else if (squadMode === '2v2') squadSize = 2;
      else squadSize = 11;

      const homeParticipants: EafcParticipant[] = [];
      const awayParticipants: EafcParticipant[] = [];

      let homeGoals = 0;
      let awayGoals = 0;

      // Generate Home Team
      for (let i = 0; i < squadSize; i++) {
        const isForward = i >= squadSize - 3;
        const isGK = i === 0;
        const goals = isForward ? Math.floor(Math.random() * 2) + (i === squadSize - 1 ? 1 : 0) : 0;
        const assists = isForward || i >= squadSize - 5 ? Math.floor(Math.random() * 2) : 0;
        const passes = Math.floor(Math.random() * 25) + 12;
        const tackles = isGK ? 0 : Math.floor(Math.random() * 6) + 1;
        const saves = isGK ? Math.floor(Math.random() * 7) + 2 : 0;
        const rating = Number((Math.min(10.0, 6.0 + goals * 1.5 + assists * 1.0 + Math.random() * 1.5)).toFixed(1));

        homeGoals += goals;

        homeParticipants.push({
          gamertag: i === 0 && squadSize === 1 ? gamertag : i === squadSize - 1 ? gamertag : `${homeTeam.replace(/\s+/g, '')}_P${i + 1}`,
          position: squadSize === 11 ? FC_POSITIONS[i] || 'MC' : squadSize === 2 ? (i === 0 ? 'DC' : 'MC') : 'DC',
          team: 'home',
          isMvp: false,
          stats: {
            goals,
            assists,
            passes,
            tackles,
            saves,
            rating,
            clean_sheets: awayGoals === 0 ? 1 : 0,
          },
        });
      }

      // Generate Away Team
      for (let i = 0; i < squadSize; i++) {
        const isForward = i >= squadSize - 3;
        const isGK = i === 0;
        const goals = isForward ? Math.floor(Math.random() * 2) : 0;
        const assists = isForward ? Math.floor(Math.random() * 2) : 0;
        const passes = Math.floor(Math.random() * 22) + 10;
        const tackles = isGK ? 0 : Math.floor(Math.random() * 5) + 1;
        const saves = isGK ? Math.floor(Math.random() * 6) + 1 : 0;
        const rating = Number((Math.min(10.0, 5.8 + goals * 1.5 + assists * 1.0 + Math.random() * 1.2)).toFixed(1));

        awayGoals += goals;

        awayParticipants.push({
          gamertag: `${awayTeam.replace(/\s+/g, '')}_P${i + 1}`,
          position: squadSize === 11 ? FC_POSITIONS[i] || 'MC' : squadSize === 2 ? (i === 0 ? 'DC' : 'MC') : 'DC',
          team: 'away',
          isMvp: false,
          stats: {
            goals,
            assists,
            passes,
            tackles,
            saves,
            rating,
            clean_sheets: homeGoals === 0 ? 1 : 0,
          },
        });
      }

      // Guarantee at least one scorer if 0-0
      if (homeGoals === 0 && awayGoals === 0) {
        homeGoals = 2;
        awayGoals = 1;
        if (homeParticipants[squadSize - 1]) {
          homeParticipants[squadSize - 1].stats.goals = 2;
          homeParticipants[squadSize - 1].stats.rating = 8.8;
        }
        if (awayParticipants[squadSize - 1]) {
          awayParticipants[squadSize - 1].stats.goals = 1;
          awayParticipants[squadSize - 1].stats.rating = 7.4;
        }
      }

      // Mark best rating as MVP
      const all = [...homeParticipants, ...awayParticipants];
      const highest = all.reduce((max, p) => (p.stats.rating > max.stats.rating ? p : max), all[0]);
      if (highest) highest.isMvp = true;

      return {
        participants: [...homeParticipants, ...awayParticipants],
        matchScore: {
          team1: homeGoals,
          team2: awayGoals,
        },
        mode: squadMode,
        squadSize,
      };
    };

    // Attempt official EA Pro Clubs API if clubId is provided
    if (clubId) {
      try {
        const eaUrl = `https://proclubs.ea.com/api/fc/clubs/matches?clubIds=${encodeURIComponent(clubId)}&platform=common-gen5`;
        const res = await fetch(eaUrl, {
          headers: { 'User-Agent': 'TournamentsPro-EA-Service/1.0' },
        });
        if (res.ok) {
          const matchData = await res.json();
          if (Array.isArray(matchData) && matchData.length > 0) {
            const latest = matchData[0];
            const clubs = latest.clubs || {};
            const clubIds = Object.keys(clubs);
            if (clubIds.length >= 2) {
              const c1 = clubs[clubIds[0]];
              const c2 = clubs[clubIds[1]];

              const p1 = Object.values(latest.players?.[clubIds[0]] || {}).map((p: any) => ({
                gamertag: p.playername || 'Player',
                position: p.pos || 'MC',
                team: 'home' as const,
                stats: {
                  goals: p.goals || 0,
                  assists: p.assists || 0,
                  passes: p.passesmade || 0,
                  tackles: p.tacklesmade || 0,
                  saves: p.saves || 0,
                  rating: Number(p.rating || 6.0),
                },
              }));

              const p2 = Object.values(latest.players?.[clubIds[1]] || {}).map((p: any) => ({
                gamertag: p.playername || 'Player',
                position: p.pos || 'MC',
                team: 'away' as const,
                stats: {
                  goals: p.goals || 0,
                  assists: p.assists || 0,
                  passes: p.passesmade || 0,
                  tackles: p.tacklesmade || 0,
                  saves: p.saves || 0,
                  rating: Number(p.rating || 6.0),
                },
              }));

              return NextResponse.json({
                success: true,
                source: 'eafc_proclubs_official',
                participants: [...p1, ...p2],
                matchScore: {
                  team1: c1.goals || 0,
                  team2: c2.goals || 0,
                },
                mode: `${p1.length}v${p2.length}`,
                squadSize: Math.max(p1.length, p2.length),
              });
            }
          }
        }
      } catch (err) {
        console.warn('EA Pro Clubs API unreachable, falling back to simulated:', err);
      }
    }

    const mockData = getMockEafcMatch(mode);
    return NextResponse.json({
      success: true,
      source: 'eafc_simulated',
      ...mockData,
    });
  } catch (error: any) {
    console.error('EA FC API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con el servicio EA FC' }, { status: 500 });
  }
}
