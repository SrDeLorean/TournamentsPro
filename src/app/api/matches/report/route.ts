import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { getServerUserSession } from '@/lib/auth-server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { matchId, homeScore, awayScore, mvpName, dynamicStats, participantsStats, competition_id } = data;

    if (!matchId) return NextResponse.json({ error: 'Match ID requerido' }, { status: 400 });

    const match = await dbProvider.matches.findById(matchId);
    if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });

    await dbProvider.matches.update(matchId, {
      reportedScoreHome: homeScore,
      reportedScoreAway: awayScore,
      status: 'POR_REVISAR'
    });

    // Insertar TODAS las stats de los participantes si provienen de Riot API
    if (participantsStats && Array.isArray(participantsStats)) {
      for (const p of participantsStats) {
        if (!p.riotId) continue;
        const cleanGamertag = p.riotId.split('#')[0]; // Simplify lookup
        
        // Find user by gamertag or create a temporary association
        let user = await dbProvider.users.findByGamertag(cleanGamertag);
        if (!user) {
          const users = await dbProvider.users.findAll({ where: { name: cleanGamertag } });
          if (users.length > 0) user = users[0];
        }
        const playerId = user ? user.id : `temp-${cleanGamertag}`;
        
        const statsId = `st-${randomUUID().substring(0, 8)}`;
        await dbProvider.matches.addPlayerStat(statsId, matchId, playerId, competition_id || match.competitionId || '', JSON.stringify(p.stats));
      }
    } 
    // Fallback: Si solo reportaron el MVP manual
    else if (mvpName && dynamicStats) {
      const cleanGamertag = mvpName.replace('@', '').trim();
      let user = await dbProvider.users.findByGamertag(cleanGamertag);
      if (!user) {
        const users = await dbProvider.users.findAll({ where: { name: cleanGamertag } });
        if (users.length > 0) user = users[0];
      }
      const mvpId = user ? user.id : `temp-${cleanGamertag}`;

      const statsId = `st-${randomUUID().substring(0, 8)}`;
      await dbProvider.matches.addPlayerStat(statsId, matchId, mvpId, competition_id || match.competitionId || '', JSON.stringify(dynamicStats));
    }

    return NextResponse.json({ success: true, message: 'Reporte enviado a revisión' });
  } catch (error: any) {
    console.error('Match Report API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

