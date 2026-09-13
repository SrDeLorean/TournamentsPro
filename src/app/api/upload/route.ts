import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { validateUpload, sanitizeUploadPath } from '@/lib/auth';
import { apiError } from '@/lib/api-types';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import {
  canManageOrganization,
  canManageTeam,
  canManageUser,
  isAdministrator,
  isOrganizer,
  type AuthorizationActor,
} from '@/lib/authorization';
import { consumeSecurityRateLimit } from '@/lib/security';
import { uploadRequestBodySchema } from '@/lib/api-schemas';
import {
  buildUploadFileName,
  persistUploadCopies,
  previousUploadBelongsToEntity,
  type UploadEntityType,
  type UploadMediaType,
} from '@/lib/upload-storage';

const SPECIAL_ENTITY_IDS = new Set(['id', 'new-team', 'new-organization', 'new-user', 'new-competition', 'create', 'temp']);

async function authorizeEntityUpload(
  actor: AuthorizationActor,
  entityType: UploadEntityType,
  entityId?: string | null,
): Promise<string> {
  const requestedId = entityId?.trim();
  const isTemporary = !requestedId || SPECIAL_ENTITY_IDS.has(requestedId);
  const effectiveId = isTemporary ? actor.userId : requestedId;
  const { dbProvider } = await import('@/lib/db/provider');

  if (entityType === 'team') {
    if (isTemporary) return effectiveId;
    const team = await dbProvider.teams.findById(effectiveId);
    if (!team) throw Object.assign(new Error('El equipo indicado no existe'), { status: 404, code: 'TEAM_NOT_FOUND' });
    const managers = await dbProvider.teams.getManagers(effectiveId);
    if (!canManageTeam(actor, { captainId: team.captainId, organizationId: team.organizationId, managerIds: managers })) {
      throw Object.assign(new Error('No tienes permisos para modificar los archivos de este equipo'), { status: 403, code: 'FORBIDDEN' });
    }
    return effectiveId;
  }

  if (entityType === 'organization') {
    if (isTemporary) {
      if (!isAdministrator(actor)) throw Object.assign(new Error('Solo un administrador puede cargar imágenes de una organización nueva'), { status: 403, code: 'FORBIDDEN' });
      return effectiveId;
    }
    const organization = await dbProvider.organizations.findById(effectiveId);
    if (!organization) throw Object.assign(new Error('La organización indicada no existe'), { status: 404, code: 'ORGANIZATION_NOT_FOUND' });
    if (!canManageOrganization(actor, effectiveId)) throw Object.assign(new Error('No tienes permisos para modificar esta organización'), { status: 403, code: 'FORBIDDEN' });
    return effectiveId;
  }

  if (entityType === 'competition') {
    if (isTemporary) {
      if (!isAdministrator(actor) && !isOrganizer(actor)) {
        throw Object.assign(new Error('Solo un administrador u organizador puede cargar imágenes de una competencia'), { status: 403, code: 'FORBIDDEN' });
      }
      return effectiveId;
    }
    const competition = await dbProvider.competitions.findById(effectiveId);
    if (!competition) throw Object.assign(new Error('La competencia indicada no existe'), { status: 404, code: 'COMPETITION_NOT_FOUND' });
    if (!isAdministrator(actor) && competition.organizerId !== actor.userId && (!actor.organizationId || competition.organizationId !== actor.organizationId)) {
      throw Object.assign(new Error('No tienes permisos para modificar imágenes de esta competencia'), { status: 403, code: 'FORBIDDEN' });
    }
    return effectiveId;
  }

  if (entityType === 'user') {
    if (isTemporary) {
      if (!isAdministrator(actor)) return actor.userId;
      return effectiveId;
    }
    const user = await dbProvider.users.findById(effectiveId);
    if (!user) throw Object.assign(new Error('El usuario indicado no existe'), { status: 404, code: 'USER_NOT_FOUND' });
    if (!canManageUser(actor, { userId: user.id, role: user.role, organizationId: user.organizationId })) {
      throw Object.assign(new Error('No tienes permisos para modificar las imágenes de este usuario'), { status: 403, code: 'FORBIDDEN' });
    }
    return effectiveId;
  }

  if (!isAdministrator(actor)) throw Object.assign(new Error('Solo un administrador puede modificar imágenes de disciplinas'), { status: 403, code: 'FORBIDDEN' });
  return effectiveId;
}

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
    const { fileBase64, type, entityType } = body;

    if (!fileBase64) {
      return apiError('No se recibió ningún archivo', 400, 'NO_FILE');
    }

    // ── Validate file content & magic bytes ──────────────────────────────
    const validation = validateUpload(fileBase64);
    if (!validation.valid || !validation.buffer) {
      return apiError(validation.error || 'Archivo de imagen inválido o no reconocido', 400, 'INVALID_FILE');
    }

    const buffer = validation.buffer;
    const requestedEntityId = body.entityId || body.teamId;
    const authorizedEntityId = await authorizeEntityUpload(actor, entityType, requestedEntityId);
    const mediaType: UploadMediaType = type === 'banner' ? 'banner' : type === 'avatar' ? 'avatar' : 'logo';

    // ── Optimize and compress image tailored to use-case (WebP) ─────────
    const { optimizeUploadImage } = await import('@/lib/image-processing');
    const optimized = await optimizeUploadImage(buffer, mediaType);
    const finalBuffer = optimized.buffer;
    const finalExtension = optimized.extension; // 'webp'

    // Generate safe, human-readable unique filename
    const rawEntityName = body.entityName || body.teamName || body.teamSlug || 'media';
    const timestamp = Date.now();
    const uniqueFileName = buildUploadFileName({
      entityName: rawEntityName,
      entityId: authorizedEntityId,
      mediaType,
      extension: finalExtension,
      timestamp,
    });

    let finalPublicUrl: string;
    let finalSizeBytes: number;

    // ── Supabase Storage persistence (with graceful local fallback) ────
    const { isSupabaseStorageConfigured, uploadToSupabaseStorage, deleteFromSupabaseStorage } = await import('@/lib/supabase-storage');
    const useSupabase = isSupabaseStorageConfigured() && process.env.STORAGE_DRIVER !== 'local';

    if (useSupabase) {
      try {
        const uploaded = await uploadToSupabaseStorage({
          entityType,
          mediaType,
          fileName: uniqueFileName,
          buffer: finalBuffer,
          mimeType: optimized.mimeType,
        });
        finalPublicUrl = uploaded.publicUrl;
        finalSizeBytes = uploaded.sizeBytes;
      } catch (storageErr) {
        console.warn('[Upload API] Supabase storage upload failed, falling back to local:', storageErr);
        const persisted = await persistUploadCopies({
          projectRoot: process.cwd(),
          entityType,
          mediaType,
          fileName: uniqueFileName,
          buffer: finalBuffer,
        });
        finalPublicUrl = persisted.publicUrl;
        finalSizeBytes = persisted.sizeBytes;
      }
    } else {
      const persisted = await persistUploadCopies({
        projectRoot: process.cwd(),
        entityType,
        mediaType,
        fileName: uniqueFileName,
        buffer: finalBuffer,
      });
      finalPublicUrl = persisted.publicUrl;
      finalSizeBytes = persisted.sizeBytes;
    }

    // ── Delete previous file safely if replacing ────────────────────────
    const previousUrl = body.previousUrl || body.oldUrl;
    if (previousUrl) {
      if (
        previousUrl.startsWith('http')
        && previousUrl.includes('supabase.co')
        && previousUploadBelongsToEntity(previousUrl, authorizedEntityId)
      ) {
        await deleteFromSupabaseStorage(previousUrl);
      } else if (!previousUrl.startsWith('http') && previousUploadBelongsToEntity(previousUrl, authorizedEntityId)) {
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
    }

    return NextResponse.json({
      success: true,
      url: finalPublicUrl,
      fileName: uniqueFileName,
      data: {
        url: finalPublicUrl,
        fileName: uniqueFileName,
        sizeBytes: finalSizeBytes,
        detectedType: optimized.mimeType,
        width: optimized.width,
        height: optimized.height,
      },
    });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
      const code = 'code' in error && typeof error.code === 'string' ? error.code : 'UPLOAD_FORBIDDEN';
      return apiError(error.message, error.status, code);
    }
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar imagen';
    return apiError(message, 500);
  }
}
