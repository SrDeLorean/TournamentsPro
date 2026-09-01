import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('public team experience', () => {
  it('keeps the shared directory card format and adds navigation continuity', () => {
    const directory = readFileSync(join(root, 'src/components/public/global-directory-page.tsx'), 'utf8');
    const card = readFileSync(join(root, 'src/components/ui/esports-card.tsx'), 'utf8');

    expect(directory).toContain('<EsportsCard');
    expect(directory).not.toContain('TeamDirectoryCard');
    expect(card).toContain('ViewTransition');
    expect(card).toContain('transitionTypes={transitionTypes}');
    expect(directory).toContain("transitionTypes={kind === 'teams' ? ['nav-forward'] : undefined}");
  });

  it('uses a full-bleed detail cover without the directory breadcrumb', () => {
    const profile = readFileSync(join(root, 'src/components/teams/team-profile-view.tsx'), 'utf8');
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');

    expect(profile).toContain('ViewTransition');
    expect(profile).toContain('team-identity-');
    expect(profile).not.toContain('public-team-breadcrumb');
    expect(css).toContain('.public-team-page { padding: 0;');
    expect(css).toContain('min-height: min(52rem, 100svh)');
    expect(css).toContain("margin-top: calc(-1 * var(--navbar-stack-height, 3.5rem))");
    expect(css).toContain('width: min(calc(100% - 2rem), 90rem)');
    expect(css).toContain('.public-team-metrics-inner');
    expect(css).toContain('::view-transition-group(.team-morph)');
  });

  it('keeps the sample responsive and motion-safe', () => {
    const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');

    expect(css).toContain('.public-directory-grid');
    expect(css).toContain('.public-team-hero { min-height: 100svh');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('::view-transition-old(*)');
  });
});
