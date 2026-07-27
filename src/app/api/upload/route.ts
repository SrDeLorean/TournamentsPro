import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { authenticateRequest, validateUpload, sanitizeUploadPath } from '@/lib/auth';
import { apiError } from '@/lib/api-types';

export async function POST(request: Request) {
  try {
    // ── Authentication check ────────────────────────────────────────────
    const authPayload = authenticateRequest(request);
    if (!authPayload) {
      return apiError('Autenticación requerida para subir archivos', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { fileBase64, fileName, type } = body;

    if (!fileBase64) {
      return apiError('No se recibió ningún archivo', 400);
    }

    // ── Validate file content ───────────────────────────────────────────
    const validation = validateUpload(fileBase64);
    if (!validation.valid || !validation.buffer) {
      return apiError(validation.error || 'Archivo inválido', 400, 'INVALID_FILE');
    }

    const buffer = validation.buffer;

    // Determine destination subfolder: 'logos' or 'banners'
    const folderType = type === 'banner' ? 'banners' : 'logos';

    // Physical destination directories
    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads', 'teams', folderType);
    const rootUploadDir = path.join(process.cwd(), 'uploads', 'teams', folderType);

    if (!existsSync(publicUploadDir)) await fs.mkdir(publicUploadDir, { recursive: true });
    if (!existsSync(rootUploadDir)) await fs.mkdir(rootUploadDir, { recursive: true });

    // Generate safe, human-readable unique filename
    const rawClubName = body.teamName || body.teamSlug || fileName || 'club';
    const cleanClubSlug = rawClubName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const fileKind = type === 'banner' ? 'banner' : 'logo';
    const uniqueId = body.teamId ? body.teamId.toLowerCase().replace(/[^a-z0-9]/g, '-') : Date.now();
    const uniqueFileName = `${cleanClubSlug || 'club'}-${fileKind}-${uniqueId}.webp`;

    const publicFilePath = path.join(publicUploadDir, uniqueFileName);
    const rootFilePath = path.join(rootUploadDir, uniqueFileName);

    // Write file to both locations
    await fs.writeFile(publicFilePath, buffer);
    await fs.writeFile(rootFilePath, buffer);

    // Direct static URL served by Next.js
    const publicUrl = `/uploads/teams/${folderType}/${uniqueFileName}`;

    // ── Delete previous file safely ─────────────────────────────────────
    const { previousUrl } = body;
    if (previousUrl && typeof previousUrl === 'string') {
      try {
        const cleanPrev = previousUrl.replace('/api/uploads/', '').replace('/uploads/', '');
        
        // Sanitize path to prevent directory traversal
        const oldPublicPath = sanitizeUploadPath(cleanPrev, path.join(process.cwd(), 'public', 'uploads'));
        const oldRootPath = sanitizeUploadPath(cleanPrev, path.join(process.cwd(), 'uploads'));

        if (oldPublicPath && existsSync(oldPublicPath)) await fs.unlink(oldPublicPath);
        if (oldRootPath && existsSync(oldRootPath)) await fs.unlink(oldRootPath);
      } catch (unlinkErr) {
        console.warn('[Upload API] Error removing previous file:', unlinkErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: uniqueFileName,
        sizeBytes: buffer.length,
        detectedType: validation.detectedType,
      },
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar imagen';
    return apiError(message, 500);
  }
}
