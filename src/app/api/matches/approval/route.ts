import { NextResponse } from 'next/server';
import { executeCas, queryDB, withTransaction } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canApproveMatch, canReportMatch } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { matchApprovalBodySchema } from '@/lib/api-schemas';

interface MatchRow extends Record<string, unknown> {
  id: string;
  competition_id: string | null;
  team_home_id: string | null;
  home_team_id: string | null;
  team_away_id: string | null;
  away_team_id: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  reported_score_home: number | null;
  reported_score_away: number | null;
  next_match_id: string | null;
  next_match_slot: string | null;
}

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

    const matches = await queryDB<MatchRow>('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    const match = matches[0];
    const competitionId = match.competition_id;

    let competitions = await queryDB<{ organization_id: string | null; organizer_id: string | null }>(
      'SELECT organization_id, organizer_id FROM competitions WHERE id = ? LIMIT 1',
      [competitionId],
    );
    const competition = competitions[0] || { organization_id: null, organizer_id: null };

    // ACTION: REPORT_SCORE (Captains) -> Status: POR_REVISAR
    if (action === 'REPORT_SCORE') {
      const homeTeamId = match.team_home_id || match.home_team_id;
      const awayTeamId = match.team_away_id || match.away_team_id;
      const participants = await queryDB<{ user_id: string }>(
        `SELECT captain_id AS user_id FROM teams WHERE id IN (?, ?)
         UNION
         SELECT user_id FROM team_members
          WHERE team_id IN (?, ?)
            AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán')`,
        [homeTeamId, awayTeamId, homeTeamId, awayTeamId],
      );
      if (!canReportMatch(actor, participants.map((participant) => participant.user_id))) {
        return NextResponse.json({ error: 'No tienes permisos para reportar este partido' }, { status: 403 });
      }

      await withTransaction(async (transaction) => {
        await transaction.queryRows('SELECT id FROM matches WHERE id = ? FOR UPDATE', [matchId]);
        await executeCas(
          transaction,
          `UPDATE matches
              SET reported_score_home = ?, reported_score_away = ?, proof_url = COALESCE(?, proof_url),
                  reported_by_user_id = ?, status = 'POR_REVISAR'
            WHERE id = ? AND status IN ('PENDIENTE', 'EN_CURSO', 'DISPUTADO')`,
          [scoreHome, scoreAway, proofUrl || null, actor.userId, matchId],
          'El partido ya fue reportado o finalizado.',
        );
      });

      return NextResponse.json({
        success: true,
        message: 'Marcador y comprobante enviado con éxito. El partido está en estado POR_REVISAR a la espera del visto bueno del organizador.',
      });
    }

    // ACTION: APPROVE (Organizer / Admin Visto Bueno) -> Status: TERMINADO
    if (action === 'APPROVE') {
      if (!canApproveMatch(actor, {
        organizationId: competition.organization_id,
        organizerId: competition.organizer_id,
      })) {
        return NextResponse.json({ error: 'Solo Organizadores y Administradores pueden otorgar el Visto Bueno' }, { status: 403 });
      }

      const finalHome = scoreHome !== undefined ? scoreHome : match.reported_score_home;
      const finalAway = scoreAway !== undefined ? scoreAway : match.reported_score_away;
      if (finalHome === null || finalAway === null) {
        return NextResponse.json({ error: 'El partido no tiene un marcador reportado válido' }, { status: 400 });
      }

      let winnerId = null;
      if (finalHome > finalAway) winnerId = match.team_home_id;
      else if (finalAway > finalHome) winnerId = match.team_away_id;

      await withTransaction(async (transaction) => {
        const lockedRows = await transaction.queryRows<MatchRow>('SELECT * FROM matches WHERE id = ? FOR UPDATE', [matchId]);
        if (lockedRows.length === 0) throw new Error('Partido no encontrado');
        const lockedMatch = lockedRows[0];
        if (lockedMatch.next_match_id) {
          await transaction.queryRows('SELECT id FROM matches WHERE id = ? FOR UPDATE', [lockedMatch.next_match_id]);
        }

        await executeCas(
          transaction,
          `UPDATE matches SET score_home = ?, score_away = ?, winner_team_id = ?, status = 'TERMINADO'
            WHERE id = ? AND status = 'POR_REVISAR'`,
          [finalHome, finalAway, winnerId, matchId],
          'El partido no está pendiente de aprobación o ya fue aprobado.',
        );

        if (lockedMatch.next_match_id && winnerId) {
          const teamRow = await transaction.queryRows<{ id: string; name: string }>(
            'SELECT id, name FROM teams WHERE id = ?',
            [winnerId],
          );
          const winnerName = teamRow[0]?.name
            || (winnerId === lockedMatch.team_home_id || winnerId === lockedMatch.home_team_id
              ? lockedMatch.home_team_name
              : lockedMatch.away_team_name);
          const isAwaySlot = lockedMatch.next_match_slot === 'AWAY';
          await transaction.executeCommand(
            isAwaySlot
              ? 'UPDATE matches SET team_away_id = ?, away_team_id = ?, away_team_name = ? WHERE id = ?'
              : 'UPDATE matches SET team_home_id = ?, home_team_id = ?, home_team_name = ? WHERE id = ?',
            [winnerId, winnerId, winnerName, lockedMatch.next_match_id],
          );
        }
      });

      await writeSecurityAudit({
        actor,
        request,
        action: 'MATCH_RESULT_APPROVED',
        resourceType: 'match',
        resourceId: matchId,
        organizationId: competition.organization_id,
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

