import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(path, 'utf8');

describe('shared fast tab navigation', () => {
  it('centralizes tablists with delegated keyboard and touch interaction', async () => {
    const [primitive, css] = await Promise.all([
      read('src/components/ui/tab-list.tsx'),
      read('src/app/globals.css'),
    ]);

    expect(primitive).toContain('role="tablist"');
    expect(primitive).toContain("'ArrowLeft', 'ArrowRight', 'Home', 'End'");
    expect(primitive).toContain("tabs[nextIndex]?.click()");
    expect(css).toContain(".ui-fast-tablist [role='tab']");
    expect(css).toContain('touch-action: manipulation');
    expect(css).toContain('transition-duration: 120ms');
  });

  it('uses the shared tablist in every explicit tablist view', async () => {
    const sources = await Promise.all([
      read('src/components/dashboard/management-ui.tsx'),
      read('src/components/layout/sub-sub-navbar.tsx'),
      read('src/components/layout/mobile-responsive-subnavbar.tsx'),
      read('src/components/layout/authenticated-context-subnavbar.tsx'),
      read('src/components/public/public-portal-overview.tsx'),
      read('src/components/tournaments/classification-view.tsx'),
      read('src/features/design-system/components/app-ui-evolution-studio.tsx'),
      read('src/features/design-system/components/final-design-system-page.tsx'),
    ]);

    sources.forEach((source) => expect(source).toContain('<TabList'));
  });

  it('switches competition panels without a redundant server navigation', async () => {
    const source = await read('src/app/dashboard/competencias/[id]/competition-tabs.tsx');

    expect(source).toContain("window.history.pushState(null, '',");
    expect(source).not.toContain('router.push(`${pathname}?');
  });

  it('warms data-backed tabs and reuses their results', async () => {
    const [squad, recruitment, transfers] = await Promise.all([
      read('src/components/game/new-squad-management.tsx'),
      read('src/app/club/reclutamiento/page.tsx'),
      read('src/components/transfers/transfer-market.tsx'),
    ]);

    expect(squad).toContain('useWarmedTabData');
    expect(squad).toContain('tabs: SQUAD_TABS');
    expect(recruitment).toContain('offersCacheKeyRef');
    expect(recruitment).toContain('loadOutgoingOffers(false, true)');
    expect(transfers).toContain('activeListingsCacheKeyRef');
    expect(transfers).toContain('loadCompletedTransfers(true)');
  });
});
