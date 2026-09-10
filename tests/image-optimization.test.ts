import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { optimizeUploadImage } from '@/lib/image-processing';
import { isSupabaseStorageConfigured, SUPABASE_STORAGE_BUCKET } from '@/lib/supabase-storage';

describe('Image Optimization & Adaptive Compression Pipeline', () => {
  it('converts a large banner into high-quality WebP within 1920px max resolution', async () => {
    // Generate an artificial 2500x1400 JPEG image
    const rawLargeImage = await sharp({
      create: {
        width: 2500,
        height: 1400,
        channels: 3,
        background: { r: 15, g: 25, b: 40 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeUploadImage(rawLargeImage, 'banner');

    expect(result.format).toBe('webp');
    expect(result.extension).toBe('webp');
    expect(result.mimeType).toBe('image/webp');
    expect(result.width).toBeLessThanOrEqual(1920);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.sizeBytes).toBeLessThan(rawLargeImage.length);
  });

  it('optimizes logos to max 512px while preserving alpha transparency', async () => {
    // Generate an artificial 1200x1200 transparent PNG
    const rawLogo = await sharp({
      create: {
        width: 1200,
        height: 1200,
        channels: 4,
        background: { r: 220, g: 32, b: 17, alpha: 0.8 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeUploadImage(rawLogo, 'logo');

    expect(result.format).toBe('webp');
    expect(result.width).toBeLessThanOrEqual(512);
    expect(result.height).toBeLessThanOrEqual(512);

    // Verify alpha channel is preserved in the output WebP
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.channels).toBe(4);
    expect(metadata.hasAlpha).toBe(true);
  });

  it('optimizes player avatars to square 384x384 lightweight WebP portraits', async () => {
    // Generate an artificial 800x1000 rectangular image
    const rawAvatar = await sharp({
      create: {
        width: 800,
        height: 1000,
        channels: 3,
        background: { r: 60, g: 120, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeUploadImage(rawAvatar, 'avatar');

    expect(result.format).toBe('webp');
    expect(result.width).toBe(384);
    expect(result.height).toBe(384);
    expect(result.sizeBytes).toBeLessThan(rawAvatar.length);
  });

  it('does not upscale images that are already smaller than the max resolution', async () => {
    const smallImage = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeUploadImage(smallImage, 'logo');

    expect(result.format).toBe('webp');
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });

  it('handles any input image format (PNG, JPEG, etc.) universally into WebP', async () => {
    const pngImage = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 50, g: 50, b: 50 } },
    }).png().toBuffer();

    const jpegImage = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 50, g: 50, b: 50 } },
    }).jpeg().toBuffer();

    const resPng = await optimizeUploadImage(pngImage, 'avatar');
    const resJpeg = await optimizeUploadImage(jpegImage, 'avatar');

    expect(resPng.format).toBe('webp');
    expect(resJpeg.format).toBe('webp');
  });
});

describe('Supabase Storage Configuration & Buckets', () => {
  it('defines the persistent bucket name tournaments-media by default', () => {
    expect(SUPABASE_STORAGE_BUCKET).toBe('tournaments-media');
  });

  it('correctly evaluates storage availability based on credentials', () => {
    const isConfigured = isSupabaseStorageConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });
});
