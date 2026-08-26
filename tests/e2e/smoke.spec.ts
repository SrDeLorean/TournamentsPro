import { expect, test } from '@playwright/test';

test('la portada pública carga sin credenciales', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page).toHaveTitle(/TorneosPro/i);
});

test('una ruta privada redirige a la portada con retorno seguro', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/?login=required&next=%2Fdashboard$/);
});

test('la sesión anónima no expone datos', async ({ request }) => {
  const response = await request.get('/api/auth/session');
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({ success: false });
});

test('readiness confirma MySQL y entrega correlación', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  await expect(response.json()).resolves.toEqual({ status: 'ok', database: 'ok' });
});

for (const endpoint of [
  '/api/admin/users',
  '/api/admin/organizations',
  '/api/organizer/fixture',
  '/api/matches/approval',
  '/api/upload',
]) {
  test(`rechaza mutaciones anónimas en ${endpoint}`, async ({ request }) => {
    const response = await request.post(endpoint, { data: {} });
    expect([401, 403]).toContain(response.status());
  });
}
