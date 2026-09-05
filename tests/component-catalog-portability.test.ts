import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function source(path: string) {
  return readFile(path, 'utf8');
}

describe('component catalog portability contract', () => {
  it('keeps /components canonical metadata and the catalog in preview mode', async () => {
    const [route, showcase, library] = await Promise.all([
      source('src/app/components/page.tsx'),
      source('src/features/design-system/components/components-showcase-client.tsx'),
      source('src/features/design-system/components/component-library-lab.tsx'),
    ]);

    expect(route).toContain("export { metadata, default } from '../componentes/page'");
    expect(showcase).toContain('<ImageUploadCard');
    expect(showcase).toContain('mode="preview"');
    expect(showcase).toContain('<GoogleOAuthModal');
    expect(library).toContain('IntersectionObserver');
  });

  it('separates visual previews from persistent upload and authentication effects', async () => {
    const [uploadCard, oauthModal] = await Promise.all([
      source('src/components/ui/image-upload-card.tsx'),
      source('src/components/auth/google-oauth-modal.tsx'),
    ]);

    expect(uploadCard).toContain("mode?: 'persist' | 'preview'");
    expect(uploadCard).toContain("if (mode === 'preview')");
    expect(oauthModal).toContain("mode?: 'authenticate' | 'preview'");
    expect(oauthModal).toContain("if (mode === 'preview')");
    expect(oauthModal).not.toContain('.innerHTML =');
  });

  it('rejects uploads for nonexistent team identifiers before writing files', async () => {
    const uploadRoute = await source('src/app/api/upload/route.ts');

    expect(uploadRoute).toContain("if (!team)");
    expect(uploadRoute).toContain("'TEAM_NOT_FOUND'");
    expect(uploadRoute.indexOf("if (!team)")).toBeLessThan(uploadRoute.indexOf('fs.writeFile'));
  });

  it('preserves accessible dialog scrolling, tabs, labels, and target sizes', async () => {
    const [modal, foundations, showcase, button, pagination] = await Promise.all([
      source('src/components/ui/modal.tsx'),
      source('src/features/design-system/components/final-design-system-page.tsx'),
      source('src/features/design-system/components/components-showcase-client.tsx'),
      source('src/components/ui/button.tsx'),
      source('src/components/ui/pagination.tsx'),
    ]);

    expect(modal).toContain('ui-modal-content min-h-0');
    expect(foundations.match(/aria-controls="foundation-panel-/g)).toHaveLength(4);
    expect(foundations.match(/role="tabpanel"/g)).toHaveLength(4);
    expect(showcase).toContain('htmlFor="catalog-gamertag"');
    expect(showcase).toContain('aria-label={showPassword');
    expect(showcase).toContain('role="switch"');
    expect(button).toContain('min-h-10');
    expect(pagination).toContain('aria-current={isCurrent ? \'page\' : undefined}');
  });

  it('tracks catalog documentation separately from production component debt', async () => {
    const architectureCheck = await source('scripts/check-architecture.mjs');

    expect(architectureCheck).toContain('documentationComponentBudgets');
    expect(architectureCheck).toContain('components-showcase-client.tsx');
    expect(architectureCheck).toContain('final-design-system-page.tsx');
  });
});
