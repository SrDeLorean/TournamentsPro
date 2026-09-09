import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';

interface RocketLeagueStatPayload {
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  score: number;
  mvps?: number;
}

interface RocketLeagueParticipant {
  gamertag: string;
  team: 'home' | 'away';
  isMvp?: boolean;
  stats: RocketLeagueStatPayload;
}

export async function GET(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gamertag = searchParams.get('gamertag') || searchParams.get('username') || 'RocketPilot';
    const mode = searchParams.get('mode') || '3v3'; // 3v3, 2v2, 1v1
    const replayId = searchParams.get('replayId');
    const homeTeam = searchParams.get('homeTeam') || 'Blue Team';
    const awayTeam = searchParams.get('awayTeam') || 'Orange Team';

    const BALLCHASING_API_KEY = process.env.BALLCHASING_API_KEY;

    // Helper for Rocket League squad sizes: 1, 2, or 3
    const getMockRocketLeagueMatch = (squadMode: string) => {
      let squadSize = 3;
      if (squadMode === '1v1') squadSize = 1;
      else if (squadMode === '2v2') squadSize = 2;
      else squadSize = 3;

      const homeParticipants: RocketLeagueParticipant[] = [];
      const awayParticipants: RocketLeagueParticipant[] = [];

      let homeTotalGoals = 0;
      let awayTotalGoals = 0;

      // Generate Home (Blue)
      for (let i = 0; i < squadSize; i++) {
        const goals = Math.floor(Math.random() * 3) + (i === 0 ? 1 : 0);
        const assists = Math.floor(Math.random() * 2);
        const saves = Math.floor(Math.random() * 3) + 1;
        const shots = goals + Math.floor(Math.random() * 3);
        const score = goals * 100 + assists * 50 + saves * 75 + shots * 20 + Math.floor(Math.random() * 80);
        homeTotalGoals += goals;

        homeParticipants.push({
          gamertag: i === 0 ? gamertag : `${homeTeam.replace(/\s+/g, '')}_RL${i + 1}`,
          team: 'home',
          isMvp: i === 0,
          stats: {
            goals,
            assists,
            saves,
            shots,
            score,
            mvps: i === 0 ? 1 : 0,
          },
        });
      }

      // Generate Away (Orange)
      for (let i = 0; i < squadSize; i++) {
        const goals = Math.max(0, Math.floor(Math.random() * 2));
        const assists = Math.floor(Math.random() * 2);
        const saves = Math.floor(Math.random() * 3);
        const shots = goals + Math.floor(Math.random() * 2);
        const score = goals * 100 + assists * 50 + saves * 75 + shots * 20 + Math.floor(Math.random() * 50);
        awayTotalGoals += goals;

        awayParticipants.push({
          gamertag: `${awayTeam.replace(/\s+/g, '')}_RL${i + 1}`,
          team: 'away',
          isMvp: false,
          stats: {
            goals,
            assists,
            saves,
            shots,
            score,
            mvps: 0,
          },
        });
      }

      // Ensure scores aren't both 0 if possible
      if (homeTotalGoals === 0 && awayTotalGoals === 0) {
        homeTotalGoals = 3;
        awayTotalGoals = 2;
        if (homeParticipants[0]) homeParticipants[0].stats.goals = 3;
        if (awayParticipants[0]) awayParticipants[0].stats.goals = 2;
      }

      return {
        participants: [...homeParticipants, ...awayParticipants],
        matchScore: {
          team1: homeTotalGoals,
          team2: awayTotalGoals,
        },
        mode: squadMode,
        squadSize,
      };
    };

    // If Ballchasing API Key is set and replayId is given, fetch live replay
    if (BALLCHASING_API_KEY && BALLCHASING_API_KEY !== 'tu_ballchasing_key') {
      try {
        const url = replayId
          ? `https://ballchasing.com/api/replays/${replayId}`
          : `https://ballchasing.com/api/replays?player-name=${encodeURIComponent(gamertag)}&count=1`;
        const res = await fetch(url, {
          headers: { Authorization: BALLCHASING_API_KEY },
        });

        if (res.ok) {
          const data = await res.json();
          const replay = replayId ? data : data.list?.[0];
          if (replay?.blue && replay?.orange) {
            const bluePlayers = (replay.blue.players || []).map((p: any) => ({
              gamertag: p.name,
              team: 'home' as const,
              isMvp: replay.blue.goals > replay.orange.goals,
              stats: {
                goals: p.stats?.core?.goals || 0,
                assists: p.stats?.core?.assists || 0,
                saves: p.stats?.core?.saves || 0,
                shots: p.stats?.core?.shots || 0,
                score: p.stats?.core?.score || 0,
                mvps: p.stats?.core?.mvp ? 1 : 0,
              },
            }));

            const orangePlayers = (replay.orange.players || []).map((p: any) => ({
              gamertag: p.name,
              team: 'away' as const,
              isMvp: false,
              stats: {
                goals: p.stats?.core?.goals || 0,
                assists: p.stats?.core?.assists || 0,
                saves: p.stats?.core?.saves || 0,
                shots: p.stats?.core?.shots || 0,
                score: p.stats?.core?.score || 0,
                mvps: 0,
              },
            }));

            return NextResponse.json({
              success: true,
              source: 'ballchasing_official',
              participants: [...bluePlayers, ...orangePlayers],
              matchScore: {
                team1: replay.blue.goals || 0,
                team2: replay.orange.goals || 0,
              },
              mode: `${bluePlayers.length}v${bluePlayers.length}`,
              squadSize: bluePlayers.length,
            });
          }
        }
      } catch (err) {
        console.warn('Ballchasing API request failed, falling back to simulated:', err);
      }
    }

    const mockData = getMockRocketLeagueMatch(mode);
    return NextResponse.json({
      success: true,
      source: 'rocketleague_simulated',
      ...mockData,
    });
  } catch (error: any) {
    console.error('Rocket League API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con la API de Rocket League' }, { status: 500 });
  }
}
