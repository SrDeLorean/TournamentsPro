import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('app UI evolution system', () => {
  it('keeps application palettes independent from gameSlug identity', () => {
    const studio = readFileSync(join(root, 'src/features/design-system/components/app-ui-evolution-studio.tsx'), 'utf8');
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');

    expect(studio).toContain('APP_PALETTES');
    expect(studio).toContain('Graphite Cyan');
    expect(studio).toContain('Midnight Iris');
    expect(studio).toContain('Titanium Mint');
    expect(studio).toContain('Solar Carbon');
    expect(css).toContain('--app-accent');
    expect(css).toContain('.app-ui-studio');
  });

  it('shows three explicit evolution levels for reusable app components', () => {
    const studio = readFileSync(join(root, 'src/features/design-system/components/app-ui-evolution-studio.tsx'), 'utf8');

    expect(studio).toContain('Base funcional');
    expect(studio).toContain('Refinado');
    expect(studio).toContain('Especializado');
    expect(studio).toContain('AppMetricCard');
    expect(studio).toContain('AppEntityRow');
    expect(studio).toContain('AppCommandBar');
  });

  it('uses application tokens in global primitives instead of discipline tokens', () => {
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');

    expect(css).toContain('.ui-card::before');
    expect(css).toContain('var(--app-accent)');
    expect(css).toContain('.app-command-bar');
    expect(css).toContain('.app-entity-row');
  });
});
