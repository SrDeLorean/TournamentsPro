import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const riotId = searchParams.get('riotId');
    const gameSlug = searchParams.get('gameSlug');

    if (!riotId || !gameSlug) {
      return NextResponse.json({ error: 'Riot ID y Game Slug son requeridos' }, { status: 400 });
    }

    const RIOT_API_KEY = process.env.RIOT_API_KEY;

    if (!RIOT_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'La clave de integración de Riot Games (RIOT_API_KEY) no está configurada en las variables de entorno del servidor.',
        code: 'RIOT_API_KEY_MISSING',
        history: [],
      }, { status: 503 });
    }

    // --- CONEXIÓN REAL A RIOT API ---
    try {
      const [gameName, tagLine] = riotId.includes('#') ? riotId.split('#') : [riotId, 'LAS'];
      
      // 1. Obtener PUUID
      const accountRes = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, {
        headers: { 'X-Riot-Token': RIOT_API_KEY }
      });
      
      if (!accountRes.ok) {
        return NextResponse.json({
          success: false,
          error: `No se pudo encontrar la cuenta de Riot para "${riotId}". Verifica el Riot ID y TagLine.`,
          code: 'RIOT_ACCOUNT_NOT_FOUND',
          history: [],
        }, { status: accountRes.status === 404 ? 404 : 502 });
      }

      const accountData = await accountRes.json();
      const puuid = accountData.puuid;

      let history = [];

      // 2. Obtener historial dependiendo del juego
      if (gameSlug === 'lol') {
        // Match IDs
        const matchlistRes = await fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=3`, {
          headers: { 'X-Riot-Token': RIOT_API_KEY }
        });
        if (!matchlistRes.ok) throw new Error('Error fetching matchlist');
        const matchIds = await matchlistRes.json();

        // 3. Obtener detalles de cada partida para la previsualización
        for (const mId of matchIds) {
          const mRes = await fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/${mId}`, {
             headers: { 'X-Riot-Token': RIOT_API_KEY }
          });
          if (!mRes.ok) continue;
          const mData = await mRes.json();
          const p = mData.info.participants.find((p: any) => p.puuid === puuid) || mData.info.participants[0];
          history.push({
            matchId: mId,
            champion: p.championName,
            result: p.win ? 'Victoria' : 'Derrota',
            kda: `${p.kills}/${p.deaths}/${p.assists}`,
            date: new Date(mData.info.gameCreation).toLocaleDateString(),
            duration: `${Math.floor(mData.info.gameDuration / 60)}:${(mData.info.gameDuration % 60).toString().padStart(2, '0')}`
          });
        }
      } else if (gameSlug === 'valorant') {
        const matchlistRes = await fetch(`https://na.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`, {
          headers: { 'X-Riot-Token': RIOT_API_KEY }
        });
        if (!matchlistRes.ok) throw new Error('Error fetching matchlist');
        const matchData = await matchlistRes.json();
        const matchIds = matchData.history.slice(0, 3).map((h: any) => h.matchId);

        for (const mId of matchIds) {
          const mRes = await fetch(`https://na.api.riotgames.com/val/match/v1/matches/${mId}`, {
             headers: { 'X-Riot-Token': RIOT_API_KEY }
          });
          if (!mRes.ok) continue;
          const mData = await mRes.json();
          const p = mData.players.find((p: any) => p.puuid === puuid) || mData.players[0];
          history.push({
            matchId: mId,
            champion: p.characterId, // Needs character mapping ideally
            result: 'Completada', // Teams mapping is complex in Val API
            kda: `${p.stats.kills}/${p.stats.deaths}/${p.stats.assists}`,
            date: new Date(mData.matchInfo.gameStartMillis).toLocaleDateString(),
            duration: `${Math.floor(mData.matchInfo.gameLengthMillis / 60000)}m`
          });
        }
      }

      return NextResponse.json({ success: true, source: 'riot_official', history });

    } catch (apiErr) {
      console.error('Riot Real API error', apiErr);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar el historial de partidas en la API oficial de Riot Games.',
        code: 'RIOT_HISTORY_FETCH_FAILED',
        history: [],
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('Riot API History Error:', error);
    return NextResponse.json({ error: 'Fallo al buscar el historial de Riot.' }, { status: 500 });
  }
}
