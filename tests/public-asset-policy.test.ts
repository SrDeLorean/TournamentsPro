import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const EXTERNALLY_REFERENCED_FILES = [
  'src/features/auth/components/login-page-client.tsx',
  'src/features/auth/components/register-page-client.tsx',
  'src/features/design-system/components/components-showcase-client.tsx',
  'src/lib/teams-data.ts',
];

describe('public image policy', () => {
  it('keeps application images within the configured CSP', async () => {
    const sources = await Promise.all(
      EXTERNALLY_REFERENCED_FILES.map((file) => readFile(file, 'utf8')),
    );

    expect(sources.join('\n')).not.toContain('https://images.unsplash.com');
  });

  it('loads the game portal LCP banner eagerly', async () => {
    const source = await readFile('src/components/game/game-portal-backdrop.tsx', 'utf8');
    expect(source).toMatch(/src=\{game\.bannerUrl\}[\s\S]*?priority/);
  });
});
