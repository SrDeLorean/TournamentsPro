import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');

  try {
    const tournaments = [
      {
        id: 'tourn-1',
        name: 'Liga Élite Pro 11v11 2026',
        gameSlug: 'eafc26',
        format: '11v11',
        maxTeams: 16,
        registeredTeamsCount: 12,
        status: 'RECLUTAMIENTO',
        prizePool: '$1,500 USD',
        startDate: '2026-08-01',
      },
      {
        id: 'tourn-2',
        name: 'Copa Relámpago Shooters CS2',
        gameSlug: 'csgo',
        format: '5v5',
        maxTeams: 8,
        registeredTeamsCount: 8,
        status: 'EN_CURSO',
        prizePool: '$800 USD',
        startDate: '2026-07-20',
      },
    ];

    const filtered = gameSlug ? tournaments.filter((t) => t.gameSlug === gameSlug) : tournaments;

    return NextResponse.json({ success: true, tournaments: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener torneos' },
      { status: 500 }
    );
  }
}
