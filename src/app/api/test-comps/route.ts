import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || 'lol';
  
  try {
    const comps = await dbProvider.competitions.findByGameSlug(slug);
    return NextResponse.json({ comps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
