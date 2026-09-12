import { expect, test } from '@playwright/test';

const accounts = [
  { role: 'Administrador', prefix: 'ADMIN', acceptedRoles: ['Administrador', 'Admin'], canListUsers: true },
  { role: 'Organizador', prefix: 'ORGANIZER', acceptedRoles: ['Organizador'], canListUsers: true },
  { role: 'Capitán', prefix: 'CAPTAIN', acceptedRoles: ['Capitán', 'Capitan'], canListUsers: false },
  { role: 'Jugador', prefix: 'PLAYER', acceptedRoles: ['Jugador'], canListUsers: false },
] as const;

const missingCredentials = accounts.flatMap(({ prefix }) => [
  `E2E_${prefix}_IDENTIFIER`,
  `E2E_${prefix}_PASSWORD`,
].filter((name) => !process.env[name]));

if (process.env.E2E_REQUIRE_AUTH === '1' && missingCredentials.length > 0) {
  throw new Error(`Faltan credenciales de prueba para la verificación de lanzamiento: ${missingCredentials.join(', ')}`);
}

for (const account of accounts) {
  test(`autenticación y autorización de ${account.role}`, async ({ page }) => {
    const identifier = process.env[`E2E_${account.prefix}_IDENTIFIER`];
    const password = process.env[`E2E_${account.prefix}_PASSWORD`];
    test.skip(!identifier || !password, `Faltan credenciales E2E para ${account.role}`);

    const login = await page.request.post('/api/auth/login', {
      data: { emailOrGamertag: identifier, password },
    });
    expect(login.status(), `El inicio de sesión de ${account.role} falló`).toBe(200);
    expect(login.headers()['set-cookie']).toMatch(/tp_session=[^;]+;.*httponly/i);
    const loginBody = await login.json();
    expect(loginBody.success).toBe(true);
    expect(account.acceptedRoles).toContain(loginBody.data?.user?.role);
    expect(loginBody.data?.user).not.toHaveProperty('password_hash');

    const session = await page.request.get('/api/auth/session');
    expect(session.status()).toBe(200);
    const sessionBody = await session.json();
    expect(sessionBody).toMatchObject({ success: true, data: { authenticated: true } });
    expect(account.acceptedRoles).toContain(sessionBody.data?.user?.role);
    expect(sessionBody.data?.user?.id).toBe(loginBody.data?.user?.id);
    expect(sessionBody.data?.user).not.toHaveProperty('password_hash');

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();

    const adminUsers = await page.request.get('/api/admin/users');
    expect(adminUsers.status()).toBe(account.canListUsers ? 200 : 403);
    if (account.canListUsers) {
      const usersBody = await adminUsers.json();
      expect(usersBody.success).toBe(true);
      expect(Array.isArray(usersBody.users)).toBe(true);
      for (const user of usersBody.users) {
        expect(user).not.toHaveProperty('password_hash');
      }
    }

    // Deliberately invalid input cannot create a game even if a permission regresses.
    const sameOriginInvalid = await page.request.post('/api/admin/games', {
      headers: { origin: new URL(page.url()).origin },
      data: {},
    });
    expect(sameOriginInvalid.status()).toBe(account.role === 'Administrador' ? 400 : 403);

    const crossOriginInvalid = await page.request.post('/api/admin/games', {
      headers: { origin: 'https://untrusted.example' },
      data: {},
    });
    expect(crossOriginInvalid.status()).toBe(403);
  });
}
