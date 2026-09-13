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
    const isOfficialApi = Boolean(data.reportMode === 'API' || data.isApiVerified);

    const winnerTeamId = homeScore > awayScore
      ? (match.homeTeamId || match.teamHomeId)
      : awayScore > homeScore
        ? (match.awayTeamId || match.teamAwayId)
        : null;

    // Verificar si el equipo rival ya había reportado
    const hasPreviousReportFromRival =
      match.reportedByUserId &&
      match.reportedByUserId !== actor.userId &&
      match.reportedScoreHome !== null &&
      match.reportedScoreHome !== undefined &&
      match.reportedScoreAway !== null &&
      match.reportedScoreAway !== undefined;

    const scoresMatch =
      hasPreviousReportFromRival &&
      match.reportedScoreHome === homeScore &&
      match.reportedScoreAway === awayScore;

    const hasConflict =
      hasPreviousReportFromRival && !scoresMatch;

    // Todos los reportes necesarios están completos si:
    // 1. Es Admin u Organizador con autoridad oficial directa
    // 2. Es reporte verificado por API oficial
    // 3. Ambos capitanes enviaron reporte y los marcadores coinciden (Consenso)
    const shouldFinalize = isAdminOrOrg || isOfficialApi || scoresMatch;

    await dbProvider.matches.update(matchId, {
      reportedScoreHome: homeScore,
      reportedScoreAway: awayScore,
      ...(shouldFinalize
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
      ...(data.proofUrl ? { proofUrl: data.proofUrl } : {}),
    });

    // Auto-avanzar automáticamente a la siguiente llave / playoff si el partido quedó finalizado
    let autoAdvanceInfo = null;
    if (shouldFinalize) {
      try {
        const { processMatchAutoAdvance } = await import('@/lib/services/match-auto-advance');
        autoAdvanceInfo = await processMatchAutoAdvance(matchId);
      } catch (advErr) {
        console.warn('Advertencia en auto-avance automático de partido:', advErr);
      }
    }

    // Notificaciones contextuadas según el resultado del reporte
    try {
      const involvedTeamIds = Array.from(new Set([
        match.homeTeamId || match.teamHomeId,
        match.awayTeamId || match.teamAwayId,
      ].filter((teamId): teamId is string => Boolean(teamId))));
      const involvedTeams = await Promise.all(
        involvedTeamIds.map((teamId) => dbProvider.teams.findById(teamId)),
      );

      let notifTitle = 'Resultado de Partido Reportado';
      let notifDesc = `Se ha registrado el marcador ${match.homeTeamName || 'Local'} (${homeScore}) vs (${awayScore}) ${match.awayTeamName || 'Visitante'}.`;

      if (scoresMatch) {
        notifTitle = '¡Partido Oficializado por Consenso!';
        notifDesc = `Ambos equipos reportaron el mismo marcador (${homeScore} - ${awayScore}). El partido está finalizado y el ganador ha avanzado en el fixture.`;
      } else if (hasConflict) {
        notifTitle = 'Alerta: Discrepancia en Reporte de Partido';
        notifDesc = `Existe una diferencia entre los resultados reportados por los equipos. La organización intervendrá para arbitrar el encuentro.`;
      } else if (isOfficialApi) {
        notifTitle = 'Partido Oficializado vía API';
        notifDesc = `El resultado (${homeScore} - ${awayScore}) ha sido verificado automáticamente por la API oficial del juego.`;
      }

      await Promise.all(involvedTeams.map(async (team) => {
        if (team?.captainId && (scoresMatch || team.captainId !== actor.userId)) {
          await dbProvider.notifications.create({
            userId: team.captainId,
            type: 'MATCH',
            title: notifTitle,
            description: notifDesc,
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

    let responseMessage = 'Reporte enviado a revisión';
    if (scoresMatch) {
      responseMessage = '¡Consenso alcanzado! Ambos reportes coinciden: el partido ha finalizado y el ganador avanzó automáticamente.';
    } else if (isOfficialApi) {
      responseMessage = 'Resultado sincronizado vía API oficial: partido finalizado y auto-avance completado.';
    } else if (isAdminOrOrg) {
      responseMessage = 'Resultado oficializado por la administración: partido finalizado y auto-avance completado.';
    } else if (hasConflict) {
      responseMessage = 'Reporte registrado, pero existe discrepancia con el reporte previo del rival. Enviado a arbitraje.';
    } else {
      responseMessage = 'Reporte registrado con éxito. Esperando confirmación del rival o revisión del organizador.';
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      finalized: shouldFinalize,
      autoAdvance: autoAdvanceInfo,
    });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Match Report API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

