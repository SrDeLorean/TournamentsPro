import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { prepareStandalone } from '../scripts/prepare-standalone.mjs';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('standalone deployment assets', () => {
  it('copies Next.js static chunks and public files next to server.js', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'tournamentspro-standalone-'));
    temporaryDirectories.push(root);

    await Promise.all([
      mkdir(path.join(root, '.next', 'standalone'), { recursive: true }),
      mkdir(path.join(root, '.next', 'static', 'chunks'), { recursive: true }),
      mkdir(path.join(root, 'public', 'images'), { recursive: true }),
    ]);
    await Promise.all([
      writeFile(path.join(root, '.next', 'standalone', 'server.js'), 'server'),
      writeFile(path.join(root, '.next', 'static', 'chunks', 'app.css'), 'body{display:grid}'),
      writeFile(path.join(root, '.next', 'static', 'chunks', 'app.js'), 'console.log("ready")'),
      writeFile(path.join(root, 'public', 'images', 'logo.txt'), 'logo'),
    ]);

    await prepareStandalone(root);

    await expect(readFile(path.join(root, '.next', 'standalone', '.next', 'static', 'chunks', 'app.css'), 'utf8'))
      .resolves.toBe('body{display:grid}');
    await expect(readFile(path.join(root, '.next', 'standalone', '.next', 'static', 'chunks', 'app.js'), 'utf8'))
      .resolves.toContain('ready');
    await expect(readFile(path.join(root, '.next', 'standalone', 'public', 'images', 'logo.txt'), 'utf8'))
      .resolves.toBe('logo');
  });

  it('removes stale assets before copying a new build', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'tournamentspro-standalone-'));
    temporaryDirectories.push(root);
    await Promise.all([
      mkdir(path.join(root, '.next', 'standalone', '.next', 'static', 'chunks'), { recursive: true }),
      mkdir(path.join(root, '.next', 'static', 'chunks'), { recursive: true }),
      mkdir(path.join(root, 'public'), { recursive: true }),
    ]);
    await Promise.all([
      writeFile(path.join(root, '.next', 'standalone', 'server.js'), 'server'),
      writeFile(path.join(root, '.next', 'standalone', '.next', 'static', 'chunks', 'stale.css'), 'stale'),
      writeFile(path.join(root, '.next', 'static', 'chunks', 'fresh.css'), 'fresh'),
      writeFile(path.join(root, '.next', 'static', 'chunks', 'fresh.js'), 'fresh'),
    ]);

    await prepareStandalone(root);

    await expect(readFile(path.join(root, '.next', 'standalone', '.next', 'static', 'chunks', 'fresh.css'), 'utf8')).resolves.toBe('fresh');
    await expect(readFile(path.join(root, '.next', 'standalone', '.next', 'static', 'chunks', 'stale.css'), 'utf8')).rejects.toThrow();
  });

  it('fails clearly when the standalone build has not been generated', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'tournamentspro-standalone-'));
    temporaryDirectories.push(root);
    await mkdir(path.join(root, 'public'), { recursive: true });
    await mkdir(path.join(root, '.next', 'static'), { recursive: true });

    await expect(prepareStandalone(root)).rejects.toThrow('Standalone build not found');
  });
});
