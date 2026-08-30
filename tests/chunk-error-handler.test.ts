import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('ChunkErrorHandler', () => {
  it('cache-busts a stale CDN document and prevents reload loops', async () => {
    const source = await readFile(new URL('../src/components/providers/chunk-error-handler.tsx', import.meta.url), 'utf8');

    expect(source).toContain('sessionStorage');
    expect(source).toContain('__dpl_retry');
    expect(source).toContain('window.location.replace');
    expect(source).not.toContain('window.location.reload()');
  });
});
