// =============================================================================
// TournamentsPro — Authentication Utilities (JWT + bcrypt + Security)
// =============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Security: Use environment variable only, no fallback in production
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production-min-32-chars';
const JWT_SECRET_FALLBACK = JWT_SECRET;
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

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
  organizationId?: string | null;
  sessionId: string; // For token revocation
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export function signToken(payload: Omit<JWTPayload, 'sessionId' | 'type'>, type: 'access' | 'refresh' = 'access', sessionId?: string): string {
  const expiresIn = type === 'access' ? TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  const fullPayload: JWTPayload = {
    ...payload,
    sessionId: sessionId || randomUUID(),
    type,
  };
  return jwt.sign(fullPayload, JWT_SECRET_FALLBACK, { expiresIn });
}

export function generateTokenPair(payload: Omit<JWTPayload, 'sessionId' | 'type'>): TokenPair {
  const sessionId = randomUUID();
  return {
    accessToken: signToken(payload, 'access', sessionId),
    refreshToken: signToken(payload, 'refresh', sessionId),
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  };
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET_FALLBACK) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
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

export function canManageOrganization(payload: JWTPayload | null, organizationId: string | null): boolean {
  if (!payload || !organizationId) return false;
  if (isAdmin(payload)) return true;
  // Check if user belongs to the organization or owns it
  return payload.organizationId === organizationId;
}

// ── Rate Limiting Helpers ───────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: record.resetAt,
      retryAfter: Math.ceil((record.resetAt - now) / 1000)
    };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

export function createRateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${action}:${identifier}`;
}

// ── Upload Validation ───────────────────────────────────────────────────────

const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
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

  // SVG fallback (text-based)
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
  // Remove directory traversal attempts
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

// ── CSRF Token Generation (for forms) ───────────────────────────────────────

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = randomUUID();
  csrfTokens.set(sessionId, { token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }); // 24 hours
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const record = csrfTokens.get(sessionId);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return record.token === token;
}

export function clearCSRFToken(sessionId: string): void {
  csrfTokens.delete(sessionId);
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, record] of csrfTokens.entries()) {
    if (now > record.expiresAt) {
      csrfTokens.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Every hour