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
    const baseDir = path.join(process.cwd(), 'uploads');
    const requestedPath = pathSegments.join('/');
    const safePath = sanitizeUploadPath(requestedPath, baseDir);

    if (!safePath) {
      return new NextResponse('Ruta de archivo no permitida', { status: 403 });
    }

    if (!existsSync(safePath)) {
      return new NextResponse('Imagen no encontrada', { status: 404 });
    }

    const fileBuffer = await fs.readFile(safePath);

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
