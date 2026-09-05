import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAMES_CATALOG } from '../src/lib/games-data';

const root = process.cwd();

describe('visual system v2', () => {
  it('defines a complete and distinct visual identity for every discipline', () => {
    const games = Object.values(GAMES_CATALOG);

    expect(games).toHaveLength(6);
    expect(new Set(games.map((game) => game.visualTheme.scene))).toHaveLength(games.length);

    for (const game of games) {
      expect(game.bannerUrl).toBe(`/images/games-background/${game.slug === 'eafc26' ? 'eafc' : game.slug}.jpg`);
      expect(game.visualTheme.glow).toMatch(/^#[0-9a-f]{6}$/i);
      expect(game.visualTheme.highlight).toMatch(/^#[0-9a-f]{6}$/i);
      expect(game.visualTheme.scene.length).toBeGreaterThan(3);
      expect(game.visualTheme.motif.length).toBeGreaterThan(3);
    }
  });

  it('ships reusable identity and parachute-download primitives', () => {
    const identity = readFileSync(join(root, 'src/components/game/game-identity-card.tsx'), 'utf8');
    const download = readFileSync(join(root, 'src/components/ui/parachute-download-button.tsx'), 'utf8');

    expect(identity).toContain('GameIdentityCard');
    expect(identity).toContain('Card3D');
    expect(download).toContain('ParachuteDownloadButton');
    expect(download).toContain('aria-live');
    expect(download).toContain('prefers-reduced-motion');
  });

  it('includes the standardized light, dark and OLED application themes', () => {
    const provider = readFileSync(join(root, 'src/components/providers/theme-provider.tsx'), 'utf8');
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');

    expect(provider).toContain("'light'");
    expect(provider).toContain("'dark'");
    expect(provider).toContain("'oled'");
    expect(css).toContain('.light .game-portal');
    expect(css).toContain('.dark .game-portal');
    expect(css).toContain('.oled .game-portal');
    expect(css).toContain('.parachute-download');
    expect(css).toContain('.game-scene-grid');
  });
});
