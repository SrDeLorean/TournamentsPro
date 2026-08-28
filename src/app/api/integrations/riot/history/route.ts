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

    // --- HELPER PARA GENERAR MOCK MIENTRAS EL API KEY SEA INVÁLIDA ---
    const getMockHistory = (slug: string) => {
      if (slug === 'lol') {
        return [
          { matchId: 'LA2_14567890', champion: 'Ahri', result: 'Victoria', kda: '12/2/8', date: 'Hace 2 horas', duration: '28:14' },
          { matchId: 'LA2_14567891', champion: 'Syndra', result: 'Derrota', kda: '4/6/5', date: 'Hace 5 horas', duration: '35:20' },
          { matchId: 'LA2_14567892', champion: 'Orianna', result: 'Victoria', kda: '8/1/14', date: 'Ayer', duration: '22:10' }
        ];
      } else if (slug === 'valorant') {
        return [
          { matchId: 'VAL_99887766', champion: 'Jett', result: 'Victoria', kda: '24/12/5', date: 'Hace 1 hora', duration: '13-8' },
          { matchId: 'VAL_99887765', champion: 'Reyna', result: 'Victoria', kda: '30/14/2', date: 'Hace 4 horas', duration: '13-11' },
          { matchId: 'VAL_99887764', champion: 'Omen', result: 'Derrota', kda: '12/18/8', date: 'Ayer', duration: '9-13' }
        ];
      }
      return [];
    };

    if (!RIOT_API_KEY) {
      return NextResponse.json({ success: true, source: 'mock_no_key', history: getMockHistory(gameSlug) });
    }

    // --- CONEXIÓN REAL A RIOT API ---
    try {
      const [gameName, tagLine] = riotId.includes('#') ? riotId.split('#') : [riotId, 'LAS'];
      
      // 1. Obtener PUUID
      const accountRes = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, {
        headers: { 'X-Riot-Token': RIOT_API_KEY }
      });
      
      if (!accountRes.ok) {
        // Fallback to mock if API key is invalid or expired (very common for dev keys)
        console.warn('Riot API PUUID fetch failed. Falling back to mock.');
        return NextResponse.json({ success: true, source: 'mock_fallback', history: getMockHistory(gameSlug) });
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
      return NextResponse.json({ success: true, source: 'mock_fallback', history: getMockHistory(gameSlug) });
    }

  } catch (error: any) {
    console.error('Riot API History Error:', error);
    return NextResponse.json({ error: 'Fallo al buscar el historial de Riot.' }, { status: 500 });
  }
}
