import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { getDirectoryEndpoint } from '../src/lib/directory-endpoints';

describe('public directory routing', () => {
  it.each([
    ['users', '/api/users?limit=200'],
    ['teams', '/api/teams?limit=200'],
    ['organizations', '/api/organizations'],
  ] as const)('keeps anonymous %s reads on public APIs', (resource, expected) => {
    expect(getDirectoryEndpoint(resource, false)).toBe(expected);
  });

  it.each([
    ['users', '/api/admin/users'],
    ['teams', '/api/admin/teams'],
    ['organizations', '/api/admin/organizations'],
  ] as const)('uses protected %s APIs only for managers', (resource, expected) => {
    expect(getDirectoryEndpoint(resource, true)).toBe(expected);
  });

  it('separates public directories from dashboard management routes', async () => {
    const publicRoutes = await Promise.all([
      readFile('src/app/organizaciones/page.tsx', 'utf8'),
      readFile('src/app/usuarios/page.tsx', 'utf8'),
      readFile('src/app/equipos/page.tsx', 'utf8'),
    ]);
    const managementRoutes = await Promise.all([
      readFile('src/app/dashboard/organizaciones/page.tsx', 'utf8'),
      readFile('src/app/dashboard/usuarios/page.tsx', 'utf8'),
      readFile('src/app/dashboard/equipos/page.tsx', 'utf8'),
    ]);

    for (const source of publicRoutes) {
      expect(source).toContain('GlobalDirectoryPage');
      expect(source).not.toContain('PageClient />');
      expect(source).not.toContain('requireServerActor');
    }
    for (const source of managementRoutes) {
      expect(source).toContain('requireServerActor');
      expect(source).toContain('PageClient');
      expect(source).not.toContain('GlobalDirectoryPage');
    }
  });

  it('uses only public endpoints and dedicated styling in global public directories', async () => {
    const [directory, styles, layout] = await Promise.all([
      readFile('src/components/public/global-directory-page.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
    ]);

    expect(directory).toContain('fetch(`/api/${kind}?limit=200`)');
    expect(directory).not.toContain('/api/admin/');
    expect(directory).toContain('public-directory-page');
    expect(styles).toContain('.public-directory-hero');
    expect(styles).toContain('.public-directory-grid');
    expect(layout).toContain("pathname.startsWith('/dashboard')");
    expect(layout).toContain('showRoleAwareChrome = isAdminOrOrganizer');
    expect(layout).toContain('<AdminOrganizerHeader');
    expect(layout).toContain(') : <Navbar />}');
  });

  it('keeps every global management destination under dashboard', async () => {
    const [sidebar, legacyMatchday, legacyModeration] = await Promise.all([
      readFile('src/components/layout/admin-organizer-sidebar.tsx', 'utf8'),
      readFile('src/app/matchday/page.tsx', 'utf8'),
      readFile('src/app/moderacion/page.tsx', 'utf8'),
    ]);

    for (const path of ['organizaciones', 'usuarios', 'equipos', 'matchday', 'moderacion']) {
      expect(sidebar).toContain(`/dashboard/${path}`);
    }
    expect(legacyMatchday).toContain("permanentRedirect('/dashboard/matchday')");
    expect(legacyModeration).toContain("permanentRedirect('/dashboard/moderacion')");
  });

  it('shares a dedicated mobile layer across public routes with and without game slug', async () => {
    const [styles, mobileGameNav, publicNavbar, informationPage] = await Promise.all([
      readFile('src/app/globals.css', 'utf8'),
      readFile('src/components/layout/mobile-responsive-subnavbar.tsx', 'utf8'),
      readFile('src/components/layout/navbar.tsx', 'utf8'),
      readFile('src/app/informacion/page.tsx', 'utf8'),
    ]);

    expect(styles).toContain('Mobile-first polish shared by public routes with and without a game slug.');
    expect(styles).toContain('.game-portal-mobile-links');
    expect(styles).toContain('.public-directory-page');
    expect(styles).toContain('.public-info-page');
    expect(mobileGameNav).toContain('showSegmentSwitcher');
    expect(mobileGameNav).not.toContain('Portal competitivo');
    expect(mobileGameNav).not.toContain('<GameSwitcher');
    expect(publicNavbar).toContain('aria-controls="public-mobile-navigation"');
    expect(publicNavbar).toContain('Disciplina activa');
    expect(publicNavbar).toContain("className={isActive ? 'is-active' : ''}");
    expect(informationPage).toContain('public-info-page');
  });
});
