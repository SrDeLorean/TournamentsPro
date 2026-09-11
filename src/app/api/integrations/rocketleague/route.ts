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

    if (!BALLCHASING_API_KEY || BALLCHASING_API_KEY === 'tu_ballchasing_key') {
      return NextResponse.json({
        success: false,
        error: 'La clave de integración de Rocket League (BALLCHASING_API_KEY) no está configurada en las variables de entorno del servidor.',
        code: 'BALLCHASING_API_KEY_MISSING',
        participants: [],
      }, { status: 503 });
    }

    if (!replayId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un Replay ID válido de Ballchasing para sincronizar estadísticas oficiales del encuentro.',
        code: 'REPLAY_ID_REQUIRED',
        participants: [],
      }, { status: 400 });
    }

    try {
      const res = await fetch(`https://ballchasing.com/api/replays/${replayId}`, {
        headers: {
          Authorization: BALLCHASING_API_KEY,
        },
      });

      if (res.ok) {
        const replay = await res.json();
        const bluePlayers = (replay.blue?.players || []).map((p: any) => ({
          gamertag: p.name,
          team: 'home' as const,
          isMvp: Boolean(p.stats?.core?.mvp),
          stats: {
            goals: p.stats?.core?.goals || 0,
            assists: p.stats?.core?.assists || 0,
            saves: p.stats?.core?.saves || 0,
            shots: p.stats?.core?.shots || 0,
            score: p.stats?.core?.score || 0,
            mvps: p.stats?.core?.mvp ? 1 : 0,
          },
        }));

        const orangePlayers = (replay.orange?.players || []).map((p: any) => ({
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
            team1: replay.blue?.goals || 0,
            team2: replay.orange?.goals || 0,
          },
          mode: `${bluePlayers.length}v${bluePlayers.length}`,
          squadSize: bluePlayers.length,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `No se encontró la repetición con ID "${replayId}" en Ballchasing.`,
          code: 'BALLCHASING_REPLAY_NOT_FOUND',
          participants: [],
        }, { status: res.status === 404 ? 404 : 502 });
      }
    } catch (err) {
      console.error('Ballchasing API request failed:', err);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar la repetición en la API oficial de Ballchasing.',
        code: 'BALLCHASING_SYNC_FAILED',
        participants: [],
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Rocket League API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con la API de Rocket League' }, { status: 500 });
  }
}
