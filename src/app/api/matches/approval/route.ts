// @ts-nocheck
import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canApproveMatch, canReportMatch } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { matchApprovalBodySchema } from '@/lib/api-schemas';
import { buildHybridPlayoffSeedAssignments } from '@/features/competitions/classification/hybrid-playoff-seeding';

// POST /api/matches/approval - Report score (Captain) or Approve Visto Bueno (Organizer/Admin)
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const parsedBody = matchApprovalBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Datos de partido o acción no válidos' }, { status: 400 });
    }
    const body = parsedBody.data;
    const { matchId, scoreHome, scoreAway, proofUrl, action } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'ID de partido requerido' }, { status: 400 });
    }

    const match = await dbProvider.matches.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    const competitionId = match.competitionId;

    let competition = {
      organizationId: null as string | null,
      organizerId: null as string | null,
      format: null as string | null,
      qualifiersPerGroup: 2,
    };
    if (competitionId) {
      const compObj = await dbProvider.competitions.findById(competitionId);
      if (compObj) {
        competition = {
          organizationId: compObj.organizationId,
          organizerId: compObj.organizerId,
          format: compObj.format || compObj.modeFormat,
          qualifiersPerGroup: Number(compObj.qualifiersPerGroup || 2),
        };
      }
    }

    // ACTION: REPORT_SCORE (Captains) -> Status: POR_REVISAR
    if (action === 'REPORT_SCORE') {
      const homeTeamId = match.teamHomeId || match.homeTeamId;
      const awayTeamId = match.teamAwayId || match.awayTeamId;
      
      const managersHome = homeTeamId ? await dbProvider.teams.getManagers(homeTeamId) : [];
      const managersAway = awayTeamId ? await dbProvider.teams.getManagers(awayTeamId) : [];
      const teamHomeObj = homeTeamId ? await dbProvider.teams.findById(homeTeamId) : null;
      const teamAwayObj = awayTeamId ? await dbProvider.teams.findById(awayTeamId) : null;
      
      const participantIds = [
        ...managersHome.map(m => m.userId),
        ...managersAway.map(m => m.userId),
        teamHomeObj?.captainId,
        teamAwayObj?.captainId
      ].filter(Boolean) as string[];

      if (!canReportMatch(actor, participantIds)) {
        return NextResponse.json({ error: 'No tienes permisos para reportar este partido' }, { status: 403 });
      }

      const { parseBo3GameInfo, evaluateBo3Series } = await import('@/lib/bo3-series');
      const gameInfo = parseBo3GameInfo(match);
      if (gameInfo.isBo3 && gameInfo.gameNumber === 3 && competitionId) {
        const compMatches = await dbProvider.matches.findByCompetition(competitionId);
        const seriesMatches = compMatches.filter((m: any) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId);
        const evalResult = evaluateBo3Series(seriesMatches);
        if (evalResult.isGame3Locked || evalResult.isDefined) {
          return NextResponse.json({
            error: `La serie al Mejor de 3 ya fue definida (${evalResult.scoreSummary}). El Juego 3 no es requerido y no puede ser reportado.`,
            code: 'BO3_SERIES_ALREADY_DEFINED',
          }, { status: 400 });
        }
      }

      await dbProvider.withTransaction(async (transaction) => {
        const lockedMatch = await transaction.matches.findById(matchId);
        if (!lockedMatch) throw new Error('Partido no encontrado');
        if (!['PENDIENTE', 'EN_CURSO', 'DISPUTADO'].includes(lockedMatch.status)) {
          throw new Error('El partido ya fue reportado o finalizado.');
        }

        await transaction.matches.update(matchId, {
          reportedScoreHome: scoreHome,
          reportedScoreAway: scoreAway,
          proofUrl: proofUrl || lockedMatch.proofUrl,
          reportedByUserId: actor.userId,
          status: 'POR_REVISAR'
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Marcador y comprobante enviado con éxito. El partido está en estado POR_REVISAR a la espera del visto bueno del organizador.',
      });
    }

    // ACTION: APPROVE (Organizer / Admin Visto Bueno) -> Status: TERMINADO
    if (action === 'APPROVE') {
      if (!canApproveMatch(actor, {
        organizationId: competition.organizationId,
        organizerId: competition.organizerId,
      })) {
        return NextResponse.json({ error: 'Solo Organizadores y Administradores pueden otorgar el Visto Bueno' }, { status: 403 });
      }

      const finalHome = scoreHome !== undefined ? scoreHome : match.reportedScoreHome;
      const finalAway = scoreAway !== undefined ? scoreAway : match.reportedScoreAway;
      if (finalHome === null || finalAway === null) {
        return NextResponse.json({ error: 'El partido no tiene un marcador reportado válido' }, { status: 400 });
      }

      let winnerId = null;
      if (finalHome > finalAway) winnerId = match.teamHomeId || match.homeTeamId;
      else if (finalAway > finalHome) winnerId = match.teamAwayId || match.awayTeamId;

      await dbProvider.withTransaction(async (transaction) => {
        const lockedMatch = await transaction.matches.findById(matchId);
        if (!lockedMatch) throw new Error('Partido no encontrado');
        
        if (lockedMatch.status !== 'POR_REVISAR') {
          throw new Error('El partido no está pendiente de aprobación o ya fue aprobado.');
        }

        await transaction.matches.update(matchId, {
          scoreHome: finalHome,
          scoreAway: finalAway,
          winnerTeamId: winnerId,
          status: 'TERMINADO'
        });

        const { parseBo3GameInfo, evaluateBo3Series } = await import('@/lib/bo3-series');
        const gameInfo = parseBo3GameInfo(lockedMatch);
        let seriesWinnerId = winnerId;
        let seriesWinnerName = '';
        let shouldAdvance = Boolean(lockedMatch.nextMatchId && winnerId);

        if (gameInfo.isBo3 && competitionId) {
          const compMatches = await transaction.matches.findByCompetition(competitionId);
          const seriesMatches = compMatches
            .map((m: any) => m.id === matchId ? { ...m, scoreHome: finalHome, scoreAway: finalAway, status: 'TERMINADO', winnerTeamId: winnerId } : m)
            .filter((m: any) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId);
          const evalResult = evaluateBo3Series(seriesMatches);

          if (evalResult.isDefined && evalResult.winnerTeamId) {
            seriesWinnerId = evalResult.winnerTeamId;
            seriesWinnerName = evalResult.winnerTeamName || '';
            shouldAdvance = Boolean(lockedMatch.nextMatchId && seriesWinnerId);

            // Auto-cancel Game 3 if not already finished
            const game3 = evalResult.game3;
            if (game3 && game3.status !== 'TERMINADO' && game3.status !== 'FINALIZADO') {
              await transaction.matches.update(game3.id, {
                status: 'CANCELADO'
              });
            }
          } else {
            // Bo3 series not defined yet (e.g. 1-0 or 1-1)
            shouldAdvance = false;
          }
        }

        if (shouldAdvance && lockedMatch.nextMatchId && seriesWinnerId) {
          let winnerName = seriesWinnerName;
          if (!winnerName) {
            const teamObj = await transaction.teams.findById(seriesWinnerId);
            winnerName = teamObj?.name || ((seriesWinnerId === lockedMatch.teamHomeId || seriesWinnerId === lockedMatch.homeTeamId)
              ? lockedMatch.homeTeamName || ''
              : lockedMatch.awayTeamName || '');
          }
          const isAwaySlot = lockedMatch.nextMatchSlot === 'AWAY';
          const targetNextId = lockedMatch.nextMatchId;
          const isBo3NextTarget = /-j1$/i.test(targetNextId);

          if (isBo3NextTarget) {
            const nextJ1 = targetNextId;
            const nextJ2 = targetNextId.replace(/-j1$/i, '-j2');
            const nextJ3 = targetNextId.replace(/-j1$/i, '-j3');

            if (isAwaySlot) {
              await transaction.matches.update(nextJ1, { teamAwayId: seriesWinnerId, awayTeamId: seriesWinnerId, awayTeamName: winnerName });
              await transaction.matches.update(nextJ3, { teamAwayId: seriesWinnerId, awayTeamId: seriesWinnerId, awayTeamName: winnerName });
              await transaction.matches.update(nextJ2, { teamHomeId: seriesWinnerId, homeTeamId: seriesWinnerId, homeTeamName: winnerName });
            } else {
              await transaction.matches.update(nextJ1, { teamHomeId: seriesWinnerId, homeTeamId: seriesWinnerId, homeTeamName: winnerName });
              await transaction.matches.update(nextJ3, { teamHomeId: seriesWinnerId, homeTeamId: seriesWinnerId, homeTeamName: winnerName });
              await transaction.matches.update(nextJ2, { teamAwayId: seriesWinnerId, awayTeamId: seriesWinnerId, awayTeamName: winnerName });
            }
          } else {
            if (isAwaySlot) {
              await transaction.matches.update(targetNextId, {
                teamAwayId: seriesWinnerId,
                awayTeamId: seriesWinnerId,
                awayTeamName: winnerName
              });
            } else {
              await transaction.matches.update(targetNextId, {
                teamHomeId: seriesWinnerId,
                homeTeamId: seriesWinnerId,
                homeTeamName: winnerName
              });
            }
          }
        }

        const isHybridGroupMatch = (competition.format || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('HIBRID')
          && /^grupo\s+/i.test(lockedMatch.groupName || '');
        if (isHybridGroupMatch && competitionId) {
          const competitionMatches = await transaction.matches.findByCompetition(competitionId);
          const seeding = buildHybridPlayoffSeedAssignments(competitionMatches, competition.qualifiersPerGroup);
          for (const assignment of seeding.assignments) {
            for (const targetMatchId of assignment.matchIds) {
              const targetMatch = competitionMatches.find((candidate) => candidate.id === targetMatchId);
              const isReturnLeg = /\(vuelta\)/i.test(targetMatch?.roundName || '') || /-vuelta$/i.test(targetMatchId);
              const home = isReturnLeg ? assignment.away : assignment.home;
              const away = isReturnLeg ? assignment.home : assignment.away;
              await transaction.matches.update(targetMatchId, {
                teamHomeId: home.id,
                homeTeamId: home.id,
                homeTeamName: home.name,
                homeTeamTag: home.tag,
                teamAwayId: away.id,
                awayTeamId: away.id,
                awayTeamName: away.name,
                awayTeamTag: away.tag,
              });
            }
          }
        }
      });

      await writeSecurityAudit({
        actor,
        request,
        action: 'MATCH_RESULT_APPROVED',
        resourceType: 'match',
        resourceId: matchId,
        organizationId: competition.organizationId,
        metadata: { competitionId, scoreHome: finalHome, scoreAway: finalAway, winnerId },
      });

      // Notificar a ambos capitanes
      try {
        const teamH = (match.teamHomeId || match.homeTeamId) ? await dbProvider.teams.findById(match.teamHomeId || match.homeTeamId) : null;
        const teamA = (match.teamAwayId || match.awayTeamId) ? await dbProvider.teams.findById(match.teamAwayId || match.awayTeamId) : null;
        const gameSlug = (match as any).gameSlug || 'eafc26';

        if (teamH?.captainId) {
          await dbProvider.notifications.create({
            userId: teamH.captainId,
            type: 'MATCH',
            title: 'Partido Oficializado con Visto Bueno',
            description: `El árbitro/organizador ha oficializado el resultado final (${finalHome} - ${finalAway}) contra ${teamA?.name || 'Visitante'}.`,
            actionUrl: `/${gameSlug}/partidos`,
            isRead: false,
          }).catch((e) => console.warn('Error al notificar capitan local:', e));
        }

        if (teamA?.captainId) {
          await dbProvider.notifications.create({
            userId: teamA.captainId,
            type: 'MATCH',
            title: 'Partido Oficializado con Visto Bueno',
            description: `El árbitro/organizador ha oficializado el resultado final (${finalAway} - ${finalHome}) contra ${teamH?.name || 'Local'}.`,
            actionUrl: `/${gameSlug}/partidos`,
            isRead: false,
          }).catch((e) => console.warn('Error al notificar capitan visitante:', e));
        }
      } catch (err) {
        console.warn('Error al emitir notificaciones de visto bueno:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Visto bueno otorgado. Resultado oficializado y guardado en MySQL.',
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error procesando aprobación del partido' }, { status: 500 });
  }
}

