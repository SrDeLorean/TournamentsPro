import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';
import { readFile } from 'node:fs/promises';

describe('Next security configuration', () => {
  it('generates a self-contained standalone server for Hostinger', () => {
    expect(nextConfig.output).toBe('standalone');
    expect(nextConfig.compress).toBe(true);
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('keeps application HTML out of long-lived CDN caches', async () => {
    const rootLayout = await readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');

    expect(rootLayout).toContain("export const dynamic = 'force-dynamic'");
  });

  it('uses a deployment identifier generated for every production release', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const buildScript = await readFile(new URL('../scripts/build-production.mjs', import.meta.url), 'utf8');

    expect(packageJson.scripts.build).toBe('node scripts/build-production.mjs');
    expect(buildScript).toContain('NEXT_DEPLOYMENT_ID');
  });

  it('limits Server Action request bodies', () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe('1mb');
  });

  it('publishes the required browser security headers', async () => {
    const resolveHeaders = nextConfig.headers;
    expect(resolveHeaders).toBeTypeOf('function');
    const groups = await resolveHeaders!();
    const headers = Object.fromEntries(groups[0].headers.map(({ key, value }) => [key, value]));

    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Content-Security-Policy']).toContain("script-src 'self' 'unsafe-inline'");
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });
});
