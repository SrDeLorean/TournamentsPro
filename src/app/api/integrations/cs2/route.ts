import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';

interface Cs2StatPayload {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  hs_percent: number;
  mvps: number;
}

interface Cs2Participant {
  gamertag: string;
  team: 'home' | 'away';
  isMvp?: boolean;
  stats: Cs2StatPayload;
}

export async function GET(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gamertag = searchParams.get('gamertag') || 'CS_Capitan';
    const mode = searchParams.get('mode') || '5v5'; // 5v5, 2v2, 1v1
    const matchId = searchParams.get('matchId');
    const homeTeam = searchParams.get('homeTeam') || 'Terrorists / Local';
    const awayTeam = searchParams.get('awayTeam') || 'CTs / Visitante';

    // Helper for CS2 squad sizes (5 or fewer)
    const getMockCs2Match = (squadMode: string) => {
      let squadSize = 5;
      if (squadMode === '1v1') squadSize = 1;
      else if (squadMode === '2v2') squadSize = 2;
      else squadSize = 5;

      const homeParticipants: Cs2Participant[] = [];
      const awayParticipants: Cs2Participant[] = [];

      // Realistic MR12 / MR15 round scores
      const homeRounds = 13;
      const awayRounds = 10;

      for (let i = 0; i < squadSize; i++) {
        const k = Math.floor(Math.random() * 12) + (i === 0 ? 18 : 10);
        const d = Math.floor(Math.random() * 8) + 11;
        const a = Math.floor(Math.random() * 6) + 2;
        const adr = Math.floor(Math.random() * 35) + 70;
        const hs = Math.floor(Math.random() * 25) + 30;
        const mvps = i === 0 ? 4 : Math.floor(Math.random() * 2);

        homeParticipants.push({
          gamertag: i === 0 ? gamertag : `${homeTeam.replace(/\s+/g, '')}_CS${i + 1}`,
          team: 'home',
          isMvp: i === 0,
          stats: {
            kills: k,
            deaths: d,
            assists: a,
            adr,
            hs_percent: hs,
            mvps,
          },
        });
      }

      for (let i = 0; i < squadSize; i++) {
        const k = Math.floor(Math.random() * 10) + 9;
        const d = Math.floor(Math.random() * 7) + 13;
        const a = Math.floor(Math.random() * 5) + 1;
        const adr = Math.floor(Math.random() * 30) + 65;
        const hs = Math.floor(Math.random() * 25) + 28;
        const mvps = Math.floor(Math.random() * 2);

        awayParticipants.push({
          gamertag: `${awayTeam.replace(/\s+/g, '')}_CS${i + 1}`,
          team: 'away',
          isMvp: false,
          stats: {
            kills: k,
            deaths: d,
            assists: a,
            adr,
            hs_percent: hs,
            mvps,
          },
        });
      }

      return {
        participants: [...homeParticipants, ...awayParticipants],
        matchScore: {
          team1: homeRounds,
          team2: awayRounds,
        },
        mode: squadMode,
        squadSize,
        matchId: matchId || `CS2-MATCH-${Date.now().toString().slice(-6)}`,
      };
    };

    const mockData = getMockCs2Match(mode);
    return NextResponse.json({
      success: true,
      source: 'cs2_faceit_simulated',
      ...mockData,
    });
  } catch (error: any) {
    console.error('CS2 API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con la API de CS2' }, { status: 500 });
  }
}
