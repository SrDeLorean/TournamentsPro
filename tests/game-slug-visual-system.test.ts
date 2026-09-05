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

describe('game slug route visual system', () => {
  const visualRoots = [
    'src/app/[gameSlug]',
    'src/components/club',
    'src/components/stats',
    'src/components/user',
    'src/components/workspaces',
  ];

  it('inherits every game route color and font from semantic CSS or shared UI tokens', async () => {
    const files = (await Promise.all(visualRoots.map(collectSourceFiles))).flat();
    const rawTailwindColor = /(?:text|bg|border|from|via|to|ring|shadow|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-[0-9]+)?(?:\/[0-9]+)?/;
    const legacyColorToken = /var\(--accent-(?:cyan|violet|emerald|gold|crimson|success|warning|info)(?:-bg|-hover)?\)/;
    const literalColor = /#[0-9a-f]{3,8}\b/i;
    const fixedFontFamily = /\bfont-(?:mono|sans|serif|display|outfit|jakarta|sora|inter)\b/;
    const inlineVisualStyle = /style=\{\{[\s\S]{0,280}\b(?:background(?:Color|Image)?|borderColor|color|fill|textShadow)\s*:/;
    const offenders: string[] = [];

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      if (
        rawTailwindColor.test(source)
        || legacyColorToken.test(source)
        || literalColor.test(source)
        || fixedFontFamily.test(source)
        || inlineVisualStyle.test(source)
      ) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it('keeps executable injection sinks out of the game route subgraph', async () => {
    const files = (await Promise.all(visualRoots.map(collectSourceFiles))).flat();
    const unsafe = /dangerouslySetInnerHTML|\.innerHTML\s*=|\b(?:eval|Function)\s*\(/;
    const offenders: string[] = [];

    for (const file of files) {
      if (unsafe.test(await readFile(file, 'utf8'))) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it('uses one game shell and keeps route entry files thin', async () => {
    const [layout, styles, routeFiles] = await Promise.all([
      readFile('src/app/[gameSlug]/layout.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
      collectSourceFiles('src/app/[gameSlug]'),
    ]);

    expect(layout).toContain('game-route-surface');
    expect(layout).toContain('data-game={gameSlug}');
    expect(styles).toContain('.game-route-surface');
    expect(styles).toContain('font-family: var(--font-active');

    for (const file of routeFiles) {
      const source = await readFile(file, 'utf8');
      expect(source.split(/\r?\n/).length, file).toBeLessThan(150);
    }
  });
});
