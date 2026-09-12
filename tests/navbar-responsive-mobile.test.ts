import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Navbar responsive mobile & desktop positioning contracts', () => {
  it('does not override ui-navigation-popover with an unlayered position: absolute', async () => {
    const css = await readFile('src/app/globals.css', 'utf8');
    expect(css).not.toMatch(/\.ui-navigation-popover\s*\{\s*position:\s*absolute;\s*\}/);
  });

  it('keeps backdrop-filter on pseudo-elements so navbar headers never establish a containing block trap', async () => {
    const css = await readFile('src/app/globals.css', 'utf8');
    const appNavbarRule = css.match(/\.app-navbar\s*\{([^}]+)\}/);
    expect(appNavbarRule).toBeTruthy();
    expect(appNavbarRule![1]).not.toContain('backdrop-filter');

    expect(css).toContain('.app-navbar::before');
    expect(css).toContain('.game-portal-navbar::before');
  });

  it('guarantees fixed popover sizing and solid background on mobile viewports', async () => {
    const css = await readFile('src/app/globals.css', 'utf8');
    expect(css).toContain('.ui-navigation-popover.fixed');
    expect(css).toContain('.management-popover.fixed');
    expect(css).toContain('max-width: calc(100vw - 1rem)');
  });

  it('renders mobile backdrop dismiss buttons for all popovers in admin-navbar', async () => {
    const adminNavbar = await readFile('src/components/layout/admin-navbar.tsx', 'utf8');
    expect(adminNavbar).toContain('aria-label="Cerrar selector de clubes"');
    expect(adminNavbar).toContain('aria-label="Cerrar menú explorar"');
    expect(adminNavbar).toContain('aria-label="Cerrar preferencias"');
    expect(adminNavbar).toContain('aria-label="Cerrar menú de usuario"');

    expect(adminNavbar).toContain('fixed inset-x-2 top-14');
    expect(adminNavbar).toContain('sm:absolute');
  });

  it('renders mobile backdrop dismiss buttons in navbar.tsx and renders MobilePublicNavigation outside header', async () => {
    const navbar = await readFile('src/components/layout/navbar.tsx', 'utf8');
    expect(navbar).toContain('aria-label="Cerrar preferencias"');
    expect(navbar).toContain('aria-label="Cerrar menú de usuario"');

    const headerClosingIndex = navbar.lastIndexOf('</header>');
    const mobileNavIndex = navbar.indexOf('<MobilePublicNavigation');
    expect(headerClosingIndex).toBeGreaterThan(0);
    expect(mobileNavIndex).toBeGreaterThan(headerClosingIndex);
  });

  it('ensures MobilePublicNavigation has full dynamic viewport height and solid card background', async () => {
    const mobileNav = await readFile('src/components/layout/mobile-public-navigation.tsx', 'utf8');
    expect(mobileNav).toContain('h-[calc(100dvh-3.5rem)]');
    expect(mobileNav).toContain('bg-[var(--bg-card)]');
  });
});
