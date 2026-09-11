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

    const STEAM_API_KEY = process.env.STEAM_API_KEY;
    const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

    if (!STEAM_API_KEY && !FACEIT_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'La integración con CS2 (FACEIT / Steam Web API) no está configurada en las variables de entorno del servidor.',
        code: 'CS2_INTEGRATION_NOT_CONFIGURED',
        participants: [],
      }, { status: 503 });
    }

    if (!matchId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un Match ID oficial de FACEIT o Steam para sincronizar la partida de CS2.',
        code: 'MATCH_ID_REQUIRED',
        participants: [],
      }, { status: 400 });
    }

    if (FACEIT_API_KEY) {
      try {
        const faceitRes = await fetch(`https://open.faceit.com/data/v4/matches/${encodeURIComponent(matchId)}`, {
          headers: {
            Authorization: `Bearer ${FACEIT_API_KEY}`,
          },
        });
        if (faceitRes.ok) {
          const data = await faceitRes.json();
          const teams = data.teams || {};
          const faction1 = teams.faction1?.roster || [];
          const faction2 = teams.faction2?.roster || [];
          const p1 = faction1.map((p: any) => ({
            gamertag: p.nickname || p.game_player_name || 'Player',
            team: 'home' as const,
            isMvp: false,
            stats: { kills: 0, deaths: 0, assists: 0, adr: 0, hs_percent: 0, mvps: 0 },
          }));
          const p2 = faction2.map((p: any) => ({
            gamertag: p.nickname || p.game_player_name || 'Player',
            team: 'away' as const,
            isMvp: false,
            stats: { kills: 0, deaths: 0, assists: 0, adr: 0, hs_percent: 0, mvps: 0 },
          }));
          return NextResponse.json({
            success: true,
            source: 'faceit_official',
            participants: [...p1, ...p2],
            matchScore: {
              team1: data.results?.score?.faction1 ?? 0,
              team2: data.results?.score?.faction2 ?? 0,
            },
            mode,
            squadSize: Math.max(p1.length, p2.length),
            matchId,
          });
        }
      } catch (fErr) {
        console.error('FACEIT API request failed:', fErr);
      }
    }

    return NextResponse.json({
      success: false,
      error: `No se pudo obtener la información de la partida "${matchId}" desde el proveedor oficial de CS2.`,
      code: 'CS2_MATCH_NOT_FOUND',
      participants: [],
    }, { status: 404 });
  } catch (error: any) {
    console.error('CS2 API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con la API de CS2' }, { status: 500 });
  }
}
