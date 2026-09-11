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

    if (!clubId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere el Club ID oficial de EA Sports FC para consultar partidos de Pro Clubs.',
        code: 'CLUB_ID_REQUIRED',
        participants: [],
      }, { status: 400 });
    }

    try {
      const eaUrl = `https://proclubs.ea.com/api/fc/clubs/matches?clubIds=${encodeURIComponent(clubId)}&platform=common-gen5`;
      const res = await fetch(eaUrl, {
        headers: { 'User-Agent': 'TournamentsPro-EA-Service/1.0' },
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Error al consultar la API de EA Pro Clubs (${res.status}).`,
          code: 'EA_API_ERROR',
          participants: [],
        }, { status: 502 });
      }

      const matchData = await res.json();
      if (!Array.isArray(matchData) || matchData.length === 0) {
        return NextResponse.json({
          success: false,
          error: `No se encontraron partidos recientes para el club "${clubId}" en los servidores de EA Sports FC.`,
          code: 'NO_RECENT_MATCHES',
          participants: [],
        }, { status: 404 });
      }

      const latest = matchData[0];
      const clubs = latest.clubs || {};
      const clubIds = Object.keys(clubs);

      if (clubIds.length < 2) {
        return NextResponse.json({
          success: false,
          error: 'El partido registrado en EA Sports FC no contiene información completa de ambos clubes.',
          code: 'INCOMPLETE_MATCH_DATA',
          participants: [],
        }, { status: 422 });
      }

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
    } catch (err: any) {
      console.error('EA Pro Clubs API request failed:', err);
      return NextResponse.json({
        success: false,
        error: 'Error de conexión con los servidores oficiales de EA Sports FC.',
        code: 'EA_API_UNAVAILABLE',
        participants: [],
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('EA FC API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con el servicio EA FC' }, { status: 500 });
  }
}
