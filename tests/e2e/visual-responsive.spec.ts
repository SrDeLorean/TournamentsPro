import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'phone-320', width: 320, height: 720 },
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
];
const themes = ['light', 'dark', 'oled'] as const;

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`portada ${theme} sin desborde horizontal en ${viewport.name}`, async ({ page }, testInfo) => {
      await page.addInitScript(([storageKey, selectedTheme]) => localStorage.setItem(storageKey, selectedTheme), ['tournamentspro:theme:v2', theme]);
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await testInfo.attach(`home-${theme}-${viewport.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  }
}

test('el selector Juegos permanece operable con mouse y teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const games = page.getByRole('button', { name: /juegos/i });
  await games.hover();
  const menu = page.locator('#public-games-menu');
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem').first().hover();
  await expect(menu).toBeVisible();
  await games.focus();
  await expect(games).toHaveAttribute('aria-expanded', 'true');
});

for (const entry of [
  { name: 'sistema', url: '/', selector: '.public-home-header' },
  { name: 'gameSlug', url: '/eafc26', selector: '.game-dashboard-header' },
  { name: 'equipos-global', url: '/equipos', selector: '.public-directory-header' },
  { name: 'organizaciones-global', url: '/organizaciones', selector: '.public-directory-header' },
  { name: 'usuarios-global', url: '/usuarios', selector: '.public-directory-header' },
  { name: 'informacion-global', url: '/informacion', selector: '.public-info-header' },
]) {
  test(`entrada cinematográfica adaptable del dashboard ${entry.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(entry.url);
    const header = page.locator(entry.selector);
    await expect(header).toBeVisible();
    await expect(header.locator('.ui-page-header-metrics')).toBeVisible();
    expect(await header.evaluate((element) => element.getBoundingClientRect().right <= window.innerWidth + 1)).toBe(true);
    await testInfo.attach(`dashboard-entry-${entry.name}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}

test('todas las vistas públicas gameSlug comparten un único encabezado compacto', async ({ page }) => {
  const sections = [
    'organizaciones', 'competencias', 'clasificacion', 'partidos', 'traspasos',
    'equipos', 'jugadores', 'usuarios', 'tops', 'infografia', 'datos',
  ];
  await page.setViewportSize({ width: 375, height: 812 });

  for (const section of sections) {
    await page.goto(`/eafc26/${section}`);
    const headers = page.locator('.game-portal-section-header');
    await expect(headers).toHaveCount(1);
    await expect(headers.locator('.ui-page-header-metrics')).toBeVisible();
    expect(await headers.evaluate((element) => element.getBoundingClientRect().right <= window.innerWidth + 1)).toBe(true);
  }
});

const roleCases = [
  { role: 'administrador', identifier: process.env.E2E_ADMIN_IDENTIFIER, password: process.env.E2E_ADMIN_PASSWORD },
  { role: 'organizador', identifier: process.env.E2E_ORGANIZER_IDENTIFIER, password: process.env.E2E_ORGANIZER_PASSWORD },
  { role: 'capitán', identifier: process.env.E2E_CAPTAIN_IDENTIFIER, password: process.env.E2E_CAPTAIN_PASSWORD },
  { role: 'jugador', identifier: process.env.E2E_PLAYER_IDENTIFIER, password: process.env.E2E_PLAYER_PASSWORD },
];

for (const roleCase of roleCases) {
  test(`workspace adaptable para ${roleCase.role}`, async ({ page }, testInfo) => {
    test.skip(!roleCase.identifier || !roleCase.password, `Faltan credenciales E2E para ${roleCase.role}`);
    const login = await page.request.post('/api/auth/login', {
      data: { emailOrGamertag: roleCase.identifier, password: roleCase.password },
    });
    expect(login.ok()).toBe(true);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    if (roleCase.role === 'administrador' || roleCase.role === 'organizador') {
      await expect(page.locator('.management-navbar-toggle')).toHaveCount(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await testInfo.attach(`dashboard-${roleCase.role}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}
