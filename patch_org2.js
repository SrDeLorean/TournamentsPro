const fs = require('fs');

let file = fs.readFileSync('src/app/api/admin/organizations/route.ts', 'utf8');

const postMethod = `
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador']);
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
    } = body;

    if (!isAdministrator(actor)) {
      return NextResponse.json({ error: 'Solo los Administradores pueden crear Organizaciones' }, { status: 403 });
    }

    if (!name || !tag) {
      return NextResponse.json({ error: 'Nombre y Tag de la Organización requeridos' }, { status: 400 });
    }

    const orgId = 'org-' + Date.now();
    await dbProvider.organizations.create({
      id: orgId,
      name,
      tag,
      ownerId: ownerId || actor.userId,
      allowedGames: Array.isArray(allowedGames) ? allowedGames : [],
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      country: country || 'AR',
      createdAt: new Date().toISOString()
    });

    if (Array.isArray(organizerIds) && organizerIds.length > 0) {
      for (const orgUser of organizerIds) {
        await dbProvider.users.update(orgUser, { organizationId: orgId });
      }
    }

    return NextResponse.json({ success: true, message: 'Organización creada con éxito', organizationId: orgId });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error creando organización' }, { status: 500 });
  }
}
`;

if (!file.includes('export async function POST')) {
  fs.writeFileSync('src/app/api/admin/organizations/route.ts', file + postMethod);
}

console.log('Added POST method');
