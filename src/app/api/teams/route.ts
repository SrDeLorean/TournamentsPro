// @ts-nocheck
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { teamCreateBodySchema, teamUpdateBodySchema } from '@/lib/api-schemas';
import { canManageTeam, isAdministrator } from '@/lib/authorization';
import {
  TeamRow,
  mapTeamRowToData,
  apiSuccess,
  apiError,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api-types';
import { createTeamService, updateManagedTeamService } from '@/lib/services';



// GET /api/teams — List teams with optional game filter and pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');
  const { page, limit } = parsePaginationParams(searchParams);

  try {
    const where: any = {};
    if (gameSlug && !['ALL', 'all', 'TODOS', 'todas'].includes(gameSlug)) {
      where.game_slug = gameSlug;
    }

    const { dbProvider } = await import('@/lib/db/provider');
    const offset = (page - 1) * limit;
    
    // Using dbProvider directly
    const teamsData = await dbProvider.teams.findAll({ where, limit, offset, orderBy: 'created_at', orderDirection: 'DESC' });
    // Total count workaround (fallback since we don't have a count method)
    const total = teamsData.length;

    const teams = teamsData.map(t => ({
      id: t.id,
      name: t.name,
      tag: t.tag,
      game_slug: t.gameSlug,
      platform: t.platform,
      color: t.color,
      logo_text: t.logoText,
      description: t.description,
      status: t.status,
      logo_url: t.logoUrl,
      banner_url: t.bannerUrl,
      captain_id: t.captainId,
      captain_name: t.captainName,
      created_at: t.createdAt,
    }));
    
    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess({ teams }, undefined, meta);
  } catch (err) {
    console.error(err);
    return apiSuccess({ teams: [] });
  }
}

// POST /api/teams — Create team
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const { dbProvider } = await import('@/lib/db/provider');

    const parsedBody = teamCreateBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('Nombre y tag del equipo son requeridos', 400);
    const body = parsedBody.data;
    const { id, name, tag, gameSlug, captainId, captainName, platform, color, logoText, logoUrl, bannerUrl, description, vacantPositions } = body;

    if (!name || !tag) {
      return apiError('Nombre y tag del equipo son requeridos', 400);
    }

    const teamId = id || undefined;
    const teamDesc = description || 'Escuadra oficial del circuito eSports.';

    // Check if user already owns a team in this discipline
    const existingById = teamId
      ? await dbProvider.teams.findById(teamId)
      : null;
    if (existingById) {
      return apiError('Ya existe un equipo con ese ID', 409, 'DUPLICATE_TEAM');
    }

    const effectiveCaptainId = isAdministrator(actor) && captainId ? captainId : actor.userId;
    const captainUser = await dbProvider.users.findById(effectiveCaptainId);
    const effectiveCaptainName = isAdministrator(actor) && captainName
      ? captainName
      : (captainUser?.gamertag || captainUser?.name || 'Capitán');
    const allowedGames = ['eafc26', 'valorant', 'csgo', 'lol', 'rocketleague', 'fortnite'] as const;
    const effectiveGameSlug = allowedGames.find((slug) => slug === gameSlug) || 'eafc26';
    const allowedPlatforms = ['PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY'] as const;
    const effectivePlatform = allowedPlatforms.find((item) => item === platform) || 'CROSSPLAY';
    const result = await createTeamService({
      id: teamId,
      name,
      tag: tag || 'TP',
      gameSlug: effectiveGameSlug,
      platform: effectivePlatform,
      color: color || '#00F0FF',
      logoText: logoText || 'TP',
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      description: teamDesc,
      vacantPositions: vacantPositions || [],
    }, effectiveCaptainId, effectiveCaptainName);
    if (!result.success) return apiError(result.error || 'No se pudo crear el equipo', 409, result.code);
    return apiSuccess({ team: result.team }, 'Equipo creado exitosamente');
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Teams POST error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando equipo';
    return apiError(message, 500);
  }
}

// PUT /api/teams — Update team
export async function PUT(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const parsedBody = teamUpdateBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('ID del club requerido', 400);
    const body = parsedBody.data;
    const { id, name, tag, description, platform, clubIdEa, color, logoText, logoUrl, bannerUrl, status, gameSlug, captainId, captainName } = body;

    const teamId = (id || '').trim().slice(0, 36);
    if (!teamId) {
      return apiError('ID del club requerido', 400);
    }

    // Check if team exists and enforce ownership before applying changes
    const existingTeam = await dbProvider.teams.findById(teamId);
    if (!existingTeam) {
      return apiError('Equipo no encontrado', 404);
    }
    const t = existingTeam;
    
    // Instead of loadTeamScope with queryDB, use our new repo method
    const managers = await dbProvider.teams.getManagers(teamId);
    const teamScope = {
      organizationId: existingTeam.organizationId,
      captainId: existingTeam.captainId,
      managerIds: managers.map(m => m.userId),
    };

    if (!teamScope || !canManageTeam(actor, teamScope)) {
      return apiError('No tienes permisos para gestionar este equipo', 403, 'FORBIDDEN');
    }

    const safeName = (name ?? t?.name ?? 'Escuadra Pro').slice(0, 100);
    const safeTag = (tag ?? t?.tag ?? 'TP').slice(0, 10);
    const safeDescription = description ?? t.description ?? 'Escuadra oficial del circuito eSports.';
    const safePlatform = (platform ?? t?.platform ?? 'CROSSPLAY').slice(0, 20);
    const safeColor = (color ?? t?.color ?? '#00F0FF').slice(0, 20);
    const safeLogoText = (logoText ?? t?.logo_text ?? safeTag ?? 'TP').slice(0, 5);
    const safeStatus = status ?? t.status ?? 'Escuadra Activa';
    const safeLogoUrl = (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '') ? logoUrl : (t?.logo_url || '');
    const safeBannerUrl = (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') ? bannerUrl : (t?.banner_url || '');
    const safeGameSlug = (gameSlug || t?.game_slug || 'eafc26').slice(0, 50);
    let safeCaptainId = (isAdministrator(actor) ? captainId : null) ?? t.captainId ?? actor.userId;
    safeCaptainId = safeCaptainId.slice(0, 36);
    const safeCaptainName = ((isAdministrator(actor) ? captainName : null) ?? t.captainName ?? actor.userId).slice(0, 100);

    // Validate captain exists
    try {
      const userCheck = await dbProvider.users.findById(safeCaptainId);
      if (!userCheck) {
        // Fallback to the first user
        const firstUser = await dbProvider.users.findAll({ orderBy: 'created_at', orderDirection: 'ASC', limit: 1 });
        if (firstUser && firstUser.length > 0) {
          safeCaptainId = firstUser[0].id;
        }
      }
    } catch { /* ignore */ }

    const result = await updateManagedTeamService(teamId, {
      name: safeName,
      tag: safeTag,
      description: safeDescription,
      platform: safePlatform,
      color: safeColor,
      logoText: safeLogoText,
      status: safeStatus,
      clubIdEa: clubIdEa || '',
      logoUrl: safeLogoUrl,
      bannerUrl: safeBannerUrl,
      captainId: isAdministrator(actor) && captainId !== undefined ? safeCaptainId : undefined,
      captainName: isAdministrator(actor) && captainName !== undefined ? safeCaptainName : undefined,
      gameSlug: safeGameSlug,
    });
    if (!result.success) return apiError(result.error || 'No se pudo actualizar el equipo', 409);

    return apiSuccess({
      team: {
        id: teamId, name: safeName, tag: safeTag, gameSlug: safeGameSlug,
        platform: safePlatform, color: safeColor, logoText: safeLogoText,
        description: safeDescription, status: safeStatus,
        logoUrl: safeLogoUrl, bannerUrl: safeBannerUrl,
      }
    }, 'Ajustes del club actualizados con éxito');
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Teams PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando equipo';
    return apiError(message, 500);
  }
}

