import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

// GET /api/admin/teams - List teams with status & ban filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug');
    const isBanned = searchParams.get('isBanned');

    let sql = `SELECT * FROM teams WHERE 1=1`;
    const params: any[] = [];

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

    // Parse socialMedia JSON for each team
    const parsedTeams = teams.map((t) => ({
      ...t,
      socialMedia: t.redes_sociales ? (typeof t.redes_sociales === 'string' ? JSON.parse(t.redes_sociales) : t.redes_sociales) : {},
    }));

    return NextResponse.json({ success: true, teams: parsedTeams });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error consultando equipos' }, { status: 500 });
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

    // Validate captainId exists in users
    let safeCaptainId = (captainId || 'usr-1').slice(0, 36);
    try {
      const userCheck = await queryDB('SELECT id FROM users WHERE id = ?', [safeCaptainId]);
      if (!userCheck || userCheck.length === 0) {
        const firstUser = await queryDB('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
        if (firstUser && firstUser.length > 0) safeCaptainId = firstUser[0].id;
      }
    } catch (e) {}

    await queryDB(
      `INSERT INTO teams (
        id, name, tag, game_slug, organization_id, captain_id, captain_name, platform, 
        color, logo_text, description, status, club_id_ea, logo_url, banner_url, redes_sociales, is_banned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        teamId,
        name,
        tag,
        gameSlug || 'eafc26',
        organizationId || null,
        safeCaptainId,
        captainName || 'Capitán Pro',
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

    return NextResponse.json({ success: true, message: 'Equipo creado exitosamente', teamId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando equipo' }, { status: 500 });
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

    const existing = await queryDB('SELECT * FROM teams WHERE id = ?', [teamId]);
    const t = existing && existing.length > 0 ? existing[0] : null;

    const socialJson = socialMedia !== undefined ? JSON.stringify(socialMedia) : (t?.redes_sociales || '{}');

    await queryDB(
      `UPDATE teams 
       SET name = COALESCE(?, name), tag = COALESCE(?, tag), game_slug = COALESCE(?, game_slug),
           organization_id = COALESCE(?, organization_id), captain_id = COALESCE(?, captain_id), captain_name = COALESCE(?, captain_name),
           platform = COALESCE(?, platform), color = COALESCE(?, color), logo_text = COALESCE(?, logo_text),
           description = COALESCE(?, description), status = COALESCE(?, status), club_id_ea = COALESCE(?, club_id_ea),
           logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url), redes_sociales = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        tag,
        gameSlug,
        organizationId,
        captainId,
        captainName,
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

    return NextResponse.json({ success: true, message: 'Equipo actualizado exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error gestionando equipo' }, { status: 500 });
  }
}
