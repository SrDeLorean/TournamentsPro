import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { sanitizeUploadPath } from '@/lib/auth';

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, { params }: Params) {
  const { path: pathSegments } = await params;

  try {
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Archivo no especificado', { status: 400 });
    }

    // Sanitize path to prevent directory traversal attacks
    const requestedPath = pathSegments.join('/');
    const candidateDirs = [
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'EXTRA', 'uploads'),
    ];

    let safePath: string | null = null;
    for (const baseDir of candidateDirs) {
      const candidate = sanitizeUploadPath(requestedPath, baseDir);
      if (candidate && existsSync(candidate)) {
        safePath = candidate;
        break;
      }
    }

    if (!safePath) {
      // 1. Check Supabase Storage if configured
      try {
        const { isSupabaseStorageConfigured, SUPABASE_STORAGE_BUCKET } = await import('@/lib/supabase-storage');
        if (isSupabaseStorageConfigured()) {
          const { supabase } = await import('@/lib/db/supabase/client');
          const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).download(requestedPath);
          if (!error && data) {
            const arrayBuffer = await data.arrayBuffer();
            return new NextResponse(Buffer.from(arrayBuffer), {
              status: 200,
              headers: {
                'Content-Type': data.type || 'image/webp',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff',
              },
            });
          }
        }
      } catch (storageErr) {
        console.warn('Error fetching from Supabase storage fallback:', storageErr);
      }

      // 2. Fallback gracefully to default images instead of raw 404 text
      const isBanner = requestedPath.toLowerCase().includes('banner') || requestedPath.toLowerCase().includes('organizaciones');
      const fallbackFile = isBanner
        ? path.join(process.cwd(), 'public', 'images', 'default', 'banner-default.jpg')
        : path.join(process.cwd(), 'public', 'images', 'default', 'logo-default.png');

      if (existsSync(fallbackFile)) {
        const fallbackBuffer = await fs.readFile(fallbackFile);
        const fallbackContentType = isBanner ? 'image/jpeg' : 'image/png';
        return new NextResponse(fallbackBuffer, {
          status: 200,
          headers: {
            'Content-Type': fallbackContentType,
            'Cache-Control': 'public, max-age=300',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }

      return new NextResponse('Imagen no encontrada', { status: 404 });
    }

    const fileBuffer = await fs.readFile(/* turbopackIgnore: true */ safePath);

    // Determine content type from extension
    const ext = path.extname(safePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    const contentType = contentTypes[ext] || 'image/webp';

    // Only serve image types
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Tipo de archivo no permitido', { status: 403 });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Error al leer imagen', { status: 500 });
  }
}
