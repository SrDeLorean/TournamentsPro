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

    const { parseBo3GameInfo, evaluateBo3Series } = await import('@/lib/bo3-series');
    const gameInfo = parseBo3GameInfo(match);
    if (gameInfo.isBo3 && gameInfo.gameNumber === 3) {
      const compId = match.competitionId || competition_id;
      if (compId) {
        const compMatches = await dbProvider.matches.findByCompetition(compId);
        const seriesMatches = compMatches.filter((m) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId);
        const evalResult = evaluateBo3Series(seriesMatches);
        if (evalResult.isGame3Locked || evalResult.isDefined) {
          return NextResponse.json({
            error: `La serie al Mejor de 3 ya fue definida (${evalResult.scoreSummary}). El Juego 3 no es requerido y no puede ser reportado.`,
          }, { status: 400 });
        }
      }
    }

    const effectiveGameSlug = data.gameSlug || (match as any).gameSlug || (match as any).game_slug || 'eafc26';

    await dbProvider.matches.update(matchId, {
      reportedScoreHome: homeScore,
      reportedScoreAway: awayScore,
      status: 'POR_REVISAR',
      reportedByUserId: session.userId,
      ...(data.proofUrl ? { proofUrl: data.proofUrl } : {})
    });

    // Insertar stats de los participantes (Riot, EA FC, Rocket League, Fortnite, CS2 o manual)
    if (participantsStats && Array.isArray(participantsStats)) {
      for (const p of participantsStats) {
        const rawGamertag = p.gamertag || p.riotId || p.name || p.playerName;
        if (!rawGamertag) continue;
        const cleanGamertag = String(rawGamertag).split('#')[0].replace('@', '').trim();
        
        // Find user by gamertag or create a temporary association
        let user = await dbProvider.users.findByGamertag(cleanGamertag);
        if (!user) {
          const users = await dbProvider.users.findAll({ where: { name: cleanGamertag } });
          if (users.length > 0) user = users[0];
        }
        const playerId = user ? user.id : `temp-${cleanGamertag}`;
        
        const statsId = `st-${randomUUID().substring(0, 8)}`;
        const statsPayload = {
          ...(p.stats || {}),
          team: p.team || (p.teamId === 100 || p.teamId === 'Blue' ? 'home' : 'away'),
          isMvp: !!(p.isMvp || (mvpName && cleanGamertag.toLowerCase() === mvpName.toLowerCase())),
          position: p.position || undefined,
        };

        await dbProvider.matches.addPlayerStat(
          statsId,
          matchId,
          playerId,
          effectiveGameSlug,
          JSON.stringify(statsPayload)
        );
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
      await dbProvider.matches.addPlayerStat(
        statsId,
        matchId,
        mvpId,
        effectiveGameSlug,
        JSON.stringify({ ...dynamicStats, isMvp: true })
      );
    }

    return NextResponse.json({ success: true, message: 'Reporte enviado a revisión' });
  } catch (error: any) {
    console.error('Match Report API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

