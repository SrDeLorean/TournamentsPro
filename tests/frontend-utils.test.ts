import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJson } from '../src/lib/fetch-utils';
import { shouldBypassImageOptimization } from '../src/lib/image-utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  it('uses same-origin credentials, merges headers, and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 'team-1' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchJson<{ success: boolean; data: { id: string } }>('/api/teams', {
      headers: { 'X-Request-ID': 'request-1' },
    });

    expect(result.data.id).toBe('team-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/teams', expect.objectContaining({
      credentials: 'same-origin',
    }));
    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestOptions.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Request-ID')).toBe('request-1');
  });

  it('throws the API error message on a failed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await expect(fetchJson('/api/admin/teams')).rejects.toThrow('Acceso denegado');
  });
});

describe('shouldBypassImageOptimization', () => {
  it.each([
    ['https://images.example.com/avatar.png', true],
    ['data:image/webp;base64,abc', true],
    ['blob:http://localhost/id', true],
    ['/images/games/eafc26.png', false],
    ['/uploads/teams/logo.webp', false],
  ])('classifies %s', (src, expected) => {
    expect(shouldBypassImageOptimization(src)).toBe(expected);
  });
});
