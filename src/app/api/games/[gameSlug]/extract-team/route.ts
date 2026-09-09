import { NextResponse } from 'next/server';
import { extractTeamDataFromGameApi } from '@/lib/services/game-apis';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const platform = searchParams.get('platform') || 'CROSSPLAY';

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Ingresa al menos 2 caracteres para buscar en la API' },
        { status: 400 }
      );
    }

    const result = await extractTeamDataFromGameApi(gameSlug, query, platform);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en API route extract-team:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al consultar API de juego' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;
    const body = await request.json();
    const query = body.query || body.name || body.id || '';
    const platform = body.platform || 'CROSSPLAY';

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un nombre o ID válido para buscar en la API' },
        { status: 400 }
      );
    }

    const result = await extractTeamDataFromGameApi(gameSlug, query, platform);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en POST extract-team:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
