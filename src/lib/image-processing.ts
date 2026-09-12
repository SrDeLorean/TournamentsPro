import sharp from 'sharp';
import type { UploadMediaType } from '@/lib/upload-storage';

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  sizeBytes: number;
}

export interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Optimizes and converts any incoming image (PNG, JPG, WEBP, AVIF, GIF, etc.) to WebP,
 * applying compression profiles tailored strictly to the use case:
 * - 'banner': Maximum fidelity visual quality (up to 1920px wide, high quality 88-90, no banding).
 * - 'logo': Sharp vector-like badges (up to 512x512px, crisp edges, alpha transparency preserved, quality 85).
 * - 'avatar': Ultra-lightweight square portraits (up to 384x384px, fast multi-athlete list loading, quality 82).
 */
export async function optimizeUploadImage(
  inputBuffer: Buffer,
  mediaType: UploadMediaType,
  customOptions?: ImageOptimizationOptions
): Promise<OptimizedImageResult> {
  try {
    const pipeline = sharp(inputBuffer, {
      limitInputPixels: 40_000_000,
      failOn: 'warning',
    }).rotate(); // Auto-orient via EXIF
    const metadata = await pipeline.metadata();

    // Determine target dimensions and WebP options based on media type
    let targetWidth: number | undefined;
    let targetHeight: number | undefined;
    let resizeFit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'inside';
    let webpQuality = 85;
    let webpEffort = 5;
    let alphaQuality = 90;

    switch (mediaType) {
      case 'banner':
        // Fullscreen banners: high resolution, preserving maximum quality and rich gradients
        targetWidth = customOptions?.maxWidth ?? 1920;
        targetHeight = customOptions?.maxHeight ?? 1080;
        resizeFit = 'inside';
        webpQuality = customOptions?.quality ?? 88;
        webpEffort = 5;
        break;

      case 'logo':
        // Team and organization logos: crisp insignia, preserved transparency, clean downscale
        targetWidth = customOptions?.maxWidth ?? 512;
        targetHeight = customOptions?.maxHeight ?? 512;
        resizeFit = 'inside';
        webpQuality = customOptions?.quality ?? 85;
        alphaQuality = 95;
        webpEffort = 5;
        break;

      case 'avatar':
        // Player / user avatars: lightweight square portraits, ideal for rendering dozens in tables
        targetWidth = customOptions?.maxWidth ?? 384;
        targetHeight = customOptions?.maxHeight ?? 384;
        resizeFit = 'cover';
        webpQuality = customOptions?.quality ?? 82;
        webpEffort = 4;
        break;

      default:
        targetWidth = customOptions?.maxWidth ?? 1280;
        resizeFit = 'inside';
        webpQuality = customOptions?.quality ?? 85;
        webpEffort = 4;
        break;
    }

    // Apply resizing only if original exceeds target dimensions or if square cover is needed
    if (metadata.width && metadata.height) {
      if (resizeFit === 'cover' || metadata.width > targetWidth || (targetHeight && metadata.height > targetHeight)) {
        pipeline.resize(targetWidth, targetHeight, {
          fit: resizeFit,
          withoutEnlargement: true,
          position: 'center',
        });
      }
    }

    // Convert to WebP format with fine-tuned parameters
    pipeline.webp({
      quality: webpQuality,
      alphaQuality,
      effort: webpEffort,
      lossless: false,
    });

    const optimizedBuffer = await pipeline.toBuffer();
    const finalMetadata = await sharp(optimizedBuffer).metadata();

    return {
      buffer: optimizedBuffer,
      format: 'webp',
      mimeType: 'image/webp',
      extension: 'webp',
      width: finalMetadata.width,
      height: finalMetadata.height,
      sizeBytes: optimizedBuffer.length,
    };
  } catch (error) {
    console.warn('[ImageProcessing] Sharp rejected the uploaded image:', error);
    throw new Error('La imagen no es válida o excede los límites de procesamiento', { cause: error });
  }
}
