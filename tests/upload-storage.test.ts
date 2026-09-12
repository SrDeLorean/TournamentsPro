import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildUploadFileName,
  getUploadFolder,
  persistUploadCopies,
  previousUploadBelongsToEntity,
} from '@/lib/upload-storage';
import { GET as loadUploadedImage } from '@/app/api/uploads/[...path]/route';

const temporaryRoots: string[] = [];
const projectRoot = process.cwd();

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('almacenamiento compartido de imágenes', () => {
  it('separa cada entidad y tipo de imagen en una ruta estable', () => {
    expect(getUploadFolder('team', 'logo')).toBe('teams/logos');
    expect(getUploadFolder('organization', 'banner')).toBe('organizations/banners');
    expect(getUploadFolder('user', 'avatar')).toBe('users/avatars');
    expect(getUploadFolder('game', 'banner')).toBe('games/banners');
    expect(getUploadFolder('competition', 'logo')).toBe('competitions/logos');
    expect(getUploadFolder('competition', 'banner')).toBe('competitions/banners');
  });

  it('guarda dos copias, vuelve a leerlas y entrega una URL pública cargable', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tournamentspro-upload-'));
    temporaryRoots.push(root);
    const buffer = Buffer.from('imagen-webp-verificada');
    const fileName = buildUploadFileName({
      entityName: 'Club Águila',
      entityId: 'tm-123',
      mediaType: 'banner',
      extension: 'webp',
      timestamp: 123456,
    });

    const stored = await persistUploadCopies({
      projectRoot: root,
      entityType: 'team',
      mediaType: 'banner',
      fileName,
      buffer,
    });

    expect(stored.publicUrl).toBe(`/uploads/teams/banners/${fileName}`);
    await expect(fs.readFile(stored.publicPath)).resolves.toEqual(buffer);
    await expect(fs.readFile(stored.backupPath)).resolves.toEqual(buffer);
    expect(stored.sizeBytes).toBe(buffer.length);
  });

  it('sirve nuevamente una imagen persistida mediante la ruta pública de cargas', async () => {
    const buffer = Buffer.from('contenido-webp-recuperable');
    const fileName = buildUploadFileName({
      entityName: 'Prueba carga',
      entityId: 'usr-storage-test',
      mediaType: 'avatar',
      extension: 'webp',
      timestamp: Date.now(),
    });
    const stored = await persistUploadCopies({
      projectRoot,
      entityType: 'user',
      mediaType: 'avatar',
      fileName,
      buffer,
    });

    try {
      const response = await loadUploadedImage(
        new Request(`http://localhost/api/uploads/users/avatars/${fileName}`),
        { params: Promise.resolve({ path: ['users', 'avatars', fileName] }) },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/webp');
      expect(Buffer.from(await response.arrayBuffer())).toEqual(buffer);
    } finally {
      await Promise.all([
        fs.unlink(stored.publicPath).catch(() => undefined),
        fs.unlink(stored.backupPath).catch(() => undefined),
      ]);
    }
  });

  it('solo permite reemplazar archivos vinculados a la entidad autorizada', () => {
    expect(previousUploadBelongsToEntity('/uploads/users/avatars/player-avatar-usr-123-10.webp', 'usr-123')).toBe(true);
    expect(previousUploadBelongsToEntity('/uploads/users/avatars/other-avatar-usr-999-10.webp', 'usr-123')).toBe(false);
    expect(previousUploadBelongsToEntity(
      'https://project.supabase.co/storage/v1/object/public/tournaments-media/users/avatars/player-avatar-usr-123-10.webp',
      'usr-123',
    )).toBe(true);
    expect(previousUploadBelongsToEntity(
      'https://project.supabase.co/storage/v1/object/public/tournaments-media/users/avatars/other-avatar-usr-999-10.webp',
      'usr-123',
    )).toBe(false);
    expect(previousUploadBelongsToEntity(
      '/uploads/users/avatars/player-avatar-usr-10-10.webp',
      'usr-1',
    )).toBe(false);
  });
});
