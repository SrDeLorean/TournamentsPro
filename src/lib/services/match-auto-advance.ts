import { dbProvider } from '@/lib/db/provider';
import { parseBo3GameInfo, evaluateBo3Series } from '@/lib/bo3-series';
import { buildHybridPlayoffSeedAssignments } from '@/features/competitions/classification/hybrid-playoff-seeding';

export interface AutoAdvanceResult {
  advanced: boolean;
  targetMatchId?: string | null;
  isBo3SeriesDefined?: boolean;
  game3Cancelled?: boolean;
  hybridSeeded?: boolean;
  message: string;
}

/**
 * Centralized service to auto-advance winners in playoff matches,
 * manage Bo3 series definitions, handle 2-legged ties (ida y vuelta),
 * and trigger automatic playoff seeding when hybrid group stages conclude.
 */
export async function processMatchAutoAdvance(matchId: string): Promise<AutoAdvanceResult> {
  const match = await dbProvider.matches.findById(matchId);
  if (!match) {
    return { advanced: false, message: 'Partido no encontrado para auto-avance.' };
  }

  const competitionId = match.competitionId || match.tournamentId;
  const winnerId = match.winnerTeamId;
  const nextMatchId = match.nextMatchId;
  const nextSlot = match.nextMatchSlot || 'HOME';

  let advanced = false;
  let isBo3SeriesDefined = false;
  let game3Cancelled = false;
  let hybridSeeded = false;
  let resultMsg = 'Partido procesado.';

  const gameInfo = parseBo3GameInfo(match);

  // 1. Handle Best of 3 (Bo3) series auto-advance
  if (gameInfo.isBo3 && competitionId) {
    const compMatches = await dbProvider.matches.findByCompetition(competitionId);
    const seriesMatches = compMatches.filter(
      (m) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId
    );
    const evalResult = evaluateBo3Series(seriesMatches);

    if (evalResult.isDefined && evalResult.winnerTeamId) {
      isBo3SeriesDefined = true;
      const seriesWinnerId = evalResult.winnerTeamId;
      const seriesWinnerName =
        evalResult.winnerTeamName ||
        (seriesWinnerId === (match.teamHomeId || match.homeTeamId)
          ? match.homeTeamName || ''
          : match.awayTeamName || '');

      // Auto-cancel unused Game 3 if pending
      const game3 = evalResult.game3;
      if (game3 && game3.status !== 'TERMINADO' && game3.status !== 'FINALIZADO' && game3.status !== 'CANCELADO') {
        try {
          await dbProvider.matches.update(game3.id, { status: 'CANCELADO' });
          game3Cancelled = true;
        } catch (cErr) {
          console.warn('Error cancelando Juego 3 en Bo3:', cErr);
        }
      }

      // If there is a next match in the playoff bracket, advance the series winner
      const anchorNextId = nextMatchId || (game3 as any)?.nextMatchId;
      const anchorSlot = nextSlot || (game3 as any)?.nextMatchSlot || 'HOME';

      if (anchorNextId) {
        await advanceWinnerToTarget(anchorNextId, anchorSlot, seriesWinnerId, seriesWinnerName);
        advanced = true;
        resultMsg = `Serie Bo3 definida (${evalResult.scoreSummary}). Ganador "${seriesWinnerName}" avanzó a ${anchorNextId}.`;
      } else {
        resultMsg = `Serie Bo3 definida (${evalResult.scoreSummary}). Ganador final: "${seriesWinnerName}".`;
      }
    } else {
      resultMsg = `Serie Bo3 en disputa (${evalResult.scoreSummary}). Siguiente juego requerido.`;
    }
  }
  // 2. Handle Two-Legged series (Ida y Vuelta)
  else if (nextSlot === 'VUELTA_TARGET' && nextMatchId) {
    // Game 1 (IDA) finished: populate Game 2 (VUELTA) with inverted home/away
    const homeId = match.awayTeamId || match.teamAwayId;
    const homeName = match.awayTeamName;
    const homeTag = match.awayTeamTag;
    const awayId = match.homeTeamId || match.teamHomeId;
    const awayName = match.homeTeamName;
    const awayTag = match.homeTeamTag;

    await dbProvider.matches.update(nextMatchId, {
      homeTeamId: homeId,
      teamHomeId: homeId,
      homeTeamName: homeName,
      awayTeamId: awayId,
      teamAwayId: awayId,
      awayTeamName: awayName,
      ...(homeTag ? { homeTeamTag: homeTag } : {}),
      ...(awayTag ? { awayTeamTag: awayTag } : {}),
    });
    advanced = true;
    resultMsg = `Partido de Ida completado. Llave de Vuelta (${nextMatchId}) configurada con localía invertida.`;
  }
  // 3. Handle Single Match Playoff Advance
  else if (nextMatchId && winnerId) {
    const winnerName =
      winnerId === (match.homeTeamId || match.teamHomeId)
        ? match.homeTeamName || ''
        : match.awayTeamName || '';

    await advanceWinnerToTarget(nextMatchId, nextSlot, winnerId, winnerName);
    advanced = true;
    resultMsg = `Ganador "${winnerName}" avanzó a la siguiente llave (${nextMatchId}).`;
  }

  // 4. Handle Hybrid Tournament Group Stage completion
  if (competitionId) {
    try {
      const competition = await dbProvider.competitions.findById(competitionId);
      const isHybrid =
        competition?.format?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('HIBRID') ||
        match.stage === 'GROUP' ||
        /^grupo\s+/i.test(match.groupName || '');

      if (isHybrid) {
        const compMatches = await dbProvider.matches.findByCompetition(competitionId);
        const groupMatches = compMatches.filter(
          (m) =>
            m.stage === 'GROUP' ||
            /^grupo\s+/i.test(m.groupName || '') ||
            (m.groupName !== null && m.groupName !== undefined && m.groupName !== '')
        );

        const allGroupMatchesFinished =
          groupMatches.length > 0 &&
          groupMatches.every((m) => m.status === 'FINALIZADO' || m.status === 'TERMINADO');

        if (allGroupMatchesFinished) {
          const qualifiersPerGroup = competition?.qualifiersPerGroup || 2;
          const seeding = buildHybridPlayoffSeedAssignments(compMatches, qualifiersPerGroup);

          for (const assignment of seeding.assignments) {
            for (const targetMatchId of assignment.matchIds) {
              const targetMatch = compMatches.find((candidate) => candidate.id === targetMatchId);
              const isReturnLeg =
                /\(vuelta\)/i.test(targetMatch?.roundName || '') || /-vuelta$/i.test(targetMatchId);
              const home = isReturnLeg ? assignment.away : assignment.home;
              const away = isReturnLeg ? assignment.home : assignment.away;

              await dbProvider.matches.update(targetMatchId, {
                teamHomeId: home.id,
                homeTeamId: home.id,
                homeTeamName: home.name,
                homeTeamTag: home.tag || null,
                teamAwayId: away.id,
                awayTeamId: away.id,
                awayTeamName: away.name,
                awayTeamTag: away.tag || null,
              });
            }
          }
          hybridSeeded = true;
          resultMsg += ' Fase de grupos concluida. Clasificados y wildcards sembrados automáticamente en los playoffs.';
        }
      }
    } catch (hybridErr) {
      console.warn('Advertencia sembrando fase de grupos híbrida:', hybridErr);
    }
  }

  return {
    advanced,
    targetMatchId: nextMatchId,
    isBo3SeriesDefined,
    game3Cancelled,
    hybridSeeded,
    message: resultMsg,
  };
}

/**
 * Helper to update the target match (or multi-game series) with the advanced team.
 */
async function advanceWinnerToTarget(
  targetMatchId: string,
  targetSlot: string,
  winnerId: string,
  winnerName: string
) {
  const isBo3Next = /-j1$/i.test(targetMatchId);
  const isTwoLegNext = /-ida$/i.test(targetMatchId);
  const isAway = targetSlot === 'AWAY';

  if (isBo3Next) {
    const nextJ1 = targetMatchId;
    const nextJ2 = targetMatchId.replace(/-j1$/i, '-j2');
    const nextJ3 = targetMatchId.replace(/-j1$/i, '-j3');

    if (isAway) {
      await dbProvider.matches.update(nextJ1, {
        awayTeamId: winnerId,
        teamAwayId: winnerId,
        awayTeamName: winnerName,
      });
      await dbProvider.matches.update(nextJ3, {
        awayTeamId: winnerId,
        teamAwayId: winnerId,
        awayTeamName: winnerName,
      });
      await dbProvider.matches.update(nextJ2, {
        homeTeamId: winnerId,
        teamHomeId: winnerId,
        homeTeamName: winnerName,
      });
    } else {
      await dbProvider.matches.update(nextJ1, {
        homeTeamId: winnerId,
        teamHomeId: winnerId,
        homeTeamName: winnerName,
      });
      await dbProvider.matches.update(nextJ3, {
        homeTeamId: winnerId,
        teamHomeId: winnerId,
        homeTeamName: winnerName,
      });
      await dbProvider.matches.update(nextJ2, {
        awayTeamId: winnerId,
        teamAwayId: winnerId,
        awayTeamName: winnerName,
      });
    }
  } else if (isTwoLegNext) {
    const nextIda = targetMatchId;
    const nextVuelta = targetMatchId.replace(/-ida$/i, '-vuelta');

    if (isAway) {
      await dbProvider.matches.update(nextIda, {
        awayTeamId: winnerId,
        teamAwayId: winnerId,
        awayTeamName: winnerName,
      });
      await dbProvider.matches.update(nextVuelta, {
        homeTeamId: winnerId,
        teamHomeId: winnerId,
        homeTeamName: winnerName,
      });
    } else {
      await dbProvider.matches.update(nextIda, {
        homeTeamId: winnerId,
        teamHomeId: winnerId,
        homeTeamName: winnerName,
      });
      await dbProvider.matches.update(nextVuelta, {
        awayTeamId: winnerId,
        teamAwayId: winnerId,
        awayTeamName: winnerName,
      });
    }
  } else {
    if (isAway) {
      await dbProvider.matches.update(targetMatchId, {
        awayTeamId: winnerId,
        teamAwayId: winnerId,
        awayTeamName: winnerName,
      });
    } else {
      await dbProvider.matches.update(targetMatchId, {
        homeTeamId: winnerId,
        teamHomeId: winnerId,
        homeTeamName: winnerName,
      });
    }
  }
}
