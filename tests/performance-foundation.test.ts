import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('shared performance foundation', () => {
  it('keeps the root shell cacheable and avoids preloading optional fonts', () => {
    const layout = source('src/app/layout.tsx');
    expect(layout).not.toContain("export const dynamic = 'force-dynamic'");
    expect(layout.match(/preload: false/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('does not load the global team directory for signed-out visitors', () => {
    const provider = source('src/components/providers/auth-provider.tsx');
    expect(provider).toContain('if (!authenticatedUserId) return;');
  });

  it('loads expensive navigation and modal modules on demand', () => {
    const navbar = source('src/components/layout/navbar.tsx');
    const adminNavbar = source('src/components/layout/admin-navbar.tsx');
    const mobileSubnav = source('src/components/layout/mobile-responsive-subnavbar.tsx');

    expect(navbar).toContain("dynamic(() => import('@/components/layout/admin-navbar')");
    expect(navbar).toContain("dynamic(() => import('@/components/layout/mobile-public-navigation')");
    expect(adminNavbar).toContain("dynamic(() => import('@/components/layout/admin-navbar-team-modals')");
    expect(mobileSubnav).toContain("dynamic(() => import('@/components/teams/create-team-modal')");
  });

  it('caches the shared public portal snapshot', () => {
    const publicData = source('src/lib/public-home-data.ts');
    expect(publicData).toContain('unstable_cache');
    expect(publicData).toContain("tags: ['public-portal-summary']");
  });

  it('supports intent-based route prefetch for reusable entity cards', () => {
    const card = source('src/components/ui/esports-card.tsx');
    expect(card).toContain('IntentLink');
    expect(card).not.toContain('<Link href={href} transitionTypes={transitionTypes}');
  });

  it('keeps local images on the Next.js optimization pipeline', () => {
    const config = source('next.config.ts');
    expect(config).not.toContain('unoptimized: true');
    expect(config).toContain('"image/avif"');
  });

  it('keeps runtime uploads out of broad production traces', () => {
    const storage = source('src/lib/upload-storage.ts');
    const route = source('src/app/api/uploads/[...path]/route.ts');
    expect(storage).toContain('turbopackIgnore: true');
    expect(route).toContain('turbopackIgnore: true');
  });

  it('loads Google Identity only when its authentication modal is requested', () => {
    const layout = source('src/app/layout.tsx');
    const googleModal = source('src/components/auth/google-oauth-modal.tsx');
    expect(layout).not.toContain('accounts.google.com/gsi/client');
    expect(googleModal).toContain('accounts.google.com/gsi/client');
  });
});
