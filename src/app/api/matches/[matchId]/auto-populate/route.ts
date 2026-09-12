import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestMatchReporter } from '@/lib/auth-server';
import { autoPopulateMatchBodySchema } from '@/lib/api-schemas';
import { syncMatchFromGameApi } from '@/lib/services/game-apis';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    if (!matchId) {
      return NextResponse.json({ error: 'Match ID requerido' }, { status: 400 });
    }

    const match = await dbProvider.matches.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    const parsedBody = autoPopulateMatchBodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Parámetros de sincronización inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const body = parsedBody.data;
    const actor = await requireRequestMatchReporter(request, matchId);
    const query = body.query || body.matchIdentifier || body.clubId || match.homeTeamName || '';
    const mode = body.mode || '5v5';

    // Determinar la disciplina del partido
    const competitionId = match.competitionId || match.tournamentId;
    const competition = competitionId
      ? await dbProvider.competitions.findById(competitionId)
      : null;
    const effectiveGameSlug = competition?.gameSlug || body.gameSlug || 'eafc26';

    // Consultar la API del juego
    const result = await syncMatchFromGameApi(effectiveGameSlug, query, {
      homeTeamName: match.homeTeamName || 'Local',
      awayTeamName: match.awayTeamName || 'Visitante',
      mode,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'No se pudieron extraer los datos del partido desde la API' },
        { status: 400 }
      );
    }

    // Actualizar el partido con el resultado oficial extraído
    await dbProvider.matches.update(matchId, {
      reportedScoreHome: result.matchScore.team1,
      reportedScoreAway: result.matchScore.team2,
      status: 'POR_REVISAR',
      reportedByUserId: actor.userId,
    });

    // Guardar estadísticas individuales de cada jugador extraído
    if (result.participants && Array.isArray(result.participants)) {
      for (const p of result.participants) {
        const rawGamertag = p.gamertag;
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
          ...p.stats,
          team: p.team,
          isMvp: !!p.isMvp,
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

    return NextResponse.json({
      success: true,
      message: result.message || 'Partido poblado con éxito desde la API oficial',
      sourceApi: result.sourceApi,
      matchScore: result.matchScore,
      participantsCount: result.participants.length,
      mvpGamertag: result.mvpGamertag,
      participants: result.participants,
    });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error en /api/matches/[matchId]/auto-populate:', error);
    return NextResponse.json(
      { error: 'Error al auto-poblar estadísticas de partido' },
      { status: 500 }
    );
  }
}
