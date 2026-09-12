---
name: playwright-testing
description: Playwright E2E testing protocol, Page Object Models, cross-browser viewport verification, auth state re-use, and flake-free assertions.
---

# 🎭 Playwright End-to-End Testing Protocol

Guidelines for writing resilient, fast, and flake-free end-to-end (E2E) and smoke tests using Playwright.

## 📐 Best Practices

1. **User-Facing Locators**:
   - Prefer user-visible locators over CSS classes or brittle XPath:
     - `page.getByRole('button', { name: 'Guardar cambios' })`
     - `page.getByLabel('Correo electrónico')`
     - `page.getByText('Directorio de Equipos')`
     - Fall back to `page.getByTestId('...')` only when semantic roles are ambiguous.

2. **Web-First Assertions**:
   - Always use Playwright's auto-retrying `expect(locator)` matchers:
     - `await expect(page.getByRole('dialog')).toBeVisible();`
     - `await expect(page.getByText('Operación exitosa')).toBeVisible({ timeout: 5000 });`
   - Never use arbitrary `page.waitForTimeout(3000)` sleeps; await state changes or network responses.

3. **Authentication State Re-use**:
   - Store authenticated storage states (`storageState.json`) to skip repeated UI login flows across test files.
   - Inject session cookies directly in `test.use({ storageState: 'auth.json' })`.

4. **Multi-Viewport Testing**:
   - Test critical navigation (navbars, drawers, modals, responsive tables) across standard viewports:
     - Mobile: `390x844` (iPhone 14) and `360x800` (Android).
     - Tablet: `768x1024` (iPad).
     - Desktop: `1280x800` and `1920x1080`.

5. **Page Object Models (POM)**:
   - Encapsulate page interactions and locators in dedicated classes:
     ```typescript
     export class LoginPage {
       constructor(private page: Page) {}
       async login(email: string, pass: string) {
         await this.page.getByLabel('Email').fill(email);
         await this.page.getByLabel('Contraseña').fill(pass);
         await this.page.getByRole('button', { name: 'Ingresar' }).click();
       }
     }
     ```
