const fs = require('fs');
let file = fs.readFileSync('src/app/api/admin/organizations/route.ts', 'utf8');

const deleteMethod = `
export async function DELETE(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador']);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de la organización requerido' }, { status: 400 });
    }

    const existing = await dbProvider.organizations.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Optional: Unassign organizers first to prevent orphan data or foreign key constraints
    const organizers = await dbProvider.users.findAll({ where: { organization_id: id } });
    for (const org of organizers) {
      await dbProvider.users.update(org.id, { organizationId: null });
    }

    await dbProvider.organizations.delete(id);

    return NextResponse.json({ success: true, message: 'Organización eliminada con éxito' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error eliminando organización' }, { status: 500 });
  }
}
`;

if (!file.includes('export async function DELETE')) {
  fs.writeFileSync('src/app/api/admin/organizations/route.ts', file + deleteMethod);
  console.log('Added DELETE method');
} else {
  console.log('DELETE method already exists');
}
