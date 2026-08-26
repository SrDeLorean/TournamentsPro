import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';

describe('Next security configuration', () => {
  it('limits Server Action request bodies', () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe('1mb');
  });

  it('publishes the required browser security headers', async () => {
    const resolveHeaders = nextConfig.headers;
    expect(resolveHeaders).toBeTypeOf('function');
    const groups = await resolveHeaders!();
    const headers = Object.fromEntries(groups[0].headers.map(({ key, value }) => [key, value]));

    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });
});
