import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { validateUpload, sanitizeUploadPath } from '@/lib/auth';
import { apiError } from '@/lib/api-types';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canManageTeam } from '@/lib/authorization';

import { consumeSecurityRateLimit } from '@/lib/security';
import { uploadRequestBodySchema } from '@/lib/api-schemas';

export async function POST(request: Request) {
  try {
    // ── Authentication check ────────────────────────────────────────────
    const actor = await requireRequestActor(request);
    const rateLimit = await consumeSecurityRateLimit('upload', actor.userId, 20, 60 * 60 * 1_000);
    if (!rateLimit.allowed) {
      return apiError(`Demasiadas cargas. Reintenta en ${rateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
    }

    const parsedBody = uploadRequestBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('Archivo o metadatos inválidos', 400, 'INVALID_FILE');
    const body = parsedBody.data;
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
    let mayReplaceExistingFile = false;

    const { dbProvider } = await import('@/lib/db/provider');
    if (body.teamId && body.teamId !== actor.userId) {
      const team = await dbProvider.teams.findById(body.teamId);
      const managers = await dbProvider.teams.getManagers(body.teamId);
      
      if (!team || !canManageTeam(actor, {
        captainId: team.captainId,
        organizationId: team.organizationId,
        managerIds: managers.map(m => m.userId),
      })) {
        return apiError('No puedes modificar los archivos de este equipo', 403, 'FORBIDDEN');
      }
      mayReplaceExistingFile = true;
    } else if (body.teamId === actor.userId) {
      mayReplaceExistingFile = true;
    }

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
    const entityId = typeof body.teamId === 'string' ? body.teamId : actor.userId;
    const uniqueId = entityId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extensionByMime: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const extension = extensionByMime[validation.detectedType || ''] || 'webp';
    const uniqueFileName = `${cleanClubSlug || 'entity'}-${fileKind}-${uniqueId}.${extension}`;

    const publicFilePath = path.join(publicUploadDir, uniqueFileName);
    const rootFilePath = path.join(rootUploadDir, uniqueFileName);

    // Write file to both locations
    await fs.writeFile(publicFilePath, buffer);
    await fs.writeFile(rootFilePath, buffer);

    // Direct static URL served by Next.js
    const publicUrl = `/uploads/teams/${folderType}/${uniqueFileName}`;

    // ── Delete previous file safely ─────────────────────────────────────
    const { previousUrl } = body;
    if (mayReplaceExistingFile && previousUrl && typeof previousUrl === 'string') {
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
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar imagen';
    return apiError(message, 500);
  }
}

