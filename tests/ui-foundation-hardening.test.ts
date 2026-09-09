import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(path, 'utf8');

describe('UI foundation hardening', () => {
  it('renders a single management disclosure and keeps the games menu reachable', async () => {
    const [navbar, navLinks] = await Promise.all([
      read('src/components/layout/navbar.tsx'),
      read('src/components/layout/nav-links.tsx'),
    ]);

    expect(navbar.match(/className="management-navbar-toggle/g)).toHaveLength(1);
    expect(navbar).toContain("data-mobile-open={managementNavigation.isMobileOpen}");
    expect(navbar).toContain("data-desktop-collapsed={managementNavigation.isDesktopCollapsed}");
    expect(navLinks).not.toContain('onMouseLeave={() => setIsGamesOpen(false)}');
    expect(navLinks).toContain('onMouseLeave={scheduleGamesClose}');
    expect(navLinks).toContain('onFocus={() => setIsGamesOpen(true)}');
    expect(navLinks).toContain('aria-haspopup="menu"');
  });

  it('shares accessible loading, empty and error primitives across routes', async () => {
    const [loading, empty, error, rootLoading, directoryLoading, rootError] = await Promise.all([
      read('src/components/ui/route-loading.tsx'),
      read('src/components/ui/empty-state.tsx'),
      read('src/components/ui/route-error-state.tsx'),
      read('src/app/loading.tsx'),
      read('src/app/equipos/loading.tsx'),
      read('src/app/error.tsx'),
    ]);

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-busy="true"');
    expect(empty).toContain('role="status"');
    expect(error).toContain('role="alert"');
    expect(error).toContain('aria-live="assertive"');
    expect(rootLoading).toContain('<RouteLoading');
    expect(directoryLoading).toContain('<RouteLoading');
    expect(rootError).toContain('<RouteErrorState');
  });

  it('moves cross-cutting foundations into focused CSS modules', async () => {
    const [layout, navigation, accessibility, responsive, states] = await Promise.all([
      read('src/app/layout.tsx'),
      read('src/styles/navigation.css'),
      read('src/styles/accessibility.css'),
      read('src/styles/responsive-data.css'),
      read('src/styles/route-states.css'),
    ]);

    expect(layout).toContain("import '../styles/navigation.css'");
    expect(layout).toContain("import '../styles/tokens.css'");
    expect(layout).toContain("import '../styles/accessibility.css'");
    expect(layout).toContain("import '../styles/responsive-data.css'");
    expect(layout).toContain("import '../styles/route-states.css'");
    expect(navigation).toContain('.management-navbar-toggle');
    expect(accessibility).toContain(':focus-visible');
    expect(responsive).toContain('env(safe-area-inset-bottom)');
    expect(states).toContain('.ui-route-state');
  });
});
