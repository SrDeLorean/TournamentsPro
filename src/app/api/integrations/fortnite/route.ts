import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';

interface FortniteStatPayload {
  eliminations: number;
  damage_dealt: number;
  placement: number;
  revives: number;
  accuracy: number;
}

interface FortniteParticipant {
  gamertag: string;
  team: 'home' | 'away';
  isMvp?: boolean;
  stats: FortniteStatPayload;
}

export async function GET(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || searchParams.get('gamertag') || 'PlayerOne';
    const accountType = searchParams.get('accountType') || 'epic';
    const mode = searchParams.get('mode') || 'escuadrones'; // escuadrones, trios, duos, solo
    const homeTeam = searchParams.get('homeTeam') || 'Escuadra Alpha';
    const awayTeam = searchParams.get('awayTeam') || 'Escuadra Beta';

    const FORTNITE_API_KEY = process.env.FORTNITE_API_KEY;



    if (!FORTNITE_API_KEY || FORTNITE_API_KEY === 'tu_fortnite_api_key') {
      return NextResponse.json({
        success: false,
        error: 'La clave de integración de Fortnite (FORTNITE_API_KEY) no está configurada en las variables de entorno del servidor.',
        code: 'FORTNITE_API_KEY_MISSING',
        participants: [],
      }, { status: 503 });
    }

    try {
      const apiUrl = `https://fortnite-api.com/v2/stats/br/v2?name=${encodeURIComponent(username)}&accountType=${encodeURIComponent(accountType)}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: FORTNITE_API_KEY,
        },
      });

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `No se encontró la cuenta de Fortnite "${username}" o el perfil es privado.`,
          code: 'FORTNITE_PLAYER_NOT_FOUND',
          participants: [],
        }, { status: response.status === 404 ? 404 : 502 });
      }

      const apiData = await response.json();
      const stats = apiData.data?.stats?.all;
      const modeStats = stats?.[mode === 'solo' ? 'solo' : mode === 'duos' ? 'duo' : mode === 'trios' ? 'trio' : 'squad'] || stats?.overall;

      return NextResponse.json({
        success: true,
        source: 'fortnite_api_live',
        account: apiData.data?.account,
        stats: modeStats || stats,
        participants: [
          {
            gamertag: username,
            team: 'home',
            isMvp: true,
            stats: {
              eliminations: modeStats?.kills || modeStats?.killsPerMatch ? Math.round(modeStats.killsPerMatch || modeStats.kills) : 0,
              damage_dealt: modeStats?.score || 0,
              placement: modeStats?.top1 || 1,
              revives: modeStats?.revives || 0,
              accuracy: Math.round(modeStats?.winRate || 0),
            },
          },
        ],
      });
    } catch (externalErr) {
      console.error('Fortnite external API call failed:', externalErr);
      return NextResponse.json({
        success: false,
        error: 'Error al comunicarse con la API de Fortnite.',
        code: 'FORTNITE_SYNC_FAILED',
        participants: [],
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Fortnite API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con la API de Fortnite' }, { status: 500 });
  }
}
