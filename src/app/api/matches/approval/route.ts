// @ts-nocheck
import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canApproveMatch, canReportMatch } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { matchApprovalBodySchema } from '@/lib/api-schemas';

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

    let competition = { organizationId: null as string | null, organizerId: null as string | null };
    if (competitionId) {
      const compObj = await dbProvider.competitions.findById(competitionId);
      if (compObj) {
        competition = { organizationId: compObj.organizationId, organizerId: compObj.organizerId };
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

        if (lockedMatch.nextMatchId && winnerId) {
          const teamObj = await transaction.teams.findById(winnerId);
          let winnerName = teamObj?.name;
          if (!winnerName) {
            winnerName = (winnerId === lockedMatch.teamHomeId || winnerId === lockedMatch.homeTeamId)
              ? lockedMatch.homeTeamName || ''
              : lockedMatch.awayTeamName || '';
          }
          const isAwaySlot = lockedMatch.nextMatchSlot === 'AWAY';
          
          if (isAwaySlot) {
            await transaction.matches.update(lockedMatch.nextMatchId, {
              teamAwayId: winnerId,
              awayTeamId: winnerId,
              awayTeamName: winnerName
            });
          } else {
            await transaction.matches.update(lockedMatch.nextMatchId, {
              teamHomeId: winnerId,
              homeTeamId: winnerId,
              homeTeamName: winnerName
            });
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

