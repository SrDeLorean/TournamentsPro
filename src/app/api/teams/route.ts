import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import {
  TeamRow,
  mapTeamRowToData,
  apiSuccess,
  apiError,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api-types';

// GET /api/teams — List teams with optional game filter and pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');
  const { page, limit } = parsePaginationParams(searchParams);

  try {
    let whereSql = '';
    const params: (string | number)[] = [];

    if (gameSlug && !['ALL', 'all', 'TODOS', 'todas'].includes(gameSlug)) {
      whereSql = ' WHERE game_slug = ?';
      params.push(gameSlug);
    }

    // Count total
    const countResult = await queryDB<{ total: number }>(`SELECT COUNT(*) as total FROM teams${whereSql}`, [...params]);
    const total = countResult[0]?.total || 0;

    // Paginated query
    const offset = (page - 1) * limit;
    const rows = await queryDB<TeamRow>(
      `SELECT * FROM teams${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const teams = rows.map(mapTeamRowToData);
    const meta = buildPaginationMeta(page, limit, total);

    return apiSuccess({ teams }, undefined, meta);
  } catch (error) {
    // If table doesn't exist yet, return clean empty list
    return apiSuccess({ teams: [] });
  }
}

// POST /api/teams — Create team
export async function POST(request: Request) {
  try {
    // Auth check - must be authenticated to create a team
    const authPayload = authenticateRequest(request);
    if (!authPayload) {
      return apiError('Autenticación requerida para crear un equipo', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { id, name, tag, gameSlug, gameName, captainId, captainName, platform, color, logoText, logoUrl, bannerUrl, description, vacantPositions } = body;

    if (!name || !tag) {
      return apiError('Nombre y tag del equipo son requeridos', 400);
    }

    const teamId = id || `team-${Date.now()}`;
    const vacantsJson = JSON.stringify(vacantPositions || []);
    const teamDesc = description || 'Escuadra oficial del circuito eSports.';

    // Check if user already owns a team in this discipline
    const effectiveCaptainId = captainId || authPayload.userId;
    if (effectiveCaptainId) {
      try {
        const existing = await queryDB<TeamRow>(
          'SELECT id, name FROM teams WHERE game_slug = ? AND captain_id = ? LIMIT 1',
          [gameSlug || 'eafc26', effectiveCaptainId]
        );
        if (existing && existing.length > 0) {
          return apiError(
            `Ya posees el club "${existing[0].name}" en esta disciplina. Solo se permite 1 club por disciplina por usuario.`,
            400,
            'DUPLICATE_TEAM'
          );
        }
      } catch (e) {
        // Table might not exist yet
      }
    }

    try {
      await queryDB(
        `INSERT INTO teams (id, name, tag, game_slug, captain_id, captain_name, platform, color, logo_text, logo_url, banner_url, description, vacant_positions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), captain_name=VALUES(captain_name), color=VALUES(color), logo_url=VALUES(logo_url), banner_url=VALUES(banner_url)`,
        [teamId, name, tag || 'TP', gameSlug || 'eafc26', effectiveCaptainId, captainName || authPayload.gamertag || 'Capitán', platform || 'CROSSPLAY', color || '#00F0FF', logoText || 'TP', logoUrl || '', bannerUrl || '', teamDesc, vacantsJson]
      );
    } catch (insertErr) {
      await queryDB(
        `INSERT INTO teams (id, name, tag, game_slug, captain_id, captain_name, platform, color, logo_text, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), captain_name=VALUES(captain_name), color=VALUES(color)`,
        [teamId, name, tag || 'TP', gameSlug || 'eafc26', effectiveCaptainId, captainName || authPayload.gamertag || 'Capitán', platform || 'CROSSPLAY', color || '#00F0FF', logoText || 'TP', teamDesc]
      );
    }

    return apiSuccess({ team: { id: teamId, ...body } }, 'Equipo creado exitosamente');
  } catch (error: unknown) {
    console.error('Teams POST error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando equipo';
    return apiError(message, 500);
  }
}

// PUT /api/teams — Update team
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let { id, name, tag, description, platform, clubIdEa, socialMedia, color, logoText, logoUrl, bannerUrl, status, gameSlug, captainId, captainName } = body;

    const teamId = (id || '').trim().slice(0, 36);
    if (!teamId) {
      return apiError('ID del club requerido', 400);
    }

    // Check if team exists
    const existingRows = await queryDB<TeamRow>('SELECT * FROM teams WHERE id = ?', [teamId]);
    const t = (existingRows && existingRows.length > 0) ? existingRows[0] : null;

    const safeName = (name !== undefined ? name : (t?.name || 'Escuadra Pro')).slice(0, 100);
    const safeTag = (tag !== undefined ? tag : (t?.tag || 'TP')).slice(0, 10);
    const safeDescription = description !== undefined ? description : (t?.description || 'Escuadra oficial del circuito eSports.');
    const safePlatform = (platform !== undefined ? platform : (t?.platform || 'CROSSPLAY')).slice(0, 20);
    const safeColor = (color !== undefined ? color : (t?.color || '#00F0FF')).slice(0, 20);
    const safeLogoText = (logoText !== undefined ? logoText : (t?.logo_text || safeTag || 'TP')).slice(0, 5);
    const safeStatus = status !== undefined ? status : (t?.status || 'Escuadra Activa');
    const safeLogoUrl = (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '') ? logoUrl : (t?.logo_url || '');
    const safeBannerUrl = (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') ? bannerUrl : (t?.banner_url || '');
    const safeSocialJson = socialMedia !== undefined ? JSON.stringify(socialMedia) : '{}';
    const safeGameSlug = (gameSlug || t?.game_slug || 'eafc26').slice(0, 50);
    let safeCaptainId = (captainId !== undefined ? captainId : (t?.captain_id || 'usr-1')).slice(0, 36);
    const safeCaptainName = (captainName !== undefined ? captainName : (t?.captain_name || 'Administrador')).slice(0, 100);

    // Validate captain exists
    try {
      const userCheck = await queryDB<{ id: string }>('SELECT id FROM users WHERE id = ?', [safeCaptainId]);
      if (!userCheck || userCheck.length === 0) {
        const firstUser = await queryDB<{ id: string }>('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
        if (firstUser && firstUser.length > 0) {
          safeCaptainId = firstUser[0].id;
        }
      }
    } catch (e) { /* ignore */ }

    if (t) {
      await queryDB(
        `UPDATE teams 
         SET name = ?, tag = ?, description = ?, platform = ?, color = ?, logo_text = ?, status = ?, club_id_ea = ?, redes_sociales = ?, logo_url = ?, banner_url = ?, captain_id = ?, captain_name = ?, updated_at = NOW()
         WHERE id = ?`,
        [safeName, safeTag, safeDescription, safePlatform, safeColor, safeLogoText, safeStatus, clubIdEa || '', safeSocialJson, safeLogoUrl, safeBannerUrl, safeCaptainId, safeCaptainName, teamId]
      );
    } else {
      await queryDB(
        `INSERT INTO teams (id, name, tag, game_slug, captain_id, captain_name, platform, color, logo_text, description, status, logo_url, banner_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamId, safeName, safeTag, safeGameSlug, safeCaptainId, safeCaptainName, safePlatform, safeColor, safeLogoText, safeDescription, safeStatus, safeLogoUrl, safeBannerUrl]
      );
    }

    return apiSuccess({
      team: {
        id: teamId, name: safeName, tag: safeTag, gameSlug: safeGameSlug,
        platform: safePlatform, color: safeColor, logoText: safeLogoText,
        description: safeDescription, status: safeStatus,
        logoUrl: safeLogoUrl, bannerUrl: safeBannerUrl,
      }
    }, 'Ajustes del club actualizados con éxito');
  } catch (error: unknown) {
    console.error('Teams PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando equipo';
    return apiError(message, 500);
  }
}
