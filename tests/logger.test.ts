import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRequestId, logger } from '../src/lib/logger';

afterEach(() => vi.restoreAllMocks());

describe('logger', () => {
  it('conserva un request id válido', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-request-id': 'req-12345678' },
    });
    expect(getRequestId(request)).toBe('req-12345678');
  });

  it('reemplaza request ids no confiables', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-request-id': '<script>' },
    });
    expect(getRequestId(request)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('redacta secretos incluso dentro de objetos', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('auth.test', { password: 'secret', nested: { token: 'jwt', safe: 1 } });

    const record = JSON.parse(String(info.mock.calls[0][0]));
    expect(record.password).toBe('[REDACTED]');
    expect(record.nested).toEqual({ token: '[REDACTED]', safe: 1 });
  });
});
