import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('public dashboard entry heroes', () => {
  it('uses the directory hero contract on the system dashboard', async () => {
    const source = await readFile('src/components/public/public-home-sections.tsx', 'utf8');

    expect(source).toContain("import { PageHeader, PageHeaderMetrics } from '@/components/ui/page-header'");
    expect(source).toContain('className="public-home-header"');
    expect(source).toContain('density="cinematic"');
    expect(source).toContain('brandColor="var(--app-accent)"');
    expect(source).toContain('<PageHeaderMetrics');
  });

  it('uses the same contract with discipline CSS color on gameSlug dashboards', async () => {
    const [homeSource, headerSource] = await Promise.all([
      readFile('src/components/game/game-home-hero.tsx', 'utf8'),
      readFile('src/components/game/game-portal-section-header.tsx', 'utf8'),
    ]);

    expect(homeSource).toContain("import { GamePortalSectionHeader } from '@/components/game/game-portal-section-header'");
    expect(homeSource).toContain('<GamePortalSectionHeader game={game} section="home" summary={summary} />');
    expect(headerSource).toContain("import { PageHeader, PageHeaderMetrics, type PageHeaderMetric } from '@/components/ui/page-header'");
    expect(headerSource).toContain('className="game-dashboard-header game-portal-section-header"');
    expect(headerSource).toContain('density="cinematic"');
    expect(headerSource).toContain('brandColor={game.brandColor}');
    expect(headerSource).toContain('<PageHeaderMetrics');
    expect(homeSource).not.toContain('<div className="game-home-hero');
  });

  it('shares the compact header across every public gameSlug section without duplicate child headers', async () => {
    const [portalSource, sectionSource, headerSource] = await Promise.all([
      readFile('src/features/game-portal/components/game-portal-client.tsx', 'utf8'),
      readFile('src/lib/section-config.ts', 'utf8'),
      readFile('src/components/game/game-portal-section-header.tsx', 'utf8'),
    ]);
    const publicSections = [
      'organizaciones', 'competencias', 'clasificacion', 'partidos', 'traspasos',
      'equipos', 'jugadores', 'tops', 'infografia', 'datos',
    ];

    for (const section of publicSections) {
      expect(sectionSource).toContain(`'${section}'`);
      expect(headerSource).toContain(`case '${section}':`);
    }

    expect(portalSource).toContain("activeSection !== 'home' && isPublicGameSection(activeSection)");
    expect(portalSource).toContain('<GamePortalSectionHeader game={game} section={activeSection} summary={initialOverview} />');
    expect(portalSource.match(/hideHeader/g)?.length).toBeGreaterThanOrEqual(6);
  });
});
