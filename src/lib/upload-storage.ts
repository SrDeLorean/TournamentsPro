import path from 'node:path';
import fs from 'node:fs/promises';

export const UPLOAD_ENTITY_TYPES = ['team', 'organization', 'user', 'game'] as const;
export const UPLOAD_MEDIA_TYPES = ['logo', 'banner', 'avatar'] as const;

export type UploadEntityType = (typeof UPLOAD_ENTITY_TYPES)[number];
export type UploadMediaType = (typeof UPLOAD_MEDIA_TYPES)[number];

const ENTITY_FOLDERS: Record<UploadEntityType, string> = {
  team: 'teams',
  organization: 'organizations',
  user: 'users',
  game: 'games',
};

const MEDIA_FOLDERS: Record<UploadMediaType, string> = {
  logo: 'logos',
  banner: 'banners',
  avatar: 'avatars',
};

export function sanitizeUploadSegment(value: string, fallback = 'media'): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback;
}

export function getUploadFolder(entityType: UploadEntityType, mediaType: UploadMediaType): string {
  return path.posix.join(ENTITY_FOLDERS[entityType], MEDIA_FOLDERS[mediaType]);
}

export function buildUploadFileName({
  entityName,
  entityId,
  mediaType,
  extension,
  timestamp = Date.now(),
}: {
  entityName: string;
  entityId: string;
  mediaType: UploadMediaType;
  extension: string;
  timestamp?: number;
}): string {
  const slug = sanitizeUploadSegment(entityName);
  const id = sanitizeUploadSegment(entityId, 'entity');
  const ext = sanitizeUploadSegment(extension, 'webp');
  return `${slug}-${mediaType}-${id}-${timestamp}.${ext}`;
}

export async function persistUploadCopies({
  projectRoot,
  entityType,
  mediaType,
  fileName,
  buffer,
}: {
  projectRoot: string;
  entityType: UploadEntityType;
  mediaType: UploadMediaType;
  fileName: string;
  buffer: Buffer;
}): Promise<{ publicUrl: string; publicPath: string; backupPath: string; sizeBytes: number }> {
  const relativeFolder = getUploadFolder(entityType, mediaType);
  const publicDir = path.join(projectRoot, 'public', 'uploads', relativeFolder);
  const backupDir = path.join(projectRoot, 'uploads', relativeFolder);
  const publicPath = path.join(publicDir, fileName);
  const backupPath = path.join(backupDir, fileName);

  await Promise.all([
    fs.mkdir(publicDir, { recursive: true }),
    fs.mkdir(backupDir, { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(publicPath, buffer),
    fs.writeFile(backupPath, buffer),
  ]);

  const [publicStat, backupStat] = await Promise.all([
    fs.stat(publicPath),
    fs.stat(backupPath),
  ]);
  if (publicStat.size !== buffer.length || backupStat.size !== buffer.length) {
    throw new Error('La imagen no pudo verificarse después de guardarla');
  }

  return {
    publicUrl: `/uploads/${relativeFolder}/${fileName}`,
    publicPath,
    backupPath,
    sizeBytes: publicStat.size,
  };
}

export function previousUploadBelongsToEntity(previousUrl: string, entityId: string): boolean {
  const expectedId = sanitizeUploadSegment(entityId, 'entity');
  return sanitizeUploadSegment(path.basename(previousUrl)).includes(expectedId);
}
