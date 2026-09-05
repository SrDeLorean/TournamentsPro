import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function collectSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

describe('public route visual system', () => {
  it('keeps public color and font decisions inside semantic CSS and shared UI tokens', async () => {
    const visualRoots = [
      'src/features/home',
      'src/features/auth',
      'src/features/game-portal',
      'src/components/public',
      'src/components/game',
    ];
    const publicRouteFiles = [
      'src/app/page.tsx',
      'src/app/informacion/page.tsx',
      'src/app/login/page.tsx',
      'src/app/registro/page.tsx',
      'src/app/equipos/page.tsx',
      'src/app/equipos/[teamId]/page.tsx',
      'src/app/organizaciones/page.tsx',
      'src/app/organizaciones/[orgId]/page.tsx',
      'src/app/organizaciones/[orgId]/competencias/[compId]/page.tsx',
      'src/app/usuarios/page.tsx',
      'src/app/usuarios/[userId]/page.tsx',
      'src/app/[gameSlug]/layout.tsx',
      'src/app/[gameSlug]/page.tsx',
      'src/app/[gameSlug]/[section]/page.tsx',
      'src/app/[gameSlug]/equipos/[teamId]/page.tsx',
      'src/app/[gameSlug]/jugadores/[playerId]/page.tsx',
      'src/app/[gameSlug]/usuarios/page.tsx',
      'src/app/[gameSlug]/usuarios/[playerId]/page.tsx',
      'src/app/[gameSlug]/organizacion/[orgId]/page.tsx',
      'src/app/[gameSlug]/organizacion/[orgId]/competencias/[compId]/page.tsx',
      'src/app/[gameSlug]/error.tsx',
      'src/app/[gameSlug]/not-found.tsx',
    ];
    const visualFiles = [
      ...(await Promise.all(visualRoots.map(collectSourceFiles))).flat(),
      ...publicRouteFiles,
    ];
    const sources = await Promise.all(visualFiles.map(async (file) => ({
      file,
      source: await readFile(file, 'utf8'),
    })));
    const rawTailwindColor = /(?:text|bg|border|from|via|to|ring|shadow|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-[0-9]+)?(?:\/[0-9]+)?/;
    const legacyColorToken = /var\(--accent-(?:cyan|violet|emerald|gold|crimson|success|warning|info)(?:-bg|-hover)?\)/;
    const literalColor = /#[0-9a-f]{3,8}\b/i;
    const fixedFontFamily = /\bfont-(?:mono|sans|serif|display|outfit|jakarta|sora|inter)\b/;
    const inlineVisualStyle = /style=\{\{[\s\S]{0,280}\b(?:background(?:Color|Image)?|borderColor|color|fill|textShadow)\s*:/;

    const offenders = sources.filter(({ source }) => (
      rawTailwindColor.test(source)
      || legacyColorToken.test(source)
      || literalColor.test(source)
      || fixedFontFamily.test(source)
      || inlineVisualStyle.test(source)
    )).map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it('keeps the largest public compositions below their current growth ceilings', async () => {
    const limits = [
      ['src/features/auth/components/auth-page-client.tsx', 900],
      ['src/features/game-portal/components/game-portal-client.tsx', 400],
      ['src/components/game/new-squad-management.tsx', 425],
      ['src/components/game/game-home-hero.tsx', 300],
    ] as const;

    for (const [file, limit] of limits) {
      const source = await readFile(file, 'utf8');
      expect(source.split(/\r?\n/).length, file).toBeLessThan(limit);
    }
  });

  it('keeps executable injection sinks out of public route compositions', async () => {
    const roots = [
      'src/features/home',
      'src/features/auth',
      'src/features/game-portal',
      'src/components/public',
      'src/components/game',
    ];
    const files = (await Promise.all(roots.map(collectSourceFiles))).flat();
    const unsafe = /dangerouslySetInnerHTML|\.innerHTML\s*=|\b(?:eval|Function)\s*\(/;
    const offenders: string[] = [];

    for (const file of files) {
      if (unsafe.test(await readFile(file, 'utf8'))) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it('applies one public shell while preserving per-game brand inheritance', async () => {
    const [layout, gameLayout, styles] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/app/[gameSlug]/layout.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(layout).toContain('public-route-surface');
    expect(gameLayout).toContain('data-game={gameSlug}');
    expect(styles).toContain('.public-route-surface');
    expect(styles).toContain('font-family: var(--font-active');
  });

  it('keeps global public page identity on the application red tokens', async () => {
    const [directory, home, teamProfile, userProfile, accountSettings] = await Promise.all([
      readFile('src/components/public/global-directory-page.tsx', 'utf8'),
      readFile('src/features/home/components/home-page.tsx', 'utf8'),
      readFile('src/app/equipos/[teamId]/page.tsx', 'utf8'),
      readFile('src/app/usuarios/[userId]/page.tsx', 'utf8'),
      readFile('src/app/cuenta/ajustes/page.tsx', 'utf8'),
    ]);

    expect(directory).not.toContain("accent: 'var(--app-positive)'");
    expect(directory).not.toContain('brandColor={game.brandColor');
    expect(directory).not.toContain("variant: 'emerald'");
    expect(directory.match(/accent: 'var\(--app-accent\)'/g)).toHaveLength(3);
    expect(home).not.toMatch(/text-\[var\(--app-(?:positive|warning)\)\]/);
    expect(home).not.toContain('data-game={game.slug}');
    expect(teamProfile).toContain("'--profile-accent': 'var(--app-accent)'");
    expect(userProfile).toContain("'--profile-accent': 'var(--app-accent)'");
    expect(accountSettings).toContain("brandColor=\"var(--app-accent)\"");
  });

  it('resolves entity card accents from the associated game CSS scope', async () => {
    const [card, directory, players, teams, organizations, competitions, organizationProfile, usersAdmin, organizationsAdmin, transfers] = await Promise.all([
      readFile('src/components/ui/esports-card.tsx', 'utf8'),
      readFile('src/components/public/global-directory-page.tsx', 'utf8'),
      readFile('src/components/game/player-card-grid.tsx', 'utf8'),
      readFile('src/components/teams/team-directory.tsx', 'utf8'),
      readFile('src/components/tournaments/organization-directory.tsx', 'utf8'),
      readFile('src/components/tournaments/competition-directory.tsx', 'utf8'),
      readFile('src/components/tournaments/organization-profile-view.tsx', 'utf8'),
      readFile('src/features/users/components/users-page-client.tsx', 'utf8'),
      readFile('src/features/organizations/components/organizations-page-client.tsx', 'utf8'),
      readFile('src/components/transfers/transfer-market.tsx', 'utf8'),
    ]);

    expect(card).toContain('gameSlug?: string;');
    expect(card).toContain('data-game={gameSlug}');
    expect(card).toContain("gameSlug ? 'var(--app-accent)' : brandColor");
    expect(directory).toContain('gameSlug={slug}');
    expect(players).toContain('gameSlug={gameSlug}');
    expect(teams).toContain('gameSlug={tGameSlug}');
    expect(organizations).toContain('gameSlug={gameSlug}');
    expect(competitions).toContain('gameSlug={gameSlug}');
    expect(organizationProfile).toContain('gameSlug={comp.game_slug || gameSlug}');
    expect(organizationProfile).toContain('gameSlug={gameSlug}');
    expect(usersAdmin).toContain('gameSlug={uGameSlug}');
    expect(organizationsAdmin).toContain('gameSlug={primarySlug}');
    expect(transfers.match(/gameSlug=\{currentGameSlug\}/g)).toHaveLength(2);
  });

  it('keeps light surfaces independent from per-game brand tokens', async () => {
    const [portal, styles] = await Promise.all([
      readFile('src/components/game/game-portal-backdrop.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(portal).toContain("'--game-canvas': sem.canvas");
    expect(portal).toContain("'--game-surface': sem.surface");
    expect(portal).toContain("'--game-border': sem.border");
    expect(portal).not.toContain("'--bg-main': sem.canvas");
    expect(portal).not.toContain("'--bg-card': sem.surface");
    expect(styles).toContain(':is(.dark, .oled) .game-portal');
    expect(styles).toMatch(/\.light \.game-portal \{[\s\S]*?--game-portal-surface:/);
  });

  it('aligns the directory header, filters and cards to one shared frame', async () => {
    const [directory, styles] = await Promise.all([
      readFile('src/components/public/global-directory-page.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(directory).toContain('className="public-directory-header"');
    expect(styles).toContain('--public-directory-gutter:');
    expect(styles).toContain('--public-directory-content-gutter:');
    expect(styles).toMatch(/\.public-directory-header[^{]*\{[^}]*max-width:\s*90rem/);
    expect(styles).toMatch(/\.public-directory-header \.ui-page-header-layout[^{]*\{[^}]*padding-inline:\s*var\(--public-directory-gutter\)/);
    expect(styles).toMatch(/\.public-directory-content[^{]*\{[^}]*padding-inline:\s*var\(--public-directory-content-gutter\)/);
  });
});
