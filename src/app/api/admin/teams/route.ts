import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

// GET /api/admin/teams - List teams with status & ban filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug');
    const isBanned = searchParams.get('isBanned');

    // Auto-ensure column encargados_json exists
    await queryDB(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS encargados_json JSON NULL`).catch(() => {});

    let sql = `SELECT * FROM teams WHERE 1=1`;
    const params: (string | number | null)[] = [];

    if (gameSlug) {
      sql += ` AND game_slug = ?`;
      params.push(gameSlug);
    }
    if (isBanned !== null && isBanned !== undefined) {
      sql += ` AND is_banned = ?`;
      params.push(isBanned === 'true' || isBanned === '1' ? 1 : 0);
    }

    sql += ` ORDER BY created_at DESC`;
    const teams = await queryDB<any>(sql, params);

    // Parse socialMedia and encargados JSON for each team
    const parsedTeams = teams.map((t) => ({
      ...t,
      socialMedia: t.redes_sociales ? (typeof t.redes_sociales === 'string' ? JSON.parse(t.redes_sociales) : t.redes_sociales) : {},
      encargados: t.encargados_json ? (typeof t.encargados_json === 'string' ? JSON.parse(t.encargados_json) : t.encargados_json) : [],
    }));

    return NextResponse.json({ success: true, teams: parsedTeams });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error consultando equipos' }, { status: 500 });
  }
}

// POST /api/admin/teams - Create team
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      tag,
      gameSlug,
      organizationId,
      captainId,
      captainName,
      encargados,
      platform,
      color,
      logoText,
      description,
      status,
      clubIdEa,
      logoUrl,
      bannerUrl,
      socialMedia,
    } = body;

    if (!name || !tag) {
      return NextResponse.json({ error: 'Nombre y Tag del club requeridos' }, { status: 400 });
    }

    const teamId = `tm-${(gameSlug || 'eafc26').slice(0, 8)}-${Date.now()}`.slice(0, 36);
    const socialJson = socialMedia ? JSON.stringify(socialMedia) : '{}';
    const encargadosArray = Array.isArray(encargados) ? encargados : [];
    const encargadosJson = JSON.stringify(encargadosArray);

    // Resolve official captain details from users
    let safeCaptainId = (captainId || '').slice(0, 36);
    let resolvedCaptainName = captainName || 'Capitán Oficial';
    if (safeCaptainId) {
      try {
        const uRows = await queryDB<any>('SELECT id, name, gamertag FROM users WHERE id = ? LIMIT 1', [safeCaptainId]);
        if (uRows && uRows.length > 0) {
          resolvedCaptainName = uRows[0].name || uRows[0].gamertag || resolvedCaptainName;
        } else {
          const firstUser = await queryDB<any>('SELECT id, name, gamertag FROM users ORDER BY created_at ASC LIMIT 1');
          if (firstUser && firstUser.length > 0) {
            safeCaptainId = firstUser[0].id;
            resolvedCaptainName = firstUser[0].name || firstUser[0].gamertag;
          }
        }
      } catch (e) {}
    }

    await queryDB(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS encargados_json JSON NULL`).catch(() => {});

    await queryDB(
      `INSERT INTO teams (
        id, name, tag, game_slug, organization_id, captain_id, captain_name, encargados_json, platform, 
        color, logo_text, description, status, club_id_ea, logo_url, banner_url, redes_sociales, is_banned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        teamId,
        name,
        tag,
        gameSlug || 'eafc26',
        organizationId || null,
        safeCaptainId,
        resolvedCaptainName,
        encargadosJson,
        platform || 'CROSSPLAY',
        color || '#00FF87',
        logoText || tag,
        description || 'Escuadra oficial del circuito eSports.',
        status || 'Activo',
        clubIdEa || null,
        logoUrl || null,
        bannerUrl || null,
        socialJson,
      ]
    );

    // Sync Captain in team_members
    if (safeCaptainId) {
      await queryDB(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
         VALUES (?, ?, ?, 'CAPITAN', 'Capitán')
         ON DUPLICATE KEY UPDATE role_in_team = 'Capitán'`,
        [`tm-cap-${Date.now()}`, teamId, safeCaptainId]
      ).catch(() => {});
    }

    // Sync N Encargados in team_members
    for (const enc of encargadosArray) {
      const encId = typeof enc === 'string' ? enc : enc.id;
      if (encId && encId !== safeCaptainId) {
        await queryDB(
          `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
           VALUES (?, ?, ?, 'ENCARGADO', 'Encargado')
           ON DUPLICATE KEY UPDATE role_in_team = 'Encargado'`,
          [`tm-enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, teamId, encId]
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, message: 'Equipo creado exitosamente', teamId });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error creando equipo' }, { status: 500 });
  }
}

// PUT /api/admin/teams - Ban, Unban or Update Team
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      tag,
      gameSlug,
      organizationId,
      captainId,
      captainName,
      encargados,
      platform,
      color,
      logoText,
      description,
      status,
      clubIdEa,
      logoUrl,
      bannerUrl,
      socialMedia,
      isBanned,
      banReason,
      action,
    } = body;

    const teamId = (id || '').trim().slice(0, 36);

    if (!teamId) {
      return NextResponse.json({ error: 'ID del club requerido' }, { status: 400 });
    }

    if (action === 'UNBAN') {
      await queryDB('UPDATE teams SET is_banned = 0, status = "Activo", ban_reason = NULL, banned_at = NULL WHERE id = ?', [teamId]);
      return NextResponse.json({ success: true, message: 'Equipo desbaneado con éxito' });
    }

    if (action === 'BAN' || isBanned === 1) {
      const reason = banReason || 'Violación de normas disciplinarias';
      await queryDB('UPDATE teams SET is_banned = 1, status = "Baneado", ban_reason = ?, banned_at = NOW() WHERE id = ?', [reason, teamId]);
      return NextResponse.json({ success: true, message: 'Equipo baneado del sistema' });
    }

    await queryDB(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS encargados_json JSON NULL`).catch(() => {});

    // Resolve captain name if captainId is provided
    let resolvedCaptainName = captainName;
    if (captainId) {
      try {
        const uRows = await queryDB<any>('SELECT name, gamertag FROM users WHERE id = ? LIMIT 1', [captainId]);
        if (uRows && uRows.length > 0) {
          resolvedCaptainName = uRows[0].name || uRows[0].gamertag;
        }
      } catch (e) {}
    }

    const socialJson = socialMedia !== undefined ? JSON.stringify(socialMedia) : undefined;
    const encargadosArray = Array.isArray(encargados) ? encargados : undefined;
    const encargadosJson = encargadosArray !== undefined ? JSON.stringify(encargadosArray) : undefined;

    await queryDB(
      `UPDATE teams 
       SET name = COALESCE(?, name), tag = COALESCE(?, tag), game_slug = COALESCE(?, game_slug),
           organization_id = COALESCE(?, organization_id), captain_id = COALESCE(?, captain_id), captain_name = COALESCE(?, captain_name),
           encargados_json = COALESCE(?, encargados_json),
           platform = COALESCE(?, platform), color = COALESCE(?, color), logo_text = COALESCE(?, logo_text),
           description = COALESCE(?, description), status = COALESCE(?, status), club_id_ea = COALESCE(?, club_id_ea),
           logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url),
           redes_sociales = COALESCE(?, redes_sociales), updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        tag,
        gameSlug,
        organizationId,
        captainId,
        resolvedCaptainName,
        encargadosJson,
        platform,
        color,
        logoText,
        description,
        status,
        clubIdEa,
        logoUrl,
        bannerUrl,
        socialJson,
        teamId,
      ]
    );

    // Sync Captain in team_members if provided
    if (captainId) {
      await queryDB(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
         VALUES (?, ?, ?, 'CAPITAN', 'Capitán')
         ON DUPLICATE KEY UPDATE role_in_team = 'Capitán'`,
        [`tm-cap-${Date.now()}`, teamId, captainId]
      ).catch(() => {});
    }

    // Sync N Encargados in team_members if provided
    if (encargadosArray) {
      for (const enc of encargadosArray) {
        const encId = typeof enc === 'string' ? enc : enc.id;
        if (encId && encId !== captainId) {
          await queryDB(
            `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
             VALUES (?, ?, ?, 'ENCARGADO', 'Encargado')
             ON DUPLICATE KEY UPDATE role_in_team = 'Encargado'`,
            [`tm-enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, teamId, encId]
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Equipo actualizado exitosamente' });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error gestionando equipo' }, { status: 500 });
  }
}
