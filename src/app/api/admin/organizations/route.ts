// @ts-nocheck
import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { isAdministrator } from '@/lib/authorization';

export async function GET(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador']);
    const { searchParams } = new URL(request.url);
    const isBanned = searchParams.get('isBanned');

    let where: Record<string, any> = {};
    if (isBanned !== null && isBanned !== undefined) {
      where.isBanned = (isBanned === 'true' || isBanned === '1' ? 1 : 0);
    }

    const organizations = await dbProvider.organizations.findAll({
      where,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });

    const parsedOrganizations = organizations.map(o => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      owner_id: o.ownerId,
      logo_url: o.logoUrl,
      banner_url: o.bannerUrl,
      description: o.description,
      status: o.status,
      is_banned: o.isBanned,
      ban_reason: o.banReason,
      banned_at: o.bannedAt,
      created_at: o.createdAt,
      social_media: o.socialMedia
    }));

    return NextResponse.json({ success: true, organizations: parsedOrganizations });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error consultando organizaciones' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador']);
    const body = await request.json();
    const { id, isBanned, banReason, action, name, slug, description, logoUrl, bannerUrl, socialMedia } = body;

    const orgId = (id || '').trim().slice(0, 36);
    if (!orgId) {
      return NextResponse.json({ error: 'ID de la organización requerido' }, { status: 400 });
    }

    const existing = await dbProvider.organizations.findById(orgId);
    if (!existing) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    if (action === 'UNBAN') {
      await dbProvider.organizations.update(orgId, { isBanned: 0, status: 'Activa', banReason: null, bannedAt: null });
      return NextResponse.json({ success: true, message: 'Organización desbaneada con éxito' });
    }

    if (action === 'BAN' || isBanned === 1 || isBanned === true) {
      const reason = banReason || 'Violación de normas disciplinarias';
      await dbProvider.organizations.update(orgId, { isBanned: 1, status: 'Baneada', banReason: reason, bannedAt: new Date().toISOString() });
      return NextResponse.json({ success: true, message: 'Organización baneada del sistema' });
    }

    await dbProvider.organizations.update(orgId, {
      name, slug, description, logoUrl, bannerUrl, socialMedia
    });

    return NextResponse.json({ success: true, message: 'Organización actualizada exitosamente' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error gestionando organización' }, { status: 500 });
  }
}
