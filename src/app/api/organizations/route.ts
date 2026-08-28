import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db/provider';

interface PublicOrganizationRow {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  country: string | null;
  allowed_games: string | string[] | null;
  founded_year: string | null;
  rating: string | number | null;
  website: string | null;
  redes_sociales: string | Record<string, string> | null;
  status: string | null;
  organizers_count: number;
  teams_count: number;
}

function parseJsonValue<T>(value: string | T | null, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const rows = await queryDB<PublicOrganizationRow>(`
      SELECT
        o.id,
        o.name,
        o.tag,
        o.logo_url,
        o.banner_url,
        o.description,
        o.country,
        o.allowed_games,
        o.founded_year,
        o.rating,
        o.website,
        o.redes_sociales,
        o.status,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id AND u.role = 'Organizador') AS organizers_count,
        (SELECT COUNT(*) FROM teams t WHERE t.organization_id = o.id) AS teams_count
      FROM organizations o
      ORDER BY o.name ASC
    `);

    const organizations = rows.map((organization) => ({
      ...organization,
      allowedGames: parseJsonValue<string[]>(organization.allowed_games, []),
      socialMedia: parseJsonValue<Record<string, string>>(organization.redes_sociales, {}),
    }));

    return NextResponse.json({ success: true, organizations });
  } catch (error: unknown) {
    console.error('Public organizations GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Error consultando organizaciones' },
      { status: 500 },
    );
  }
}

