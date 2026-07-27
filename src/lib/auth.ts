// =============================================================================
// TournamentsPro — Authentication Utilities (JWT + bcrypt)
// =============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'tournamentspro-default-secret-change-me';
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

// ── Password Hashing ────────────────────────────────────────────────────────

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ── JWT Token Management ────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  role: string;
  gamertag: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ── Request Auth Extraction ─────────────────────────────────────────────────

export function extractTokenFromRequest(request: Request): string | null {
  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Check cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/tp_session=([^;]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

export function authenticateRequest(request: Request): JWTPayload | null {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// ── Authorization Helpers ───────────────────────────────────────────────────

export function isAdmin(payload: JWTPayload | null): boolean {
  return payload?.role === 'Administrador' || payload?.role === 'Admin';
}

export function isOrganizer(payload: JWTPayload | null): boolean {
  return payload?.role === 'Organizador';
}

export function isAdminOrOrganizer(payload: JWTPayload | null): boolean {
  return isAdmin(payload) || isOrganizer(payload);
}

// ── Upload Validation ───────────────────────────────────────────────────────

const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Magic byte signatures for image formats
const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],       // ‰PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF],              // ÿØÿ
  'image/gif': [0x47, 0x49, 0x46],               // GIF
  'image/webp': [0x52, 0x49, 0x46, 0x46],        // RIFF (WebP starts with RIFF)
};

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  buffer?: Buffer;
  detectedType?: string;
}

export function validateUpload(base64Data: string, maxSizeBytes = MAX_UPLOAD_SIZE_BYTES): UploadValidationResult {
  // Strip base64 header
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  
  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleanBase64, 'base64');
  } catch {
    return { valid: false, error: 'Base64 inválido' };
  }

  // Size check
  if (buffer.length > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / 1024 / 1024);
    return { valid: false, error: `El archivo excede el límite de ${maxMB}MB` };
  }

  if (buffer.length < 8) {
    return { valid: false, error: 'Archivo demasiado pequeño o corrupto' };
  }

  // Magic bytes check
  let detectedType: string | undefined;
  for (const [mime, magic] of Object.entries(MAGIC_BYTES)) {
    const matches = magic.every((byte, i) => buffer[i] === byte);
    if (matches) {
      detectedType = mime;
      break;
    }
  }

  // SVG fallback (text-based, check for <svg tag)
  if (!detectedType) {
    const head = buffer.subarray(0, 256).toString('utf-8').trim().toLowerCase();
    if (head.includes('<svg') || head.includes('<?xml')) {
      detectedType = 'image/svg+xml';
    }
  }

  if (!detectedType) {
    return { valid: false, error: 'Tipo de archivo no permitido. Solo imágenes (PNG, JPG, WebP, GIF, SVG).' };
  }

  if (!ALLOWED_IMAGE_MIMES.includes(detectedType)) {
    return { valid: false, error: `Tipo de archivo ${detectedType} no permitido.` };
  }

  return { valid: true, buffer, detectedType };
}

// ── Path Sanitization ───────────────────────────────────────────────────────

import path from 'path';

export function sanitizeUploadPath(requestedPath: string, baseDir: string): string | null {
  // Remove any directory traversal attempts
  const cleaned = requestedPath
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(segment => segment && segment !== '.' && segment !== '..')
    .join('/');

  if (!cleaned) return null;

  const resolved = path.resolve(baseDir, cleaned);
  
  // Ensure the resolved path is within the base directory
  if (!resolved.startsWith(path.resolve(baseDir))) {
    return null;
  }

  return resolved;
}
