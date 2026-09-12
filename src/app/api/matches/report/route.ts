import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestMatchReporter } from '@/lib/auth-server';
import { matchReportBodySchema } from '@/lib/api-schemas';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const parsedBody = matchReportBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Datos de reporte inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const data = parsedBody.data;
    const { matchId, homeScore, awayScore, mvpName, dynamicStats, participantsStats } = data;
    const actor = await requireRequestMatchReporter(request, matchId);

    const match = await dbProvider.matches.findById(matchId);
    if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });

    const { parseBo3GameInfo, evaluateBo3Series } = await import('@/lib/bo3-series');
    const gameInfo = parseBo3GameInfo(match);
    if (gameInfo.isBo3 && gameInfo.gameNumber === 3) {
      const compId = match.competitionId || match.tournamentId;
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

    const competitionId = match.competitionId || match.tournamentId;
    const competition = competitionId
      ? await dbProvider.competitions.findById(competitionId)
      : null;
    const effectiveGameSlug = competition?.gameSlug || data.gameSlug || 'eafc26';

    const isAdminOrOrg = actor.role === 'Administrador' || actor.role === 'Organizador';

    const winnerTeamId = homeScore > awayScore
      ? (match.homeTeamId || match.teamHomeId)
      : awayScore > homeScore
        ? (match.awayTeamId || match.teamAwayId)
        : null;

    await dbProvider.matches.update(matchId, {
      reportedScoreHome: homeScore,
      reportedScoreAway: awayScore,
      ...(isAdminOrOrg
        ? {
            scoreHome: homeScore,
            scoreAway: awayScore,
            status: 'FINALIZADO',
            ...(winnerTeamId ? { winnerTeamId } : {}),
          }
        : {
            status: 'POR_REVISAR',
          }),
      reportedByUserId: actor.userId,
      ...(data.proofUrl ? { proofUrl: data.proofUrl } : {})
    });

    // Si es admin/organizador y hay ganador en partido de llaves, auto-avanzar a siguiente llave
    if (isAdminOrOrg && winnerTeamId && match.nextMatchId) {
      const winnerName = winnerTeamId === (match.homeTeamId || match.teamHomeId) ? match.homeTeamName : match.awayTeamName;
      const nextSlot = match.nextMatchSlot || 'HOME';
      const isBo3Next = /-j1$/i.test(match.nextMatchId);
      const isTwoLegNext = /-ida$/i.test(match.nextMatchId);

      try {
        if (isBo3Next) {
          const nextJ1 = match.nextMatchId;
          const nextJ2 = match.nextMatchId.replace(/-j1$/i, '-j2');
          const nextJ3 = match.nextMatchId.replace(/-j1$/i, '-j3');
          if (nextSlot === 'AWAY') {
            await dbProvider.matches.update(nextJ1, { awayTeamId: winnerTeamId, awayTeamName: winnerName, teamAwayId: winnerTeamId });
            await dbProvider.matches.update(nextJ3, { awayTeamId: winnerTeamId, awayTeamName: winnerName, teamAwayId: winnerTeamId });
            await dbProvider.matches.update(nextJ2, { homeTeamId: winnerTeamId, homeTeamName: winnerName, teamHomeId: winnerTeamId });
          } else {
            await dbProvider.matches.update(nextJ1, { homeTeamId: winnerTeamId, homeTeamName: winnerName, teamHomeId: winnerTeamId });
            await dbProvider.matches.update(nextJ3, { homeTeamId: winnerTeamId, homeTeamName: winnerName, teamHomeId: winnerTeamId });
            await dbProvider.matches.update(nextJ2, { awayTeamId: winnerTeamId, awayTeamName: winnerName, teamAwayId: winnerTeamId });
          }
        } else if (isTwoLegNext) {
          const nextIda = match.nextMatchId;
          const nextVuelta = match.nextMatchId.replace(/-ida$/i, '-vuelta');
          if (nextSlot === 'AWAY') {
            await dbProvider.matches.update(nextIda, { awayTeamId: winnerTeamId, awayTeamName: winnerName, teamAwayId: winnerTeamId });
            await dbProvider.matches.update(nextVuelta, { homeTeamId: winnerTeamId, homeTeamName: winnerName, teamHomeId: winnerTeamId });
          } else {
            await dbProvider.matches.update(nextIda, { homeTeamId: winnerTeamId, homeTeamName: winnerName, teamHomeId: winnerTeamId });
            await dbProvider.matches.update(nextVuelta, { awayTeamId: winnerTeamId, awayTeamName: winnerName, teamAwayId: winnerTeamId });
          }
        } else {
          if (nextSlot === 'AWAY') {
            await dbProvider.matches.update(match.nextMatchId, { awayTeamId: winnerTeamId, awayTeamName: winnerName, teamAwayId: winnerTeamId });
          } else {
            await dbProvider.matches.update(match.nextMatchId, { homeTeamId: winnerTeamId, homeTeamName: winnerName, teamHomeId: winnerTeamId });
          }
        }
      } catch (advErr) {
        console.warn('No se pudo auto-avanzar ganador a la siguiente llave:', advErr);
      }
    }

    // Notificar a los capitanes involucrados, excepto al propio reportante.
    try {
      const involvedTeamIds = Array.from(new Set([
        match.homeTeamId || match.teamHomeId,
        match.awayTeamId || match.teamAwayId,
      ].filter((teamId): teamId is string => Boolean(teamId))));
      const involvedTeams = await Promise.all(
        involvedTeamIds.map((teamId) => dbProvider.teams.findById(teamId)),
      );
      await Promise.all(involvedTeams.map(async (team) => {
        if (team?.captainId && team.captainId !== actor.userId) {
          await dbProvider.notifications.create({
            userId: team.captainId,
            type: 'MATCH',
            title: 'Resultado de Partido Reportado',
            description: `Se ha registrado el marcador ${match.homeTeamName || 'Local'} (${homeScore}) vs (${awayScore}) ${match.awayTeamName || 'Visitante'}.`,
            actionUrl: `/${effectiveGameSlug}/partidos`,
            isRead: false,
          });
        }
      }));
    } catch (notifErr) {
      console.warn('No se pudo emitir notificación de partido:', notifErr);
    }

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
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Match Report API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

