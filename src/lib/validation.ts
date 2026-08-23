import { z } from 'zod';

export const emailSchema = z.string().email('Email inválido').max(191);
export const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres').max(128);
export const gamertagSchema = z.string().min(3, 'Mínimo 3 caracteres').max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Solo alfanuméricos, _ y -');
export const nameSchema = z.string().min(2, 'Mínimo 2 caracteres').max(100);
export const uuidSchema = z.preprocess(
  (val) => (val === '' || val === '__NEW__' || val === 'null' || val === undefined ? null : val),
  z.string().min(1, 'ID inválido').max(100).nullable().optional()
);

export const requiredIdSchema = z.string().min(1, 'ID requerido').max(100);

export const flexDatetimeSchema = z.preprocess(
  (val) => {
    if (!val || val === '' || val === 'null' || val === undefined) return null;
    const str = String(val).trim();
    if (str === '') return null;
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
    return str;
  },
  z.string().refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Fecha u hora inválida' }).nullable().optional()
);

export const requiredDatetimeSchema = z.preprocess(
  (val) => {
    if (!val || val === '') return null;
    const str = String(val).trim();
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
    return str;
  },
  z.string().refine((val) => Boolean(val) && !isNaN(new Date(val).getTime()), { message: 'Fecha de inicio es requerida' })
);

export const gameSlugSchema = z.enum(['eafc26', 'valorant', 'csgo', 'lol', 'rocketleague', 'fortnite']);
export const roleSchema = z.enum(['Jugador', 'Capitan', 'Organizador', 'Administrador']);
export const platformSchema = z.enum(['PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY']);
export const competitionStatusSchema = z.enum(['Borrador', 'Activo', 'Finalizado', 'Deshabilitado']);
export const transferMarketModeSchema = z.enum(['ABIERTO', 'CERRADO', 'SIN_MERCADO']);
export const matchFormatSchema = z.string().min(1).max(50);
export const matchModeSchema = z.enum(['PartidoUnico', 'IdaVuelta']);
export const tournamentFormatSchema = z.enum(['Liga', 'Playoff', 'Hibrido']);

export const createCompetitionSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(150),
  gameSlug: gameSlugSchema,
  modeFormat: matchFormatSchema,
  fechaLimiteInscripcion: flexDatetimeSchema,
  fechaInicio: requiredDatetimeSchema,
  fechaTermino: flexDatetimeSchema,
  description: z.string().max(5000).nullable().optional(),
  prizePool: z.string().max(100).nullable().optional(),
  transferMarketMode: transferMarketModeSchema.default('ABIERTO'),
  seasonId: uuidSchema,
  newSeasonName: z.string().max(100).optional(),
  organizationId: uuidSchema,
});

export const createTeamSchema = z.object({
  name: z.string().min(3).max(100),
  tag: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, 'Solo mayúsculas y números'),
  gameSlug: gameSlugSchema,
  platform: platformSchema.default('CROSSPLAY'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#00F0FF'),
  logoText: z.string().max(5).default('TP'),
  description: z.string().max(2000).optional(),
  vacantPositions: z.array(z.string()).optional(),
});

export const createSeasonSchema = z.object({
  name: z.string().min(3).max(100),
  organizationId: uuidSchema.nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
});

export const transferApplicationSchema = z.object({
  teamId: uuidSchema,
  userId: uuidSchema,
  gameSlug: gameSlugSchema,
  position: z.string().min(1).max(30),
  pitchMessage: z.string().max(1000).optional(),
  type: z.enum(['POSTULACION_JUGADOR', 'OFERTA_CLUB']),
  competitionId: uuidSchema.optional(),
});

export const matchReportSchema = z.object({
  matchId: uuidSchema,
  reportedByUserId: uuidSchema,
  scoreHome: z.number().int().min(0).max(999),
  scoreAway: z.number().int().min(0).max(999),
  proofUrl: z.string().url().nullable().optional(),
  playerStats: z.array(z.object({
    userId: uuidSchema,
    teamId: uuidSchema,
    goals: z.number().int().min(0).default(0),
    assists: z.number().int().min(0).default(0),
    yellowCards: z.number().int().min(0).default(0),
    redCards: z.number().int().min(0).default(0),
    rating: z.number().min(0).max(10).default(6.0),
    isMvp: z.boolean().default(false),
  })).optional(),
});

export const fixtureConfigSchema = z.object({
  startDate: z.string().date(),
  selectedDays: z.array(z.string()).min(1),
  selectedTimes: z.array(z.string()).min(1),
  matchMode: matchModeSchema.default('PartidoUnico'),
  format: tournamentFormatSchema.default('Liga'),
  groupCount: z.number().int().min(2).max(16).default(3),
  qualifiersPerGroup: z.number().int().min(1).max(8).default(2),
});

export const addPlayerToSquadSchema = z.object({
  teamId: uuidSchema,
  userId: uuidSchema,
  tacticalPosition: z.string().min(1).max(30),
  roleInTeam: z.enum(['Capitan', 'Jugador', 'DT / Analyst']).default('Jugador'),
});

export const registerUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  gamertag: gamertagSchema,
  primaryGameSlug: gameSlugSchema.default('eafc26'),
  platform: platformSchema.default('CROSSPLAY'),
  position: z.string().max(30).default('DFC'),
});

export const loginSchema = z.object({
  emailOrGamertag: z.string().min(3).max(191),
  password: z.string().min(1),
});

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type TransferApplicationInput = z.infer<typeof transferApplicationSchema>;
export type MatchReportInput = z.infer<typeof matchReportSchema>;
export type FixtureConfigInput = z.infer<typeof fixtureConfigSchema>;
export type AddPlayerToSquadInput = z.infer<typeof addPlayerToSquadSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;