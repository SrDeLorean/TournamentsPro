import { NextResponse } from 'next/server';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { transferPostBodySchema } from '@/lib/api-schemas';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');

  try {
    const vacancies = [
      { id: 'vac-1', teamName: 'SAN LORENZO ESP', gameSlug: 'eafc26', position: 'DFC', membersCount: 11, maxMembers: 45, platform: 'PS5' },
      { id: 'vac-2', teamName: 'HIGHFIELD XX', gameSlug: 'csgo', position: 'AWP', membersCount: 5, maxMembers: 7, platform: 'PC' },
      { id: 'vac-3', teamName: 'SANGRE NUEVA FC', gameSlug: 'eafc26', position: 'DC', membersCount: 8, maxMembers: 45, platform: 'CROSSPLAY' },
    ];

    const filtered = gameSlug ? vacancies.filter((v) => v.gameSlug === gameSlug) : vacancies;

    return NextResponse.json({ success: true, vacancies: filtered });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al obtener vacantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const parsedBody = transferPostBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios para la postulación' },
        { status: 400 },
      );
    }
    const body = parsedBody.data;
    const { teamId, position, pitchMessage } = body;

    if (!teamId || !position) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios para la postulación' },
        { status: 400 }
      );
    }

    const application = {
      id: `trans-${Date.now()}`,
      teamId,
      applicantUserId: actor.userId,
      position,
      pitchMessage: pitchMessage || 'Postulación enviada desde el Mercado de Traspasos',
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: '¡Postulación enviada exitosamente al Capitán del equipo!',
        application,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al procesar la postulación' },
      { status: 500 }
    );
  }
}
