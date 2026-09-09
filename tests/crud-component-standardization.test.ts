import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (file: string) => readFile(path.join(root, file), 'utf8');

describe('formatos compartidos de gestión CRUD', () => {
  it.each([
    'src/features/users/components/users-page-client.tsx',
    'src/features/teams/components/teams-page-client.tsx',
    'src/features/organizations/components/organizations-page-client.tsx',
    'src/app/dashboard/competencias/competitions-client.tsx',
  ])('%s usa la base común de gestión', async (file) => {
    const content = await source(file);
    expect(content).toContain('ManagementPage');
    expect(content).toContain('DataTable');
    expect(content).toContain('ModalForm');
    expect(content).toContain('CrudAlertBanner');
  });

  it('la creación rápida de equipos reutiliza formulario y carga de medios compartidos', async () => {
    const content = await source('src/components/teams/create-team-modal.tsx');
    expect(content).toContain('<ModalForm');
    expect(content).toContain('<BrandedImageUploadSection');
    expect(content).not.toContain("fetch('/api/upload'");
    expect(content).not.toContain('compressImageToWebP');
  });

  it('el perfil no conserva cargadores manuales incompatibles con el endpoint JSON', async () => {
    const [profile, sharedUpload] = await Promise.all([
      source('src/components/user/user-profile-settings-view.tsx'),
      source('src/components/ui/image-upload-card.tsx'),
    ]);
    expect(profile).not.toContain("fetch('/api/upload'");
    expect(profile).not.toContain('type="file"');
    expect(sharedUpload).toContain("entityType?: UploadEntityType");
    expect(sharedUpload).toContain("fetchJson<");
  });
});
