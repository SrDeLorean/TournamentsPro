import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || 'lol';
  
  try {
    await requireRequestActor(req, ['Administrador']);
    const comps = await dbProvider.competitions.findByGameSlug(slug);
    return NextResponse.json({ comps });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('GET /api/test-comps error:', error);
    return NextResponse.json({ error: 'Error consultando competencias' }, { status: 500 });
  }
}
