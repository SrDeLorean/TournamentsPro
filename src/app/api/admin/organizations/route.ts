import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

// GET /api/admin/organizations - List organizations with full details, logo, banner, prestige data & organizers
export async function GET(request: Request) {
  try {
    const orgs = await queryDB<any>(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id AND u.role = 'Organizador') as organizers_count,
             (SELECT COUNT(*) FROM teams t WHERE t.organization_id = o.id) as teams_count
      FROM organizations o
      ORDER BY o.name ASC
    `);

    // Fetch organizers assigned to each organization
    const parsedOrgs = await Promise.all(
      orgs.map(async (o: any) => {
        let organizers: any[] = [];
        try {
          organizers = await queryDB(
            `SELECT id, name, gamertag, email, role, avatar_url, foto FROM users WHERE organization_id = ? AND role = 'Organizador'`,
            [o.id]
          );
        } catch (e) {}

        return {
          ...o,
          allowedGames: o.allowed_games ? JSON.parse(o.allowed_games) : ['eafc26', 'valorant'],
          socialMedia: o.redes_sociales ? (typeof o.redes_sociales === 'string' ? JSON.parse(o.redes_sociales) : o.redes_sociales) : {},
          organizers,
        };
      })
    );

    return NextResponse.json({ success: true, organizations: parsedOrgs });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error consultando organizaciones' }, { status: 500 });
  }
}

// POST /api/admin/organizations - Create organization (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      tag,
      ownerId,
      allowedGames,
      logoUrl,
      bannerUrl,
      country,
      foundedYear,
      rating,
      website,
      socialMedia,
      organizerIds,
      requesterRole,
    } = body;

    if (requesterRole && requesterRole !== 'Administrador') {
      return NextResponse.json({ error: 'Solo los Administradores pueden crear Organizaciones' }, { status: 403 });
    }

    if (!name || !tag) {
      return NextResponse.json({ error: 'Nombre y Tag de la Organización requeridos' }, { status: 400 });
    }

    const orgId = `org-${Date.now()}`;
    const gamesJson = JSON.stringify(allowedGames || ['eafc26', 'valorant']);
    const socialJson = socialMedia ? JSON.stringify(socialMedia) : '{}';

    await queryDB(
      `INSERT INTO organizations (
        id, name, tag, owner_id, allowed_games, logo_url, banner_url, 
        country, founded_year, rating, website, redes_sociales, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activa')`,
      [
        orgId,
        name,
        tag,
        ownerId || null,
        gamesJson,
        logoUrl || '/images/default/logo-default.png',
        bannerUrl || '/images/default/banner-default.jpg',
        country || 'Venezuela',
        foundedYear || '2020',
        rating || '4.95',
        website || null,
        socialJson,
      ]
    );

    // Assign selected organizers to this organization
    if (Array.isArray(organizerIds) && organizerIds.length > 0) {
      for (const userId of organizerIds) {
        await queryDB(`UPDATE users SET organization_id = ? WHERE id = ?`, [orgId, userId]);
      }
    }

    return NextResponse.json({ success: true, message: 'Organización creada con éxito', organizationId: orgId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando organización' }, { status: 500 });
  }
}

// PUT /api/admin/organizations - Edit organization, prestige data & assign organizers
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      tag,
      ownerId,
      allowedGames,
      logoUrl,
      bannerUrl,
      country,
      foundedYear,
      rating,
      website,
      socialMedia,
      organizerIds,
      status,
      requesterRole,
    } = body;

    if (requesterRole && requesterRole !== 'Administrador') {
      return NextResponse.json({ error: 'Solo los Administradores pueden editar Organizaciones' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de la Organización requerido' }, { status: 400 });
    }

    const gamesJson = allowedGames ? JSON.stringify(allowedGames) : null;
    const socialJson = socialMedia ? JSON.stringify(socialMedia) : null;

    await queryDB(
      `UPDATE organizations 
       SET name = COALESCE(?, name), tag = COALESCE(?, tag), owner_id = COALESCE(?, owner_id), 
           allowed_games = COALESCE(?, allowed_games), logo_url = COALESCE(?, logo_url),
           banner_url = COALESCE(?, banner_url), country = COALESCE(?, country),
           founded_year = COALESCE(?, founded_year), rating = COALESCE(?, rating),
           website = COALESCE(?, website), redes_sociales = COALESCE(?, redes_sociales),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name || null,
        tag || null,
        ownerId || null,
        gamesJson,
        logoUrl || null,
        bannerUrl || null,
        country || null,
        foundedYear || null,
        rating || null,
        website || null,
        socialJson,
        status || null,
        id,
      ]
    );

    // Update organizer assignments
    if (Array.isArray(organizerIds)) {
      // Clear current assignments for this org
      await queryDB(`UPDATE users SET organization_id = NULL WHERE organization_id = ? AND role = 'Organizador'`, [id]);
      // Assign selected organizers
      for (const userId of organizerIds) {
        await queryDB(`UPDATE users SET organization_id = ? WHERE id = ?`, [id, userId]);
      }
    }

    return NextResponse.json({ success: true, message: 'Organización actualizada con éxito' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error actualizando organización' }, { status: 500 });
  }
}
