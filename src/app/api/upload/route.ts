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
    const rateLimit = await consumeSecurityRateLimit('upload', actor.userId, 100, 60 * 60 * 1_000);
    if (!rateLimit.allowed) {
      return apiError(`Demasiadas cargas de imágenes. Reintenta en ${rateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
    }

    const jsonBody: unknown = await request.json().catch(() => null);
    if (!jsonBody) {
      return apiError('Cuerpo de la petición inválido', 400, 'INVALID_BODY');
    }

    const parsedBody = uploadRequestBodySchema.safeParse(jsonBody);
    if (!parsedBody.success) {
      return apiError('Archivo o metadatos inválidos: ' + parsedBody.error.issues.map(i => i.message).join(', '), 400, 'INVALID_FILE');
    }
    const body = parsedBody.data;
    const { fileBase64, fileName, type } = body;

    if (!fileBase64) {
      return apiError('No se recibió ningún archivo', 400, 'NO_FILE');
    }

    // ── Validate file content & magic bytes ──────────────────────────────
    const validation = validateUpload(fileBase64);
    if (!validation.valid || !validation.buffer) {
      return apiError(validation.error || 'Archivo de imagen inválido o no reconocido', 400, 'INVALID_FILE');
    }

    const buffer = validation.buffer;
    let mayReplaceExistingFile = false;

    // Optional team permissions check if targeting an existing team
    const rawTeamId = body.teamId?.trim();
    const isSpecialId = !rawTeamId || rawTeamId === 'id' || rawTeamId === 'new-team' || rawTeamId === 'create' || rawTeamId === 'temp';

    if (rawTeamId && !isSpecialId && rawTeamId !== actor.userId) {
      const { dbProvider } = await import('@/lib/db/provider');
      const team = await dbProvider.teams.findById(rawTeamId);
      if (!team) {
        return apiError('El equipo indicado no existe', 404, 'TEAM_NOT_FOUND');
      }
      const managers = await dbProvider.teams.getManagers(rawTeamId);
      if (!canManageTeam(actor, {
        captainId: team.captainId,
        organizationId: team.organizationId,
        managerIds: managers,
      })) {
        return apiError('No tienes permisos para modificar los archivos de este equipo', 403, 'FORBIDDEN');
      }
      mayReplaceExistingFile = true;
    } else if (rawTeamId === actor.userId || isSpecialId) {
      mayReplaceExistingFile = true;
    }

    // Determine destination subfolder: 'logos', 'banners', or 'avatars'
    const folderType = type === 'banner' ? 'banners' : (type === 'avatar' ? 'avatars' : 'logos');

    // Physical destination directories
    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads', 'teams', folderType);
    const rootUploadDir = path.join(process.cwd(), 'uploads', 'teams', folderType);

    if (!existsSync(publicUploadDir)) await fs.mkdir(publicUploadDir, { recursive: true });
    if (!existsSync(rootUploadDir)) await fs.mkdir(rootUploadDir, { recursive: true });

    // Generate safe, human-readable unique filename
    const rawClubName = body.teamName || body.teamSlug || fileName || 'media';
    const cleanClubSlug = rawClubName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'media';

    const fileKind = type === 'banner' ? 'banner' : (type === 'avatar' ? 'avatar' : 'logo');
    const entityId = rawTeamId && !isSpecialId ? rawTeamId : actor.userId;
    const uniqueId = entityId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extensionByMime: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };
    const extension = extensionByMime[validation.detectedType || ''] || 'webp';
    const timestamp = Date.now();
    const uniqueFileName = `${cleanClubSlug}-${fileKind}-${uniqueId}-${timestamp}.${extension}`;

    const publicFilePath = path.join(publicUploadDir, uniqueFileName);
    const rootFilePath = path.join(rootUploadDir, uniqueFileName);

    // Write file to both locations
    await fs.writeFile(publicFilePath, buffer);
    await fs.writeFile(rootFilePath, buffer);

    // Direct static URL served by Next.js
    const publicUrl = `/uploads/teams/${folderType}/${uniqueFileName}`;

    // ── Delete previous file safely if replacing ────────────────────────
    const previousUrl = body.previousUrl || body.oldUrl;
    if (mayReplaceExistingFile && previousUrl && typeof previousUrl === 'string' && !previousUrl.startsWith('http')) {
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
      url: publicUrl,
      fileName: uniqueFileName,
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
