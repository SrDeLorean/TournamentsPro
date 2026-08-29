import { dbProvider } from '@/lib/db/provider';
import { hashPassword } from '@/lib/auth';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canManageUser, isAdministrator } from '@/lib/authorization';
import { revokeUserSessions, writeSecurityAudit } from '@/lib/security';
import { userCreateBodySchema, userUpdateBodySchema } from '@/lib/api-schemas';
import {
  UserRow,
  mapUserRowToProfile,
  apiSuccess,
  apiError,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api-types';

// GET /api/users — List users or get single user by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const gameSlug = searchParams.get('gameSlug');
    const { page, limit } = parsePaginationParams(searchParams);

    if (userId) {
      // Single user lookup
      const user = await dbProvider.users.findById(userId);
      if (!user) {
        return apiError('Usuario no encontrado', 404);
      }
      
      const userProfile = mapUserRowToProfile(user as any);
      
      // AGGREGATE STATS
      // Using query provider for stats as it's a direct relation on match_player_stats.
      // Wait, dbProvider.query throws in Supabase. Let's just catch it and return 0 stats for now if it throws.
      let statsRows: any[] = [];
      try {
        statsRows = await dbProvider.query<{stats_json: string}>('SELECT stats_json FROM match_player_stats WHERE player_id = ?', [userId]);
      } catch (e) {
        // Fallback for Supabase until stats repository is built
      }
      
      const aggregatedStats: Record<string, number> = { matches: statsRows.length };
      
      const rateMetrics = ['acs', 'adr', 'hs_percent', 'kd', 'score', 'winrate'];
      const statCounts: Record<string, number> = {};

      statsRows.forEach(row => {
          try {
            const stats = typeof row.stats_json === 'string' ? JSON.parse(row.stats_json) : row.stats_json;
            for (const key in stats) {
                if (!aggregatedStats[key]) {
                  aggregatedStats[key] = 0;
                  statCounts[key] = 0;
                }
                aggregatedStats[key] += Number(stats[key]) || 0;
                statCounts[key] += 1;
            }
          } catch(e) {}
      });

      // Calcular promedios para métricas de ratio
      for (const key of rateMetrics) {
        if (aggregatedStats[key] && statCounts[key]) {
          aggregatedStats[key] = Number((aggregatedStats[key] / statCounts[key]).toFixed(2));
        }
      }

      return apiSuccess({ user: { ...userProfile, aggregatedStats } });
    }

    // List users with optional filters and pagination
    const findOptions: any = { limit, offset: (page - 1) * limit, where: {}, orderBy: 'created_at', orderDirection: 'DESC' };
    
    if (gameSlug && gameSlug !== 'ALL' && gameSlug !== 'all') {
      findOptions.where.primary_game_slug = gameSlug;
    }

    // Get total count
    const total = await dbProvider.users.count(findOptions);

    // Paginated query
    const rows = await dbProvider.users.findAll(findOptions);
    const users = rows.map(u => mapUserRowToProfile(u as any));
    const meta = buildPaginationMeta(page, limit, total);

    return apiSuccess({ users }, undefined, meta);
  } catch (error: unknown) {
    console.error('Users GET error:', error);
    const message = error instanceof Error ? error.message : 'Error consultando usuarios';
    return apiError(message, 500);
  }
}

// POST /api/users — Create user
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador']);
    const parsedBody = userCreateBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('Nombre y gamertag son requeridos', 400);
    const body = parsedBody.data;
    const { id, name, email, gamertag, role, primaryGame, platform, position, rankBadge, status } = body;

    if (!gamertag || !name) {
      return apiError('Nombre y gamertag son requeridos', 400);
    }

    const newId = id || `usr-${Date.now()}`;
    const userRole = role || 'Jugador';
    const gameSlug = primaryGame || 'eafc26';
    const userPlatform = platform || 'CROSSPLAY';

    const userData: any = {
      id: newId,
      name,
      email: email || `${gamertag.toLowerCase().replace(/[^a-z0-9]/g, '')}@tournamentspro.com`,
      gamertag,
      role: userRole,
      primary_game_slug: gameSlug,
      platform: userPlatform,
      position: position || 'DFC',
      rank_badge: rankBadge || 'División 1',
      status: status || 'Buscando Club'
    };

    const existing = await dbProvider.users.findById(newId);
    if (existing) {
        await dbProvider.users.update(newId, { name: userData.name, gamertag: userData.gamertag, role: userData.role });
    } else {
        await dbProvider.users.create(userData);
    }

    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_USER_CREATED',
      resourceType: 'user',
      resourceId: newId,
      metadata: { assignedRole: userRole },
    });

    return apiSuccess({ user: { id: newId, ...body } }, 'Usuario creado exitosamente');
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Users POST error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando usuario';
    return apiError(message, 500);
  }
}

// PUT /api/users — Update user profile
export async function PUT(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const parsedBody = userUpdateBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('Falta ID de usuario', 400);
    const body = parsedBody.data;
    const {
      id,
      name,
      gamertag,
      platform,
      position,
      secondaryPosition,
      country,
      birthDate,
      phone,
      bio,
      avatarUrl,
      foto,
      bannerUrl,
      instagram,
      facebook,
      twitch,
      youtube,
      tiktok,
      discord,
      twitter,
      website,
      whatsapp,
      gameProfiles,
      newPassword,
      password,
    } = body;

    if (!id) {
      return apiError('Falta ID de usuario', 400);
    }

    const u = await dbProvider.users.findById(id) as any;
    if (!u) {
      return apiError('Usuario no encontrado', 404);
    }

    if (!canManageUser(actor, {
      userId: u.id,
      role: u.role || 'Jugador',
      organizationId: u.organization_id || u.organizationId,
    })) {
      return apiError('No tienes permisos para editar este perfil', 403, 'FORBIDDEN');
    }

    const finalName = name !== undefined ? name : (u.name || 'Atleta Pro');
    const finalGamertag = gamertag !== undefined ? gamertag : (u.gamertag || 'Gamertag');
    const userFoto = foto || avatarUrl || u.avatar_url || u.avatarUrl || '/images/default/logo-default.png';
    const userBanner = bannerUrl || '/images/default/banner-default.jpg';
    const userGameProfiles = typeof gameProfiles === 'string'
      ? gameProfiles
      : JSON.stringify(gameProfiles ?? {});

    const updateData: any = {
        name: finalName,
        gamertag: finalGamertag,
        platform: platform !== undefined ? platform : (u.platform || 'CROSSPLAY'),
        position: position !== undefined ? position : (u.position || 'DFC'),
        secondary_position: secondaryPosition !== undefined ? secondaryPosition : (u.secondary_position || u.secondaryPosition),
        country: country !== undefined ? country : u.country,
        birth_date: birthDate !== undefined ? birthDate : (u.birth_date || u.birthDate),
        phone: phone !== undefined ? phone : u.phone,
        bio: bio !== undefined ? bio : u.bio,
        avatar_url: userFoto,
        foto: userFoto,
        banner_url: userBanner,
        instagram: instagram !== undefined ? instagram : u.instagram,
        facebook: facebook !== undefined ? facebook : u.facebook,
        twitch: twitch !== undefined ? twitch : u.twitch,
        youtube: youtube !== undefined ? youtube : u.youtube,
        tiktok: tiktok !== undefined ? tiktok : u.tiktok,
        discord: discord !== undefined ? discord : u.discord,
        twitter: twitter !== undefined ? twitter : u.twitter,
        website: website !== undefined ? website : u.website,
        whatsapp: whatsapp !== undefined ? whatsapp : u.whatsapp,
        game_profiles: userGameProfiles,
    };

    const pwdToUpdate = newPassword || password;
    if (pwdToUpdate && !isAdministrator(actor) && actor.userId !== id) {
      return apiError('No puedes cambiar la contraseña de otro usuario', 403, 'FORBIDDEN');
    }
    if (pwdToUpdate && typeof pwdToUpdate === 'string' && pwdToUpdate.trim().length >= 6) {
      updateData.password_hash = await hashPassword(pwdToUpdate.trim());
      await revokeUserSessions(id);
    }

    await dbProvider.users.update(id, updateData);

    return apiSuccess(
      { user: { ...u, ...body, foto: userFoto, avatarUrl: userFoto, bannerUrl: userBanner } },
      'Perfil actualizado correctamente'
    );
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Users PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando perfil';
    return apiError(message, 500);
  }
}

