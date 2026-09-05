// =============================================================================
// TournamentsPro — Auth & User Account Service
// =============================================================================

import type { User } from '@/lib/db/interfaces';
import { dbProvider } from '@/lib/db/provider';
import { validateSchema } from '@/lib/validation';
import { hashPassword, generateTokenPair, verifyPassword } from '@/lib/auth';
import { consumeSecurityRateLimit, createServiceAuthSession } from '@/lib/security';
import { z } from 'zod';

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  gamertag: string;
  primaryGameSlug?: string;
  platform?: string;
  position?: string;
}

export interface RegisterUserResult {
  success: boolean;
  user?: User;
  tokenPair?: { accessToken: string; refreshToken: string };
  error?: string;
  code?: string;
}

export async function registerUserService(data: RegisterUserInput): Promise<RegisterUserResult> {
  const rateLimit = await consumeSecurityRateLimit('auth-register-service', data.email.trim(), 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Demasiados intentos de registro. Intenta más tarde.', code: 'RATE_LIMITED' };
  }

  const validation = validateSchema(
    z.object({
      email: z.string().email().max(191),
      password: z.string().min(8).max(128),
      name: z.string().min(2).max(100),
      gamertag: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
      primaryGameSlug: z.enum(['eafc26', 'valorant', 'csgo', 'lol', 'rocketleague', 'fortnite']).default('eafc26'),
      platform: z.enum(['PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY']).default('CROSSPLAY'),
      position: z.string().max(30).default('DFC'),
    }),
    data
  );

  if (!validation.success) {
    return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
  }

  const { email, password, name, gamertag, primaryGameSlug, platform, position } = validation.data;

  const existingByEmail = await dbProvider.users.findByEmail(email);
  if (existingByEmail) {
    return { success: false, error: 'El email ya está registrado', code: 'EMAIL_EXISTS' };
  }

  const existingByGamertag = await dbProvider.users.findByGamertag(gamertag);
  if (existingByGamertag) {
    return { success: false, error: 'El gamertag ya está en uso', code: 'GAMERTAG_EXISTS' };
  }

  const passwordHash = await hashPassword(password);

  const user = await dbProvider.users.create({
    email,
    passwordHash,
    name,
    gamertag,
    role: 'Jugador',
    primaryGameSlug,
    platform,
    position,
    status: 'Buscando Club',
  });

  const session = await createServiceAuthSession(user.id);
  const tokenPair = generateTokenPair({
    userId: user.id,
    role: user.role,
    gamertag: user.gamertag,
    organizationId: user.organizationId,
  }, session.sessionId);

  return { success: true, user, tokenPair };
}

export interface LoginResult {
  success: boolean;
  user?: User;
  tokenPair?: { accessToken: string; refreshToken: string };
  error?: string;
  code?: string;
}

export async function loginUserService(emailOrGamertag: string, password: string): Promise<LoginResult> {
  const rateLimit = await consumeSecurityRateLimit('auth-login-service', emailOrGamertag.trim(), 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.', code: 'RATE_LIMITED' };
  }

  const user = await dbProvider.users.findByEmailOrGamertag(emailOrGamertag);
  if (!user) {
    return { success: false, error: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' };
  }

  if (user.isBanned) {
    return { success: false, error: `Cuenta suspendida: ${user.banReason || 'Infracción a los términos de servicio'}`, code: 'ACCOUNT_BANNED' };
  }

  if (!user.passwordHash) {
    return { success: false, error: 'Esta cuenta no tiene contraseña configurada. Intenta con Google.', code: 'NO_PASSWORD' };
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return { success: false, error: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' };
  }

  await dbProvider.users.update(user.id, { lastLoginAt: new Date().toISOString().slice(0, 19).replace('T', ' ') });

  const session = await createServiceAuthSession(user.id);
  const tokenPair = generateTokenPair({
    userId: user.id,
    role: user.role,
    gamertag: user.gamertag,
    organizationId: user.organizationId,
  }, session.sessionId);

  return { success: true, user, tokenPair };
}
