import { z } from 'zod';
import { requiredIdSchema } from './validation';

export const transferPostBodySchema = z.object({
  teamId: requiredIdSchema,
  position: z.string().trim().min(1).max(50),
  pitchMessage: z.string().max(1000).optional(),
}).passthrough();

export const organizerSeasonBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  organizationId: requiredIdSchema.nullable().optional(),
  startDate: z.string().max(50).nullable().optional(),
  endDate: z.string().max(50).nullable().optional(),
  status: z.string().trim().min(1).max(30).optional(),
}).passthrough();

export const matchApprovalBodySchema = z.object({
  matchId: requiredIdSchema,
  scoreHome: z.coerce.number().int().min(0).max(999).optional(),
  scoreAway: z.coerce.number().int().min(0).max(999).optional(),
  proofUrl: z.string().max(2048).nullable().optional(),
  action: z.enum(['REPORT_SCORE', 'APPROVE']),
}).passthrough();

export const fixtureRequestBodySchema = z.object({
  tournamentId: requiredIdSchema,
  format: z.string().trim().min(1).max(30).optional(),
  startDate: z.string().max(50).optional(),
  matchdayTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
}).passthrough();

export const uploadRequestBodySchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().max(255).optional(),
  type: z.enum(['logo', 'banner']).optional(),
  teamId: requiredIdSchema.optional(),
  teamName: z.string().max(150).optional(),
  teamSlug: z.string().max(150).optional(),
  oldUrl: z.string().max(2048).optional(),
}).passthrough();

const optionalText = (max: number) => z.string().max(max).nullable().optional();
const teamMutationFields = {
  id: requiredIdSchema.optional(), gameSlug: optionalText(50), captainId: optionalText(100), captainName: optionalText(100),
  platform: optionalText(30), color: optionalText(20), logoText: optionalText(10), logoUrl: optionalText(2048),
  bannerUrl: optionalText(2048), description: optionalText(2000), clubIdEa: optionalText(100), status: optionalText(50),
  socialMedia: z.unknown().optional(), vacantPositions: z.array(z.string().max(50)).optional(),
};

export const teamCreateBodySchema = z.object({
  ...teamMutationFields,
  name: z.string().trim().min(1).max(100),
  tag: z.string().trim().min(1).max(10),
}).passthrough();

export const teamUpdateBodySchema = z.object({
  ...teamMutationFields,
  id: requiredIdSchema,
  name: optionalText(100), tag: optionalText(10),
}).passthrough();

export const userCreateBodySchema = z.object({
  id: requiredIdSchema.optional(),
  name: z.string().trim().min(1).max(100),
  gamertag: z.string().trim().min(1).max(50),
  email: z.string().email().max(191).optional(),
  role: optionalText(30), primaryGame: optionalText(50), platform: optionalText(30), position: optionalText(50),
  rankBadge: optionalText(100), status: optionalText(50),
}).passthrough();

export const userUpdateBodySchema = z.object({
  id: requiredIdSchema, name: optionalText(100), gamertag: optionalText(50), platform: optionalText(30),
  position: optionalText(50), secondaryPosition: optionalText(50), country: optionalText(100), birthDate: optionalText(50),
  phone: optionalText(50), bio: optionalText(5000), avatarUrl: optionalText(2048), foto: optionalText(2048),
  bannerUrl: optionalText(2048), instagram: optionalText(2048), facebook: optionalText(2048), twitch: optionalText(2048),
  youtube: optionalText(2048), tiktok: optionalText(2048), discord: optionalText(2048), twitter: optionalText(2048),
  website: optionalText(2048), whatsapp: optionalText(100),
  gameProfiles: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  newPassword: optionalText(128), password: optionalText(128),
}).passthrough();

export const loginBodySchema = z.object({
  emailOrGamertag: z.string().trim().min(1).max(191),
  password: z.string().min(1).max(128),
}).passthrough();

export const registerBodySchema = z.object({
  gamertag: z.string().trim().min(3).max(50),
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(191).optional(),
  password: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),
  primaryGame: z.string().trim().max(50).optional(),
  platform: z.string().trim().max(30).optional(),
}).passthrough();
