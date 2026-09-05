import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(path, 'utf8');

describe('shared navigation design system', () => {
  it('uses the shared navigation primitives across every navigation level', async () => {
    const [navbar, adminNavbar, gameNavbar, contextNavbar, mobileNavbar, teamNavbar, subTabs] = await Promise.all([
      read('src/components/layout/navbar.tsx'),
      read('src/components/layout/admin-navbar.tsx'),
      read('src/components/layout/game-sub-navbar.tsx'),
      read('src/components/layout/authenticated-context-subnavbar.tsx'),
      read('src/components/layout/mobile-responsive-subnavbar.tsx'),
      read('src/components/layout/team-admin-subnavbar.tsx'),
      read('src/components/layout/sub-sub-navbar.tsx'),
    ]);

    expect(navbar).toContain('ui-navigation-bar');
    expect(adminNavbar).toContain('ui-navigation-bar');
    expect(gameNavbar).toContain('ui-navigation-tier');
    expect(contextNavbar).toContain('ui-navigation-tier');
    expect(mobileNavbar).toContain('ui-navigation-tier');
    expect(teamNavbar).toContain('ui-navigation-tier');
    expect(subTabs).toContain('ui-navigation-tier');
  });

  it('keeps the global shell red and hands game routes their CSS brand token', async () => {
    const [layout, footer, styles] = await Promise.all([
      read('src/components/layout/app-layout-wrapper.tsx'),
      read('src/components/layout/footer.tsx'),
      read('src/app/globals.css'),
    ]);

    expect(layout).toContain('GAMES_CATALOG[routeGameSlug]');
    expect(layout).toContain('<Footer compact={showRoleAwareChrome} brandColor={routeGame?.brandColor} />');
    expect(footer).toContain("'--navigation-brand': brandColor || 'var(--app-accent)'");
    expect(styles).toContain('--navigation-brand: var(--app-accent)');
    expect(styles).toContain('.ui-navigation-link');
    expect(styles).toContain('.ui-navigation-icon-button');
    expect(styles).toContain('.ui-navigation-popover');
  });

  it('builds the footer form from the shared UI controls', async () => {
    const footer = await read('src/components/layout/footer.tsx');

    expect(footer).toContain("from '@/components/ui/input'");
    expect(footer).toContain("from '@/components/ui/button'");
    expect(footer).toContain('<Input');
    expect(footer).toContain('<Button');
  });
});
