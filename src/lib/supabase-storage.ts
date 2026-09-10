import { supabase } from '@/lib/db/supabase/client';
import { getUploadFolder, type UploadEntityType, type UploadMediaType } from '@/lib/upload-storage';

export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'tournaments-media';

let bucketCheckPromise: Promise<void> | null = null;

export function isSupabaseStorageConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('placeholder.supabase.co'));
}

/**
 * Ensures the target public bucket exists in Supabase Storage.
 * Uses a cached promise to avoid repetitive API calls on every upload.
 */
export async function ensureStorageBucket(bucketName = SUPABASE_STORAGE_BUCKET): Promise<void> {
  if (!isSupabaseStorageConfigured()) return;

  if (!bucketCheckPromise) {
    bucketCheckPromise = (async () => {
      try {
        const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
        if (error || !bucket) {
          // Attempt to create public bucket if missing
          const { error: createErr } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 15 * 1024 * 1024, // 15MB
            allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'],
          });
          if (createErr && !createErr.message?.includes('already exists')) {
            console.warn('[Supabase Storage] Notice creating bucket:', createErr.message);
          }
        }
      } catch (err) {
        console.warn('[Supabase Storage] Bucket initialization skipped:', err);
      }
    })();
  }

  await bucketCheckPromise;
}

export interface SupabaseUploadResult {
  publicUrl: string;
  sizeBytes: number;
  objectPath: string;
}

/**
 * Uploads an optimized buffer directly to Supabase Storage, returning a persistent public CDN URL.
 */
export async function uploadToSupabaseStorage({
  entityType,
  mediaType,
  fileName,
  buffer,
  mimeType = 'image/webp',
}: {
  entityType: UploadEntityType;
  mediaType: UploadMediaType;
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
}): Promise<SupabaseUploadResult> {
  await ensureStorageBucket(SUPABASE_STORAGE_BUCKET);

  const relativeFolder = getUploadFolder(entityType, mediaType);
  const objectPath = `${relativeFolder}/${fileName}`;

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000, immutable',
      upsert: true,
    });

  if (error) {
    throw new Error(`Error subiendo imagen a Supabase Storage: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(objectPath);

  return {
    publicUrl: publicData.publicUrl,
    sizeBytes: buffer.length,
    objectPath,
  };
}

/**
 * Safely deletes a previous file from Supabase Storage when replaced.
 */
export async function deleteFromSupabaseStorage(fileUrl: string): Promise<boolean> {
  if (!fileUrl || !isSupabaseStorageConfigured()) return false;

  try {
    // Extract object path from full public URL
    // e.g.: https://xyz.supabase.co/storage/v1/object/public/tournaments-media/teams/logos/abc.webp
    const marker = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
    if (!fileUrl.includes(marker)) return false;

    const objectPath = fileUrl.substring(fileUrl.indexOf(marker) + marker.length);
    if (!objectPath) return false;

    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([objectPath]);

    return !error;
  } catch (err) {
    console.warn('[Supabase Storage] Error removing old image:', err);
    return false;
  }
}
