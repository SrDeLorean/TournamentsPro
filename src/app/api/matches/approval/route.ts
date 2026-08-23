import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

// POST /api/matches/approval - Report score (Captain) or Approve Visto Bueno (Organizer/Admin)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchId, scoreHome, scoreAway, proofUrl, userId, action, requesterRole } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'ID de partido requerido' }, { status: 400 });
    }

    const matches = await queryDB<any>('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    const match = matches[0];

    // ACTION: REPORT_SCORE (Captains) -> Status: POR_REVISAR
    if (action === 'REPORT_SCORE') {
      await queryDB(
        `UPDATE matches 
         SET reported_score_home = ?, reported_score_away = ?, proof_url = COALESCE(?, proof_url), 
             reported_by_user_id = ?, status = 'POR_REVISAR'
         WHERE id = ?`,
        [scoreHome, scoreAway, proofUrl || null, userId || null, matchId]
      );

      return NextResponse.json({
        success: true,
        message: 'Marcador y comprobante enviado con éxito. El partido está en estado POR_REVISAR a la espera del visto bueno del organizador.',
      });
    }

    // ACTION: APPROVE (Organizer / Admin Visto Bueno) -> Status: TERMINADO
    if (action === 'APPROVE') {
      if (requesterRole !== 'Administrador' && requesterRole !== 'Organizador') {
        return NextResponse.json({ error: 'Solo Organizadores y Administradores pueden otorgar el Visto Bueno' }, { status: 403 });
      }

      const finalHome = scoreHome !== undefined ? scoreHome : match.reported_score_home;
      const finalAway = scoreAway !== undefined ? scoreAway : match.reported_score_away;

      let winnerId = null;
      if (finalHome > finalAway) winnerId = match.team_home_id;
      else if (finalAway > finalHome) winnerId = match.team_away_id;

      await queryDB(
        `UPDATE matches 
         SET score_home = ?, score_away = ?, winner_team_id = ?, status = 'TERMINADO'
         WHERE id = ?`,
        [finalHome, finalAway, winnerId, matchId]
      );

      // Auto-advance in Playoffs if next_match_id exists
      if (match.next_match_id && winnerId) {
        const teamRow = await queryDB<any>('SELECT id, name FROM teams WHERE id = ?', [winnerId]);
        const winnerName = teamRow && teamRow.length > 0 
          ? teamRow[0].name 
          : (winnerId === match.team_home_id || winnerId === match.home_team_id ? match.home_team_name : match.away_team_name);

        const isAwaySlot = match.next_match_slot === 'AWAY';
        if (isAwaySlot) {
          await queryDB(
            `UPDATE matches 
             SET team_away_id = ?, away_team_id = ?, away_team_name = ?
             WHERE id = ?`,
            [winnerId, winnerId, winnerName, match.next_match_id]
          );
        } else {
          await queryDB(
            `UPDATE matches 
             SET team_home_id = ?, home_team_id = ?, home_team_name = ?
             WHERE id = ?`,
            [winnerId, winnerId, winnerName, match.next_match_id]
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Visto bueno otorgado. Resultado oficializado y guardado en MySQL.',
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error procesando aprobación del partido' }, { status: 500 });
  }
}
