'use client';

/**
 * Utility to compress heavy images (PNG, JPG, BMP up to 20MB) to WebP format
 * with minimal quality loss in the browser using HTML5 Canvas.
 */
export async function compressImageToWebP(
  file: File,
  maxDimension: number = 1024,
  quality: number = 0.85
): Promise<{ file: File; base64: string; originalSize: number; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Render to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de renderizado'));
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP blob & dataUrl
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fallo al comprimir imagen a WebP'));
              return;
            }

            const compressedSize = blob.size;
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], fileName, { type: 'image/webp' });
            const base64 = canvas.toDataURL('image/webp', quality);

            resolve({
              file: compressedFile,
              base64,
              originalSize,
              compressedSize,
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
