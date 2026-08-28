// =============================================================================
// TournamentsPro — Service Layer (Business Logic)
// =============================================================================

import type { Competition, Team, User } from '@/lib/repositories';
import { executeCas, type DatabaseExecutor, type DatabaseParams } from '@/lib/db';
import { dbProvider } from '@/lib/db/provider';
import { validateSchema, uuidSchema } from '@/lib/validation';
import { hashPassword, generateTokenPair, verifyPassword } from '@/lib/auth';
import { consumeSecurityRateLimit, createServiceAuthSession } from '@/lib/security';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { GAMES_CATALOG } from '@/lib/games-data';


function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

interface AvailablePlayerRow {
  id: string; name: string; gamertag: string; email: string; position: string;
  primary_game_slug: string; organization_id: string | null; avatar_url: string | null; foto: string | null;
}

interface ContractCandidateDatabaseRow extends AvailablePlayerRow {
  current_team_id: string | null;
  current_team_name: string | null;
  current_team_tag: string | null;
}

interface ContractCandidate {
  id: string; name: string; gamertag: string; email?: string; position: string;
  primary_game_slug?: string; organization_id?: string; avatar_url?: string; foto?: string;
  current_team_id?: string; current_team_name?: string; current_team_tag?: string;
}

interface SquadRow {
  id: string; team_id: string; user_id: string; organization_name: string | null;
  tactical_position: string; role_in_team: 'Capitan' | 'Jugador' | 'DT / Analyst';
  jersey_number: number | null; joined_at: string; user_name: string; gamertag: string;
  email?: string; avatar_url?: string | null; foto?: string | null;
}

interface SquadWithOrganizations extends SquadRow {
  member_org_names: string[];
  organization_ids?: string;
  organization_names?: string;
}

interface TransferApplicationRow {
  id: string; team_id: string; applicant_user_id: string; game_slug: string; position: string;
  pitch_message: string | null; application_type: string; status: string;
  is_extraordinary: number; organizer_approval_status: string;
}

interface TransferHistoryRow {
  id: string; game_slug: string; player_user_id?: string; player_name?: string;
  player_gamertag?: string; from_team_name: string | null; to_team_name: string;
  signed_at: string; transfer_type: string;
}

interface TransferPostRow {
  id: string; game_slug: string; type: string; user_id: string; user_name: string;
  user_gamertag: string; team_id: string | null; team_name: string | null;
  position: string; platform: string; status: string; message: string;
  expires_at: string; created_at: string;
}

interface GameConfigurationRow {
  slug: string; name: string; max_squad_cap: number; max_transfers_per_window: number;
  post_expiration_days: number; positions_json: string | string[] | null; brand_color: string | null;
}

interface ContractOfferRow {
  id: string; game_slug: string; team_id: string; team_name: string; team_tag: string;
  player_user_id?: string; offered_by_user_id?: string; position: string;
  pitch_message: string | null; offer_type?: string; status: string; created_at: string;
}

interface ChatThreadRow {
  id: string; channel_type: ChatThreadDTO['channelType']; game_slug: string; title: string | null;
  participant_a_id: string; participant_a_name: string; participant_a_role: string;
  participant_b_id: string; participant_b_name: string | null; participant_b_role: string | null;
  last_message_text: string | null; last_message_at: string; unread_count: number;
}

interface ChatMessageRow {
  id: string; thread_id: string; sender_id: string; sender_name: string;
  sender_role: string; message_text: string; created_at: string;
}

interface UserRoleRow {
  id: string; name: string; gamertag: string; role: string; primary_game_slug: string;
  is_banned: number; ban_reason: string | null;
}

function isManagerEntry(value: unknown): value is { id: string } {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string';
}

export interface CreateCompetitionInput {
  name: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';
  modeFormat: string;
  fechaLimiteInscripcion?: string | null;
  fechaInicio: string;
  fechaTermino?: string | null;
  description?: string | null;
  prizePool?: string | null;
  transferMarketMode?: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO';
  seasonId?: string | null;
  newSeasonName?: string;
  organizationId?: string | null;
  status?: string;
}

// ── User Service ────────────────────────────────────────────────────────────

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
  // Rate limiting
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

  // Check existing user
  const existingByEmail = await dbProvider.users.findByEmail(email);
  if (existingByEmail) {
    return { success: false, error: 'El email ya está registrado', code: 'EMAIL_EXISTS' };
  }

  const existingByGamertag = await dbProvider.users.findByGamertag(gamertag);
  if (existingByGamertag) {
    return { success: false, error: 'El gamertag ya está en uso', code: 'GAMERTAG_EXISTS' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
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

  // Generate tokens
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
  // Rate limiting
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

  // Update last login
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

// ── Team Service ────────────────────────────────────────────────────────────

export interface CreateTeamInput {
  id?: string;
  name: string;
  tag: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';
  platform?: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  color?: string;
  logoText?: string;
  description?: string;
  position?: string;
  vacantPositions?: string[];
  organizationId?: string | null;
  managerIds?: string[];
  status?: string;
  clubIdEa?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export interface CreateTeamResult {
  success: boolean;
  team?: Partial<Team> & Pick<Team, 'id' | 'name' | 'tag' | 'gameSlug' | 'captainId' | 'captainName'>;
  error?: string;
  code?: string;
}

export async function createTeamService(data: CreateTeamInput, captainId: string, captainName: string): Promise<CreateTeamResult> {
  const validation = validateSchema(
    z.object({
      id: z.string().min(1).max(36).optional(),
      name: z.string().min(3).max(100),
      tag: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/),
      gameSlug: z.enum(['eafc26', 'valorant', 'csgo', 'lol', 'rocketleague', 'fortnite']),
      platform: z.enum(['PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY']).default('CROSSPLAY'),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#00F0FF'),
      logoText: z.string().max(5).default('TP'),
      description: z.string().max(2000).optional(),
      position: z.string().optional(),
      vacantPositions: z.array(z.string()).optional(),
      organizationId: uuidSchema,
      managerIds: z.array(z.string().min(1).max(100)).default([]),
      status: z.string().max(50).default('Activo'),
      clubIdEa: z.string().max(100).nullable().optional(),
      logoUrl: z.string().max(2000).nullable().optional(),
      bannerUrl: z.string().max(2000).nullable().optional(),
    }),
    data
  );

  if (!validation.success) {
    return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
  }

  return dbProvider.withTransaction(async (transaction) => {
    const captains = await transaction.users.findById(captainId).then(r => r ? [{ id: r.id }] : []);
    if (captains.length === 0) return { success: false, error: 'Capitán no encontrado', code: 'CAPTAIN_NOT_FOUND' };

    if (validation.data.organizationId) {
      const organizations = await transaction.query<{ id: string }>(
        'SELECT id FROM organizations WHERE id = ? FOR UPDATE',
        [validation.data.organizationId],
      );
      if (organizations.length === 0) return { success: false, error: 'Organización no encontrada', code: 'ORG_NOT_FOUND' };
    }

    const managerIds = [...new Set(validation.data.managerIds)].filter((userId) => userId !== captainId);
    if (managerIds.length > 0) {
      const managers = await transaction.query<{ id: string }>(
        `SELECT id FROM users WHERE id IN (${managerIds.map(() => '?').join(', ')}) FOR UPDATE`,
        managerIds,
      );
      if (managers.length !== managerIds.length) return { success: false, error: 'Uno o más encargados no existen.', code: 'MANAGER_NOT_FOUND' };
    }

    const existingTeams = await transaction.query<{ id: string; name: string }>(
      'SELECT id, name FROM teams WHERE captain_id = ? AND game_slug = ? FOR UPDATE',
      [captainId, validation.data.gameSlug],
    );
    if (existingTeams.length > 0) {
      return {
        success: false,
        error: `Ya posees el club "${existingTeams[0].name}" en esta disciplina. Solo se permite 1 club por disciplina por usuario.`,
        code: 'DUPLICATE_TEAM',
      };
    }

    const teamId = validation.data.id || randomUUID();
    await transaction.execute(
      `INSERT INTO teams
        (id, name, tag, game_slug, organization_id, captain_id, captain_name, platform, members_count,
         max_members, color, logo_text, description, vacant_positions, status, club_id_ea, logo_url, banner_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 45, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teamId, validation.data.name, validation.data.tag, validation.data.gameSlug,
        validation.data.organizationId || null, captainId, captainName, validation.data.platform,
        validation.data.color, validation.data.logoText, validation.data.description || null,
        JSON.stringify(validation.data.vacantPositions || []), validation.data.status,
        validation.data.clubIdEa || null, validation.data.logoUrl || null, validation.data.bannerUrl || null,
      ],
    );
    for (const managerId of managerIds) {
      await transaction.execute(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
         VALUES (?, ?, ?, 'ENCARGADO', 'Encargado')`,
        [randomUUID(), teamId, managerId],
      );
    }
    await transaction.execute(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
       VALUES (?, ?, ?, ?, 'Capitan')`,
      [randomUUID(), teamId, captainId, validation.data.position || 'DFC'],
    );
    if (validation.data.organizationId) {
      await transaction.execute(
        `UPDATE users SET organization_id = ? WHERE id = ? AND (organization_id IS NULL OR organization_id = '')`,
        [validation.data.organizationId, captainId],
      );
    }

    return {
      success: true,
      team: { id: teamId, ...validation.data, captainId, captainName, membersCount: 1, maxMembers: 45 },
    };
  });
}

export interface ManagedOrganizationInput {
  name: string;
  tag: string;
  ownerId: string;
  allowedGames?: string[];
  logoUrl?: string | null;
  bannerUrl?: string | null;
  country?: string | null;
  foundedYear?: string | number | null;
  rating?: string | number | null;
  website?: string | null;
  socialMedia?: Record<string, unknown> | null;
  organizerIds?: string[];
  status?: string | null;
}

export async function createManagedOrganizationService(data: ManagedOrganizationInput) {
  return dbProvider.withTransaction(async (transaction) => {
    const owners = await transaction.users.findById(data.ownerId).then(r => r ? [{ id: r.id }] : []);
    if (owners.length === 0) return { success: false, error: 'Propietario no encontrado.' };
    const organizerIds = [...new Set(data.organizerIds || [])];
    if (organizerIds.length > 0) {
      const organizers = await transaction.query<{ id: string }>(
        `SELECT id FROM users WHERE id IN (${organizerIds.map(() => '?').join(', ')}) AND role = 'Organizador' FOR UPDATE`,
        organizerIds,
      );
      if (organizers.length !== organizerIds.length) return { success: false, error: 'Uno o más organizadores no son válidos.' };
    }
    const duplicates = await transaction.query<{ id: string }>(
      'SELECT id FROM organizations WHERE name = ? OR tag = ? FOR UPDATE',
      [data.name, data.tag],
    );
    if (duplicates.length > 0) return { success: false, error: 'Ya existe una organización con ese nombre o tag.' };

    const organizationId = randomUUID();
    await transaction.execute(
      `INSERT INTO organizations
        (id, name, tag, owner_id, allowed_games, logo_url, banner_url, country, founded_year, rating, website, redes_sociales, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId, data.name, data.tag, data.ownerId, JSON.stringify(data.allowedGames || ['eafc26', 'valorant']),
        data.logoUrl || '/images/default/logo-default.png', data.bannerUrl || '/images/default/banner-default.jpg',
        data.country || 'Venezuela', data.foundedYear || '2020', data.rating || '4.95', data.website || null,
        JSON.stringify(data.socialMedia || {}), data.status || 'Activa',
      ],
    );
    for (const organizerId of organizerIds) {
      await transaction.execute('UPDATE users SET organization_id = ? WHERE id = ?', [organizationId, organizerId]);
    }
    return { success: true, organizationId };
  });
}

export async function updateManagedOrganizationService(
  organizationId: string,
  data: Partial<ManagedOrganizationInput>,
) {
  return dbProvider.withTransaction(async (transaction) => {
    const organizations = await transaction.query<{ id: string }>(
      'SELECT id FROM organizations WHERE id = ? FOR UPDATE',
      [organizationId],
    );
    if (organizations.length === 0) return { success: false, error: 'Organización no encontrada.' };
    const organizerIds = data.organizerIds === undefined ? undefined : [...new Set(data.organizerIds)];
    if (organizerIds && organizerIds.length > 0) {
      const organizers = await transaction.query<{ id: string }>(
        `SELECT id FROM users WHERE id IN (${organizerIds.map(() => '?').join(', ')}) AND role = 'Organizador' FOR UPDATE`,
        organizerIds,
      );
      if (organizers.length !== organizerIds.length) return { success: false, error: 'Uno o más organizadores no son válidos.' };
    }
    if (data.ownerId) {
      const owners = await transaction.users.findById(data.ownerId).then(r => r ? [{ id: r.id }] : []);
      if (owners.length === 0) return { success: false, error: 'Propietario no encontrado.' };
    }

    await transaction.execute(
      `UPDATE organizations SET
        name = COALESCE(?, name), tag = COALESCE(?, tag), owner_id = COALESCE(?, owner_id),
        allowed_games = COALESCE(?, allowed_games), logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url),
        country = COALESCE(?, country), founded_year = COALESCE(?, founded_year), rating = COALESCE(?, rating),
        website = COALESCE(?, website), redes_sociales = COALESCE(?, redes_sociales), status = COALESCE(?, status)
       WHERE id = ?`,
      [
        data.name || null, data.tag || null, data.ownerId || null,
        data.allowedGames ? JSON.stringify(data.allowedGames) : null, data.logoUrl ?? null, data.bannerUrl ?? null,
        data.country ?? null, data.foundedYear ?? null, data.rating ?? null, data.website ?? null,
        data.socialMedia ? JSON.stringify(data.socialMedia) : null, data.status ?? null, organizationId,
      ],
    );
    if (organizerIds) {
      await transaction.query(
        "SELECT id FROM users WHERE organization_id = ? AND role = 'Organizador' FOR UPDATE",
        [organizationId],
      );
      await transaction.execute(
        "UPDATE users SET organization_id = NULL WHERE organization_id = ? AND role = 'Organizador'",
        [organizationId],
      );
      for (const organizerId of organizerIds) {
        await transaction.execute('UPDATE users SET organization_id = ? WHERE id = ?', [organizationId, organizerId]);
      }
    }
    return { success: true };
  });
}

export async function archiveManagedOrganizationService(organizationId: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const organizations = await transaction.query<{ id: string; status: string }>(
      'SELECT id, status FROM organizations WHERE id = ? FOR UPDATE',
      [organizationId],
    );
    if (organizations.length === 0) return { success: false, error: 'Organización no encontrada.' };

    const activeDependencies = await transaction.query<{ id: string }>(
      `SELECT DISTINCT c.id
         FROM competitions c
         LEFT JOIN competition_teams ct ON ct.competition_id = c.id AND ct.status = 'CONFIRMADO'
         LEFT JOIN teams t ON t.id = ct.team_id
        WHERE c.status IN ('Activo', 'Inscripcion', 'En Curso')
          AND (c.organization_id = ? OR t.organization_id = ?)
        FOR UPDATE`,
      [organizationId, organizationId],
    );
    if (activeDependencies.length > 0) {
      return { success: false, error: 'No se puede archivar mientras existan competencias activas asociadas.' };
    }

    const teamRows = await transaction.query<{ id: string }>(
      'SELECT id FROM teams WHERE organization_id = ? FOR UPDATE',
      [organizationId],
    );
    const teamIds = teamRows.map((team) => team.id);
    if (teamIds.length > 0) {
      const placeholders = teamIds.map(() => '?').join(', ');
      await transaction.execute(
        `UPDATE team_vacancies SET status = 'CERRADA' WHERE team_id IN (${placeholders}) AND status = 'ABIERTA'`,
        teamIds,
      );
      await transaction.execute(
        `UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE team_id IN (${placeholders}) AND status = 'ACTIVO'`,
        teamIds,
      );
      await transaction.execute(
        `UPDATE teams SET status = 'Archivado', updated_at = NOW() WHERE id IN (${placeholders})`,
        teamIds,
      );
    }
    await transaction.execute(
      "UPDATE organizations SET status = 'Archivada', updated_at = NOW() WHERE id = ?",
      [organizationId],
    );
    return { success: true, archivedTeams: teamIds.length };
  });
}

export interface ManagedTeamUpdate {
  name?: string;
  tag?: string;
  gameSlug?: string;
  organizationId?: string | null;
  captainId?: string;
  captainName?: string;
  managerIds?: string[];
  platform?: string;
  color?: string;
  logoText?: string;
  description?: string;
  status?: string;
  clubIdEa?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export async function updateManagedTeamService(teamId: string, data: ManagedTeamUpdate) {
  return dbProvider.withTransaction(async (transaction) => {
    const teams = await transaction.teams.findById(teamId).then(r => r ? [{ id: r.id, captain_id: r.captainId }] : []);
    if (teams.length === 0) return { success: false, error: 'Equipo no encontrado.' };
    const captainId = data.captainId || teams[0].captain_id;
    const staffIds = [...new Set([captainId, ...(data.managerIds || [])])];
    const staff = await transaction.query<{ id: string }>(
      `SELECT id FROM users WHERE id IN (${staffIds.map(() => '?').join(', ')}) FOR UPDATE`,
      staffIds,
    );
    if (staff.length !== staffIds.length) return { success: false, error: 'Uno o más responsables no existen.' };
    if (data.organizationId) {
      const organizations = await transaction.organizations.findById(data.organizationId).then(r => r ? [{ id: r.id }] : []);
      if (organizations.length === 0) return { success: false, error: 'Organización no encontrada.' };
    }
    await transaction.execute(
      `UPDATE teams SET name = COALESCE(?, name), tag = COALESCE(?, tag), game_slug = COALESCE(?, game_slug),
        organization_id = COALESCE(?, organization_id), captain_id = ?, captain_name = COALESCE(?, captain_name),
        platform = COALESCE(?, platform), color = COALESCE(?, color), logo_text = COALESCE(?, logo_text),
        description = COALESCE(?, description), status = COALESCE(?, status), club_id_ea = COALESCE(?, club_id_ea),
        logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url), updated_at = NOW() WHERE id = ?`,
      [
        data.name || null, data.tag || null, data.gameSlug || null, data.organizationId || null, captainId,
        data.captainName || null, data.platform || null, data.color || null, data.logoText || null,
        data.description || null, data.status || null, data.clubIdEa ?? null, data.logoUrl ?? null, data.bannerUrl ?? null, teamId,
      ],
    );
    if (data.captainId || data.managerIds) {
      await transaction.query(
        "SELECT id FROM team_members WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado') FOR UPDATE",
        [teamId],
      );
      await transaction.execute(
        "DELETE FROM team_members WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado')",
        [teamId],
      );
      await transaction.execute(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, 'CAPITAN', 'Capitán')`,
        [randomUUID(), teamId, captainId],
      );
      for (const managerId of data.managerIds || []) {
        if (managerId === captainId) continue;
        await transaction.execute(
          `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, 'ENCARGADO', 'Encargado')`,
          [randomUUID(), teamId, managerId],
        );
      }
    }
    return { success: true };
  });
}

export async function archiveManagedTeamService(teamId: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const teams = await transaction.teams.findById(teamId).then(r => r ? [{ id: r.id }] : []);
    if (teams.length === 0) return { success: false, error: 'Equipo no encontrado.' };
    const activeCompetitions = await transaction.query<{ id: string }>(
      `SELECT ct.id
         FROM competition_teams ct
         JOIN competitions c ON c.id = ct.competition_id
        WHERE ct.team_id = ? AND ct.status = 'CONFIRMADO'
          AND c.status IN ('Activo', 'Inscripcion', 'En Curso') FOR UPDATE`,
      [teamId],
    );
    if (activeCompetitions.length > 0) {
      return { success: false, error: 'No se puede archivar un equipo inscrito en una competencia activa.' };
    }
    await transaction.execute(
      "UPDATE team_vacancies SET status = 'CERRADA' WHERE team_id = ? AND status = 'ABIERTA'",
      [teamId],
    );
    await transaction.execute(
      "UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE team_id = ? AND status = 'ACTIVO'",
      [teamId],
    );
    await transaction.execute(
      "UPDATE transfer_offers SET status = 'CANCELADO' WHERE team_id = ? AND status = 'PENDIENTE'",
      [teamId],
    );
    await transaction.execute("UPDATE teams SET status = 'Archivado', updated_at = NOW() WHERE id = ?", [teamId]);
    return { success: true };
  });
}

export async function getAvailablePlayersForSquadService(
  teamId: string,
  searchQuery?: string,
  organizerUserId?: string
): Promise<{ success: boolean; players: AvailablePlayerRow[]; error?: string }> {
  try {
    // Get team info
    const team = await dbProvider.teams.findById(teamId);
    if (!team) {
      return { success: false, players: [], error: 'Equipo no encontrado' };
    }

    // Get organizer org
    let organizerOrgId = team.organizationId;
    if (organizerUserId && !organizerOrgId) {
      const orgs = await dbProvider.query<{ id: string }>(
        `SELECT id FROM organizations WHERE owner_id = ? LIMIT 1`,
        [organizerUserId]
      );
      if (orgs.length > 0) organizerOrgId = orgs[0].id;
    }

    // Build query
    let sql = `
      SELECT u.id, u.name, u.gamertag, u.email, u.position, u.primary_game_slug, u.organization_id, u.avatar_url, u.foto
      FROM users u
      WHERE u.id NOT IN (SELECT DISTINCT user_id FROM team_members)
      AND u.is_banned = 0
    `;
    const params: DatabaseParams = [];

    if (organizerOrgId) {
      sql += ` AND (u.organization_id = ? OR u.organization_id IS NULL OR u.organization_id = '')`;
      params.push(organizerOrgId);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      sql += ` AND (u.name LIKE ? OR u.gamertag LIKE ? OR u.position LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY u.name ASC LIMIT 50`;

    const players = await dbProvider.query<AvailablePlayerRow>(sql, params);
    return { success: true, players };
  } catch (error: unknown) {
    console.error('Error en getAvailablePlayersForSquadService:', error);
    return { success: false, players: [], error: getErrorMessage(error, 'Error al buscar jugadores') };
  }
}

export interface GetTeamSquadResult {
  success: boolean;
  squad?: Array<{
    id: string;
    team_id: string;
    user_id: string;
    user_name: string;
    gamertag: string;
    email?: string;
    tactical_position: string;
    role_in_team: 'Capitan' | 'Jugador' | 'DT / Analyst';
    jersey_number?: number | null;
    avatar_url?: string | null;
    foto?: string | null;
    joined_at: string;
  }>;
  error?: string;
  code?: string;
}

export async function getTeamSquadService(teamId: string): Promise<GetTeamSquadResult> {
  try {
    if (!teamId) return { success: false, error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };

    const squadRows = await dbProvider.query<SquadRow>(
      `SELECT 
        tm.id, tm.team_id, tm.user_id, tm.organization_name, tm.tactical_position, tm.role_in_team, tm.jersey_number, tm.joined_at,
        u.name as user_name, u.gamertag, u.email, u.avatar_url, u.foto
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role_in_team ASC, u.name ASC`,
      [teamId]
    );

    // Fetch accepted contract offers for this team to get organizations
    const acceptedOffers = await dbProvider.query<{ player_user_id: string; pitch_message: string | null }>(
      `SELECT player_user_id, pitch_message FROM transfer_offers WHERE team_id = ? AND status = 'ACEPTADO'`,
      [teamId]
    );

    // Fetch competitions/organizations for this team
    const compOrgs = await dbProvider.query<{ org_id: string; org_name: string }>(
      `SELECT DISTINCT o.id as org_id, o.name as org_name
       FROM competition_teams ct
       JOIN competitions c ON ct.competition_id = c.id
       JOIN organizations o ON c.organization_id = o.id
       WHERE ct.team_id = ?`,
      [teamId]
    );

    // Group squadRows by user_id to prevent duplicate cards for multi-org players
    const userMap: Record<string, SquadWithOrganizations> = {};
    for (const r of squadRows) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = { ...r, member_org_names: [] };
      }
      if (r.organization_name) {
        userMap[r.user_id].member_org_names.push(r.organization_name);
      }
    }
    const uniqueSquad = Object.values(userMap);

    const squadWithOrgs = uniqueSquad.map((member) => {
      const orgNamesSet = new Set<string>();
      const orgIdsSet = new Set<string>();

      // 1. Add member's own organization_names from all their team_members rows
      for (const org of member.member_org_names) {
        orgNamesSet.add(org);
        orgIdsSet.add(org);
      }

      // 2. Add orgs from accepted contract offers for THIS specific player
      for (const off of acceptedOffers) {
        if (off.player_user_id === member.user_id && off.pitch_message) {
          const match = off.pitch_message.match(/\[Organización:\s*([^\]]+)\]/i);
          if (match && match[1]) {
            const orgVal = match[1].trim();
            orgNamesSet.add(orgVal);
            orgIdsSet.add(orgVal);
          }
        }
      }

      // 3. Fallback: if no specific org contract for this member, include team competition orgs
      if (orgNamesSet.size === 0) {
        for (const co of compOrgs) {
          if (co.org_name) orgNamesSet.add(co.org_name);
          if (co.org_id) orgIdsSet.add(co.org_id);
        }
      }

      return {
        ...member,
        organization_ids: Array.from(orgIdsSet).join(','),
        organization_names: Array.from(orgNamesSet).join(','),
      };
    });

    return { success: true, squad: squadWithOrgs };
  } catch (error: unknown) {
    console.error('Error en getTeamSquadService:', error);
    return { success: false, error: getErrorMessage(error, 'Error al obtener la plantilla.'), code: 'INTERNAL_ERROR' };
  }
}

export interface AddPlayerToSquadResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function addPlayerToSquadService(
  teamId: string,
  userId: string,
  tacticalPosition?: string,
  roleInTeam: 'Capitan' | 'Capitán' | 'Encargado' | 'Jugador' | 'DT / Analyst' = 'Jugador'
): Promise<AddPlayerToSquadResult> {
  return dbProvider.withTransaction(async (transaction) => {
    const users = await transaction.query<{ position: string }>(
      'SELECT position FROM users WHERE id = ? FOR UPDATE',
      [userId],
    );
    if (users.length === 0) {
      return { success: false, error: 'Jugador no encontrado', code: 'USER_NOT_FOUND' };
    }

    const teams = await transaction.query<{ organization_id: string | null }>(
      'SELECT organization_id FROM teams WHERE id = ? FOR UPDATE',
      [teamId],
    );
    if (teams.length === 0) {
      return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };
    }

    const existing = await transaction.query<{ id: string }>(
      'SELECT id FROM team_members WHERE user_id = ? FOR UPDATE',
      [userId],
    );
    if (existing.length > 0) {
      return { success: false, error: 'El jugador ya pertenece a otra escuadra', code: 'PLAYER_IN_TEAM' };
    }

    const positionToUse = tacticalPosition || users[0].position || 'DEL';

    const memberId = `tm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await transaction.execute(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, teamId, userId, positionToUse, roleInTeam],
    );

    if (teams[0].organization_id) {
      await transaction.execute(
        `UPDATE users SET organization_id = ? WHERE id = ? AND (organization_id IS NULL OR organization_id = '')`,
        [teams[0].organization_id, userId],
      );
    }

    await transaction.execute(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [teamId, teamId],
    );
    return { success: true };
  });
}

export async function isUserTeamManagerOrCaptainService(userId: string, teamId: string): Promise<boolean> {
  if (!userId || !teamId) return false;

  try {
    // 1. Check if user is global Admin or Organizer
    const userRows = await dbProvider.query<{ role: string }>('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    if (userRows && userRows.length > 0) {
      const r = userRows[0].role;
      if (r === 'Administrador' || r === 'Organizador') return true;
    }

    // 2. Check if user is Official Captain or listed in encargados_json
    const teamRows = await dbProvider.query<{ captain_id: string; encargados_json: string | unknown[] | null }>('SELECT captain_id, encargados_json FROM teams WHERE id = ? LIMIT 1', [teamId]);
    if (teamRows && teamRows.length > 0) {
      if (teamRows[0].captain_id === userId) return true;

      const jsonStr = teamRows[0].encargados_json;
      if (jsonStr) {
        try {
          const arr = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
          if (Array.isArray(arr) && arr.some((enc: unknown) => (typeof enc === 'string' ? enc === userId : isManagerEntry(enc) && enc.id === userId))) {
            return true;
          }
        } catch {}
      }
    }

    // 3. Check team_members table for role 'Capitán', 'Capitan', 'Encargado', 'DT / Analyst'
    const memberRows = await dbProvider.query<{ role_in_team: string }>(
      `SELECT role_in_team FROM team_members 
       WHERE team_id = ? AND user_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán') LIMIT 1`,
      [teamId, userId]
    );

    return Boolean(memberRows && memberRows.length > 0);
  } catch (err) {
    console.error('Error en isUserTeamManagerOrCaptainService:', err);
    return false;
  }
}

export interface RemovePlayerFromSquadResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function removePlayerFromSquadService(teamId: string, userId: string, orgName?: string): Promise<RemovePlayerFromSquadResult> {
  return dbProvider.withTransaction(async (transaction) => {
    await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    await transaction.query('SELECT id FROM teams WHERE id = ? FOR UPDATE', [teamId]);
    const membership = await transaction.query<{ id: string }>(
      orgName
        ? 'SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND LOWER(organization_name) = LOWER(?) FOR UPDATE'
        : 'SELECT id FROM team_members WHERE team_id = ? AND user_id = ? FOR UPDATE',
      orgName ? [teamId, userId, orgName] : [teamId, userId],
    );
    if (membership.length === 0) {
      return { success: false, error: 'El jugador no pertenece a la plantilla', code: 'MEMBER_NOT_FOUND' };
    }

    if (orgName) {
      await transaction.execute(
        'DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND LOWER(organization_name) = LOWER(?)',
        [teamId, userId, orgName],
      );
      await transaction.execute(
        `UPDATE transfer_offers SET status = 'CONCLUIDO'
          WHERE team_id = ? AND player_user_id = ? AND status = 'ACEPTADO'
            AND LOWER(pitch_message) LIKE LOWER(?)`,
        [teamId, userId, `%[organización: ${orgName}]%`],
      );
    } else {
      await transaction.execute('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
      await transaction.execute(
        "UPDATE transfer_offers SET status = 'CONCLUIDO' WHERE team_id = ? AND player_user_id = ? AND status = 'ACEPTADO'",
        [teamId, userId],
      );
    }

    await transaction.execute(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [teamId, teamId],
    );
    return { success: true };
  });
}

export async function updateSquadMemberJerseyService(memberId: string, jerseyNumber: number | null) {
  if (!memberId) return { success: false, error: 'ID de miembro de plantilla requerido.' };
  try {
    await dbProvider.query('UPDATE team_members SET jersey_number = ? WHERE id = ?', [jerseyNumber, memberId]);
    return { success: true, message: 'Dorsal asignado y actualizado exitosamente en MySQL.' };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Error al actualizar dorsal.') };
  }
}

export async function getAllPlayersForContractOfferService(gameSlug: string, searchQuery?: string) {
  try {
    let sql = `
      SELECT 
        u.id, u.name, u.gamertag, u.email, u.position, u.primary_game_slug, u.organization_id, u.avatar_url, u.foto,
        MAX(tm.team_id) as current_team_id,
        MAX(t.name) as current_team_name,
        MAX(t.tag) as current_team_tag
      FROM users u
      LEFT JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE u.is_banned = 0
    `;
    const params: DatabaseParams = [];

    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      sql += ` AND (u.name LIKE ? OR u.gamertag LIKE ? OR u.position LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` GROUP BY u.id ORDER BY u.name ASC LIMIT 100`;

    const rows = await dbProvider.query<ContractCandidateDatabaseRow>(sql, params);
    const players: ContractCandidate[] = rows.map((row) => ({
      ...row,
      organization_id: row.organization_id ?? undefined,
      avatar_url: row.avatar_url ?? undefined,
      foto: row.foto ?? undefined,
      current_team_id: row.current_team_id ?? undefined,
      current_team_name: row.current_team_name ?? undefined,
      current_team_tag: row.current_team_tag ?? undefined,
    }));
    return { success: true, players };
  } catch (error: unknown) {
    console.error('Error en getAllPlayersForContractOfferService:', error);
    return { success: false, players: [], error: getErrorMessage(error, 'Error al buscar todos los jugadores') };
  }
}

export async function sendClubContractOfferService(data: {
  teamId: string;
  playerUserId: string;
  offeredByUserId: string;
  position: string;
  organizationId?: string;
  organizationIds?: string[];
  pitchMessage?: string;
  gameSlug?: string;
}) {
  try {
    if (!data.teamId || !data.playerUserId) {
      return { success: false, error: 'ID de equipo y jugador requeridos.' };
    }

    const orgsToProcess = data.organizationIds && data.organizationIds.length > 0
      ? data.organizationIds
      : data.organizationId
      ? [data.organizationId]
      : ['Organización General'];

    return await dbProvider.withTransaction(async (transaction) => {
      const teams = await transaction.teams.findById(data.teamId).then(r => r ? [{ id: r.id }] : []);
      const players = await transaction.users.findById(data.playerUserId).then(r => r ? [{ id: r.id }] : []);
      if (teams.length === 0 || players.length === 0) return { success: false, error: 'Equipo o jugador no encontrado.' };

      const pending = await transaction.query<{ pitch_message: string | null }>(
        `SELECT pitch_message FROM transfer_offers
          WHERE team_id = ? AND player_user_id = ? AND status = 'PENDIENTE' FOR UPDATE`,
        [data.teamId, data.playerUserId],
      );
      let count = 0;
      for (const orgNameOrId of orgsToProcess) {
        const prefix = `[Organización: ${orgNameOrId}]`;
        if (pending.some((offer) => offer.pitch_message?.startsWith(prefix))) continue;
        const pitchText = `${prefix} ${data.pitchMessage || 'Oferta formal de contrato para unirse a la plantilla de la escuadra.'}`;
        await transaction.execute(
          `INSERT INTO transfer_offers (id, game_slug, team_id, player_user_id, offered_by_user_id, position, pitch_message, offer_type, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'OFERTA_CLUB', 'PENDIENTE')`,
          [randomUUID(), data.gameSlug || 'eafc26', data.teamId, data.playerUserId, data.offeredByUserId, data.position || 'DC', pitchText],
        );
        count++;
      }
      return { success: true, count, message: `Se emitieron ${count} propuesta(s) de contrato independiente(s) por Organización.` };
    });
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Error al enviar ofertas de contrato.') };
  }
}

// ── Competition Service ─────────────────────────────────────────────────────

export interface CreateCompetitionResult {
  success: boolean;
  competition?: Competition;
  message?: string;
  error?: string;
  code?: string;
}

export async function createCompetitionService(
  data: CreateCompetitionInput,
  organizerId: string,
  organizerName: string,
  organizationId: string | null
): Promise<CreateCompetitionResult> {
  const { createCompetitionSchema } = await import('@/lib/validation');
  const validation = validateSchema(createCompetitionSchema, data);

  if (!validation.success) {
    return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
  }

  const { name, gameSlug, modeFormat, fechaLimiteInscripcion, fechaInicio, fechaTermino, description, prizePool, transferMarketMode, seasonId, newSeasonName } = validation.data;

  let finalSeasonId = seasonId;
  if (newSeasonName && newSeasonName.trim()) {
    const season = await dbProvider.seasons.create({
      name: newSeasonName.trim(),
      organizationId: organizationId || undefined,
    });
    finalSeasonId = season.id;
  }

  const competition = await dbProvider.competitions.create({
    name,
    gameSlug,
    organizerId,
    organizerName,
    organizationId,
    seasonId: finalSeasonId,
    prizePool,
    transferMarketMode,
    modeFormat,
    status: data.status || 'Inscripcion',
    fechaLimiteInscripcion: fechaLimiteInscripcion ? new Date(fechaLimiteInscripcion).toISOString().slice(0, 19).replace('T', ' ') : null,
    fechaInicio: new Date(fechaInicio).toISOString().slice(0, 19).replace('T', ' '),
    fechaTermino: fechaTermino ? new Date(fechaTermino).toISOString().slice(0, 19).replace('T', ' ') : null,
    description,
  });

  return { success: true, competition };
}

// ── Fixture Generation Service ──────────────────────────────────────────────

export interface FixtureConfig {
  startDate: string;
  selectedDays: string[];
  selectedTimes: string[];
  matchMode: 'PartidoUnico' | 'IdaVuelta';
  format: 'Liga' | 'Playoff' | 'Hibrido';
  groupCount: number;
  qualifiersPerGroup: number;
}

export interface FixtureGenerationResult {
  success: boolean;
  matchesCreated?: number;
  message?: string;
  error?: string;
  code?: string;
}

export async function generateFixtureService(
  competitionId: string,
  config: FixtureConfig
): Promise<FixtureGenerationResult> {
  return dbProvider.withTransaction(async (transaction) => {
    const competitions = await transaction.query<{ id: string }>(
      'SELECT id FROM competitions WHERE id = ? FOR UPDATE',
      [competitionId],
    );
    if (competitions.length === 0) {
      return { success: false, error: 'Competencia no encontrada', code: 'NOT_FOUND' };
    }

    const enrolledTeams = await transaction.query<{ team_id: string; team_name: string; team_tag: string | null }>(
      `SELECT * FROM competition_teams WHERE competition_id = ? AND status = 'CONFIRMADO' FOR UPDATE`,
      [competitionId],
    );
    if (enrolledTeams.length < 2) {
      return { success: false, error: 'Se requieren al menos 2 equipos confirmados', code: 'NOT_ENOUGH_TEAMS' };
    }

    const teams = enrolledTeams.map((team) => ({ id: team.team_id, name: team.team_name, tag: team.team_tag }));
    await transaction.execute(
      'DELETE FROM matches WHERE competition_id = ?',
      [competitionId],
    );

    const { startDate, selectedDays, selectedTimes, matchMode, format, groupCount, qualifiersPerGroup } = config;
    const totalSavedMatches = await generateMatchesForFormat(
      transaction,
      competitionId,
      teams,
      format,
      matchMode,
      startDate,
      selectedDays,
      selectedTimes,
      groupCount,
      qualifiersPerGroup,
    );

    await transaction.execute(
      `UPDATE competitions
          SET status = 'Activo', format = ?, match_mode = ?, group_count = ?, qualifiers_per_group = ?
        WHERE id = ?`,
      [config.format, config.matchMode, config.groupCount, config.qualifiersPerGroup, competitionId],
    );

    return { success: true, matchesCreated: totalSavedMatches };
  });
}

async function generateMatchesForFormat(
  transaction: DatabaseExecutor,
  competitionId: string,
  teams: { id: string; name: string; tag: string | null }[],
  format: 'Liga' | 'Playoff' | 'Hibrido',
  matchMode: 'PartidoUnico' | 'IdaVuelta',
  startDate: string,
  selectedDays: string[],
  selectedTimes: string[],
  groupCount: number,
  qualifiersPerGroup: number
): Promise<number> {
  const { getMatchdayDateTime } = await import('@/lib/fixture-date-scheduler');
  const { distributeTeamsIntoGroups, generatePlayoffBracket } = await import('@/lib/matchmaking-bracket');
  
  let totalSavedMatches = 0;
  const compClean = competitionId.replace(/[^a-zA-Z0-9]/g, '');
  
  const days = selectedDays.length > 0 ? selectedDays : ['Martes', 'Jueves'];
  const times = selectedTimes.length > 0 ? selectedTimes : ['20:00'];
  
  const timeSlotsConfig: { dayLabel: string; time: string }[] = [];
  days.forEach(dayLabel => times.forEach(time => timeSlotsConfig.push({ dayLabel, time })));

  const getScheduledDateTime = (matchdayNumber: number) => {
    const info = getMatchdayDateTime(matchdayNumber, startDate, days, times);
    return { scheduledTime: info.timeStr, scheduledDateTimeISO: info.iso };
  };

  if (format === 'Playoff') {
    const playoffNodes = generatePlayoffBracket(competitionId, teams, matchMode);
    for (const node of playoffNodes.reverse()) {
      let matchdayNumber = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      }
      const timing = getScheduledDateTime(matchdayNumber);
      
      await transaction.execute(
        `INSERT INTO matches 
         (id, tournament_id, competition_id, matchday_number, matchday, stage, round_name, next_match_id, next_match_slot, 
          home_team_id, away_team_id, team_home_id, team_away_id, home_team_name, away_team_name, status, scheduled_time, scheduled_at)
         VALUES (?, ?, ?, ?, ?, 'PLAYOFF', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
        [
          node.id, competitionId, competitionId, matchdayNumber, matchdayNumber,
          node.roundName, node.nextMatchId, node.nextMatchSlot,
          node.homeTeamId, node.awayTeamId, node.homeTeamId, node.awayTeamId,
          node.homeTeamName, node.awayTeamName,
          timing.scheduledTime, timing.scheduledDateTimeISO
        ]
      );
      totalSavedMatches++;
    }
  } else if (format === 'Hibrido') {
    const groups = distributeTeamsIntoGroups(teams, groupCount);
    let maxGroupMatchday = 1;

    // Fase de grupos
    for (const [groupIndex, group] of groups.entries()) {
      const groupTeams = [...group.teams];
      if (groupTeams.length % 2 !== 0) groupTeams.push({ id: 'BYE', name: 'DESCANSO (BYE)' });
      
      const numTeams = groupTeams.length;
      const singleRoundMatchesCount = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      const totalLegs = matchMode === 'IdaVuelta' ? 2 : 1;

      for (let leg = 0; leg < totalLegs; leg++) {
        for (let round = 0; round < singleRoundMatchesCount; round++) {
          const matchdayNumber = leg * singleRoundMatchesCount + round + 1;
          if (matchdayNumber > maxGroupMatchday) maxGroupMatchday = matchdayNumber;
          const timing = getScheduledDateTime(matchdayNumber);

          for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
            const rawHomeIndex = (round + matchIndex) % (numTeams - 1);
            let rawAwayIndex = (numTeams - 1 - matchIndex + round) % (numTeams - 1);
            if (matchIndex === 0) rawAwayIndex = numTeams - 1;

            const homeIndex = leg === 0 ? rawHomeIndex : rawAwayIndex;
            const awayIndex = leg === 0 ? rawAwayIndex : rawHomeIndex;

            const home = groupTeams[homeIndex];
            const away = groupTeams[awayIndex];

            if (home.id !== 'BYE' && away.id !== 'BYE') {
              const matchId = `m-${compClean}-g${groupIndex + 1}-j${matchdayNumber}-m${matchIndex + 1}`;

              await transaction.execute(
                `INSERT INTO matches 
                 (id, tournament_id, competition_id, matchday_number, matchday, stage, group_name, 
                  team_home_id, team_away_id, home_team_id, away_team_id, home_team_name, away_team_name, status, scheduled_time, scheduled_at)
                 VALUES (?, ?, ?, ?, ?, 'GROUP', ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
                [
                  matchId, competitionId, competitionId, matchdayNumber, matchdayNumber,
                  group.groupName,
                  home.id, away.id, home.id, away.id,
                  home.name, away.name,
                  timing.scheduledTime, timing.scheduledDateTimeISO
                ]
              );
              totalSavedMatches++;
            }
          }
        }
      }
    }

    // Fase de playoffs híbrida
    const playoffTeamCount = groupCount * qualifiersPerGroup;
    const playoffNodes = generatePlayoffBracket(competitionId, teams.slice(0, playoffTeamCount), matchMode, true, groupCount, qualifiersPerGroup);

    for (const node of playoffNodes.reverse()) {
      let playoffRoundOffset = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        playoffRoundOffset = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      }
      const matchdayNumber = maxGroupMatchday + playoffRoundOffset;
      const timing = getScheduledDateTime(matchdayNumber);

      await transaction.execute(
        `INSERT INTO matches 
         (id, tournament_id, competition_id, matchday_number, matchday, stage, round_name, next_match_id, next_match_slot, 
          home_team_id, away_team_id, team_home_id, team_away_id, home_team_name, away_team_name, status, scheduled_time, scheduled_at)
         VALUES (?, ?, ?, ?, ?, 'PLAYOFF', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
        [
          node.id, competitionId, competitionId, matchdayNumber, matchdayNumber,
          node.roundName, node.nextMatchId, node.nextMatchSlot,
          node.homeTeamId, node.awayTeamId, node.homeTeamId, node.awayTeamId,
          node.homeTeamName, node.awayTeamName,
          timing.scheduledTime, timing.scheduledDateTimeISO
        ]
      );
      totalSavedMatches++;
    }
  } else {
    // Liga
    const teamsCopy = [...teams];
    if (teamsCopy.length % 2 !== 0) teamsCopy.push({ id: 'BYE', name: 'DESCANSO (BYE)', tag: 'BYE' });
    
    const numTeams = teamsCopy.length;
    const singleRoundMatchesCount = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const totalLegs = matchMode === 'IdaVuelta' ? 2 : 1;

    for (let leg = 0; leg < totalLegs; leg++) {
      for (let round = 0; round < singleRoundMatchesCount; round++) {
        const matchdayNumber = leg * singleRoundMatchesCount + round + 1;
        const timing = getScheduledDateTime(matchdayNumber);

        for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
          const rawHomeIndex = (round + matchIndex) % (numTeams - 1);
          let rawAwayIndex = (numTeams - 1 - matchIndex + round) % (numTeams - 1);
          if (matchIndex === 0) rawAwayIndex = numTeams - 1;

          const homeIndex = leg === 0 ? rawHomeIndex : rawAwayIndex;
          const awayIndex = leg === 0 ? rawAwayIndex : rawHomeIndex;

          const home = teamsCopy[homeIndex];
          const away = teamsCopy[awayIndex];

          if (home.id !== 'BYE' && away.id !== 'BYE') {
            const matchId = `m-${compClean}-j${matchdayNumber}-m${matchIndex + 1}`;

            await transaction.execute(
              `INSERT INTO matches 
               (id, tournament_id, competition_id, matchday_number, matchday, stage, 
                team_home_id, team_away_id, home_team_id, away_team_id, home_team_name, away_team_name, status, scheduled_time, scheduled_at)
               VALUES (?, ?, ?, ?, ?, 'GROUP', ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
              [
                matchId, competitionId, competitionId, matchdayNumber, matchdayNumber,
                home.id, away.id, home.id, away.id,
                home.name, away.name,
                timing.scheduledTime, timing.scheduledDateTimeISO
              ]
            );
            totalSavedMatches++;
          }
        }
      }
    }
  }

  return totalSavedMatches;
}

// ── Transfer Service ────────────────────────────────────────────────────────

// ── Transfer Service ────────────────────────────────────────────────────────

export interface CreateTransferResult {
  success: boolean;
  applicationId?: string;
  isExtraordinary?: boolean;
  error?: string;
  code?: string;
}

export interface AthleteTransferHistoryItem {
  id: string;
  gameSlug: string;
  fromTeamName: string | null;
  toTeamName: string;
  signedAt: string;
  transferType: string;
}

export interface AthleteTransferHistoryResult {
  userId: string;
  totalMovements: number;
  recentTransfers: AthleteTransferHistoryItem[];
}

export async function createTransferApplicationService(data: {
  teamId: string;
  userId: string;
  gameSlug: string;
  position: string;
  pitchMessage?: string;
  type: 'POSTULACION_JUGADOR' | 'OFERTA_CLUB';
  competitionId?: string;
}): Promise<CreateTransferResult> {
  const { teamId, userId, gameSlug, position, pitchMessage, type, competitionId } = data;

  return dbProvider.withTransaction(async (transaction) => {
    const teams = await transaction.query<{ id: string; max_members: number }>(
      'SELECT id, max_members FROM teams WHERE id = ? FOR UPDATE',
      [teamId],
    );
    if (teams.length === 0) return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };
    const users = await transaction.users.findById(userId).then(r => r ? [{ id: r.id }] : []);
    if (users.length === 0) return { success: false, error: 'Jugador no encontrado', code: 'USER_NOT_FOUND' };

    const maxSquadSize = Math.min(teams[0].max_members || 45, gameSlug === 'eafc26' ? 20 : 7);
    const currentMembersCount = await transaction.query<{ total: number }>(
      'SELECT COUNT(*) as total FROM team_members WHERE team_id = ? FOR UPDATE',
      [teamId],
    );
    if ((currentMembersCount[0]?.total ?? 0) >= maxSquadSize) {
      return { success: false, error: `El equipo ha alcanzado la capacidad máxima de plantilla (${maxSquadSize} atletas).`, code: 'SQUAD_FULL' };
    }

    let marketMode: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO' = 'ABIERTO';
    let isCompetitionActive = false;
    if (competitionId) {
      const comps = await transaction.query<{ transfer_market_mode: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO'; status: string }>(
        'SELECT transfer_market_mode, status FROM competitions WHERE id = ? FOR UPDATE',
        [competitionId],
      );
      if (comps.length === 0) return { success: false, error: 'Competencia no encontrada', code: 'COMPETITION_NOT_FOUND' };
      marketMode = comps[0].transfer_market_mode;
      isCompetitionActive = ['EN_CURSO', 'IN_PROGRESS', 'En Curso', 'En_Juego'].includes(comps[0].status);
    }
    if (marketMode === 'SIN_MERCADO') {
      return { success: false, error: 'Mercado de transferencias deshabilitado en esta competencia', code: 'MARKET_CLOSED' };
    }

    const duplicates = await transaction.query<{ id: string }>(
      `SELECT id FROM transfer_applications
        WHERE team_id = ? AND applicant_user_id = ? AND application_type = ? AND status = 'PENDIENTE' FOR UPDATE`,
      [teamId, userId, type],
    );
    if (duplicates.length > 0) return { success: false, error: 'Ya existe una solicitud pendiente.', code: 'DUPLICATE_APPLICATION' };

    const appId = randomUUID();
    const isExtraordinary = marketMode === 'CERRADO' || isCompetitionActive;
    await transaction.execute(
      `INSERT INTO transfer_applications (id, team_id, applicant_user_id, game_slug, position, pitch_message, application_type, status, is_extraordinary, organizer_approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
      [appId, teamId, userId, gameSlug, position, pitchMessage || null, type, isExtraordinary ? 1 : 0, isExtraordinary ? 'PENDIENTE_ORGANIZADOR' : 'NINGUNO'],
    );
    return { success: true, applicationId: appId, isExtraordinary };
  });
}

export async function respondOrdinaryTransferApplicationService(
  applicationId: string,
  processedByUserId: string,
  accept: boolean,
): Promise<{ success: boolean; error?: string }> {
  return dbProvider.withTransaction(async (transaction) => {
    const applications = await transaction.query<TransferApplicationRow>(
      `SELECT * FROM transfer_applications
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'NINGUNO' FOR UPDATE`,
      [applicationId],
    );
    if (applications.length === 0) return { success: false, error: 'Solicitud ordinaria no encontrada o ya procesada.' };
    const application = applications[0];

    if (!accept) {
      await executeCas(transaction as any,
        `UPDATE transfer_applications SET status = 'RECHAZADO', processed_by = ?, processed_at = NOW()
          WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'NINGUNO'`,
        [processedByUserId, applicationId],
        'La solicitud ya fue procesada.',
      );
      return { success: true };
    }

    await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [application.applicant_user_id]);
    const teams = await transaction.query<{ id: string; name: string; max_members: number }>(
      'SELECT id, name, max_members FROM teams WHERE id = ? FOR UPDATE',
      [application.team_id],
    );
    if (teams.length === 0) return { success: false, error: 'Equipo no encontrado.' };
    const counts = await transaction.query<{ total: number }>(
      'SELECT COUNT(*) AS total FROM team_members WHERE team_id = ? FOR UPDATE',
      [application.team_id],
    );
    const limit = Math.min(teams[0].max_members || 45, application.game_slug === 'eafc26' ? 20 : 7);
    if ((counts[0]?.total ?? 0) >= limit) return { success: false, error: 'El equipo alcanzó su capacidad máxima.' };

    const previousTeams = await transaction.query<{ id: string; name: string }>(
      `SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id
        WHERE tm.user_id = ? FOR UPDATE`,
      [application.applicant_user_id],
    );
    await executeCas(transaction as any,
      `UPDATE transfer_applications SET status = 'ACEPTADO', processed_by = ?, processed_at = NOW()
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'NINGUNO'`,
      [processedByUserId, applicationId],
      'La solicitud ya fue procesada.',
    );
    await transaction.execute('DELETE FROM team_members WHERE user_id = ?', [application.applicant_user_id]);
    await transaction.execute(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, ?, 'Jugador')`,
      [randomUUID(), application.team_id, application.applicant_user_id, application.position],
    );
    await transaction.execute(
      `INSERT INTO transfer_history_logs
        (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TRASPASO_DIRECTO')`,
      [
        randomUUID(), application.game_slug, application.applicant_user_id, previousTeams[0]?.id || null,
        previousTeams[0]?.name || 'Agente Libre', application.team_id, teams[0].name, processedByUserId,
      ],
    );
    for (const previousTeam of previousTeams) {
      await transaction.execute(
        'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
        [previousTeam.id, previousTeam.id],
      );
    }
    await transaction.execute(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [application.team_id, application.team_id],
    );
    await transaction.execute(
      "UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND status = 'ACTIVO'",
      [application.applicant_user_id],
    );
    return { success: true };
  });
}

export async function cancelTransferOfferService(offerId: string, expectedTeamId: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const offers = await transaction.query<{ id: string; team_id: string }>(
      "SELECT id, team_id FROM transfer_offers WHERE id = ? AND status = 'PENDIENTE' FOR UPDATE",
      [offerId],
    );
    if (offers.length === 0 || offers[0].team_id !== expectedTeamId) return { success: false, error: 'Oferta no encontrada o ya procesada.' };
    await executeCas(transaction as any,
      "UPDATE transfer_offers SET status = 'CANCELADO' WHERE id = ? AND team_id = ? AND status = 'PENDIENTE'",
      [offerId, expectedTeamId],
      'La oferta ya fue procesada.',
    );
    return { success: true, message: 'Oferta cancelada correctamente.' };
  });
}

export async function approveExtraordinaryTransferService(applicationId: string, organizerUserId: string): Promise<{ success: boolean; error?: string }> {
  return dbProvider.withTransaction(async (transaction) => {
    const apps = await transaction.query<TransferApplicationRow>(
      `SELECT * FROM transfer_applications
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'PENDIENTE_ORGANIZADOR'
        FOR UPDATE`,
      [applicationId],
    );
    if (apps.length === 0) return { success: false, error: 'Solicitud no encontrada o ya procesada' };
    const app = apps[0];

    await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [app.applicant_user_id]);

    const newTeams = await transaction.query<{ name: string }>(
      'SELECT name FROM teams WHERE id = ? FOR UPDATE',
      [app.team_id],
    );
    if (newTeams.length === 0) return { success: false, error: 'Equipo no encontrado' };

    const maxSquadSize = app.game_slug === 'eafc26' ? 20 : 7;
    const currentMembersCount = await transaction.query<{ total: number }>(
      'SELECT COUNT(*) as total FROM team_members WHERE team_id = ?',
      [app.team_id],
    );
    if ((currentMembersCount[0]?.total ?? 0) >= maxSquadSize) {
      return { success: false, error: `No se puede aprobar. El equipo ya alcanzó su tope máximo de ${maxSquadSize} jugadores.` };
    }

    const prevTeams = await transaction.query<{ id: string; name: string }>(
      `SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id
        WHERE tm.user_id = ? FOR UPDATE`,
      [app.applicant_user_id],
    );
    const fromTeamId = prevTeams[0]?.id || null;
    const fromTeamName = prevTeams[0]?.name || 'Agente Libre';

    await executeCas(transaction as any,
      `UPDATE transfer_applications
          SET status = 'ACEPTADO', organizer_approval_status = 'APROBADO_ORGANIZADOR', processed_by = ?, processed_at = NOW()
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'PENDIENTE_ORGANIZADOR'`,
      [organizerUserId, applicationId],
      'La solicitud ya fue procesada por otro usuario.',
    );

    await transaction.execute(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
       VALUES (?, ?, ?, ?, 'Jugador')
       ON DUPLICATE KEY UPDATE tactical_position = VALUES(tactical_position)`,
      [randomUUID(), app.team_id, app.applicant_user_id, app.position],
    );
    await transaction.execute(
      `INSERT INTO transfer_history_logs (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EXTRAORDINARIO')`,
      [randomUUID(), app.game_slug, app.applicant_user_id, fromTeamId, fromTeamName, app.team_id, newTeams[0].name, organizerUserId],
    );
    await transaction.execute(
      "UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND type = 'JUGADOR_BUSCA_CLUB'",
      [app.applicant_user_id],
    );
    await transaction.execute(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [app.team_id, app.team_id],
    );
    return { success: true };
  });
}

export async function rejectExtraordinaryTransferService(applicationId: string, organizerUserId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  void reason;
  await dbProvider.query(
    `UPDATE transfer_applications SET status = 'RECHAZADO', organizer_approval_status = 'RECHAZADO_ORGANIZADOR', processed_by = ?, processed_at = NOW() WHERE id = ?`,
    [organizerUserId, applicationId]
  );
  return { success: true };
}

export async function getAthleteTransferHistoryService(userId: string, organizationId?: string): Promise<AthleteTransferHistoryResult> {
  const params: DatabaseParams = [userId];
  let orgWhere = '';
  if (organizationId) {
    orgWhere = ' AND (organization_id = ? OR organization_id IS NULL)';
    params.push(organizationId);
  }

  const logs = await dbProvider.query<TransferHistoryRow>(
    `SELECT id, game_slug, from_team_name, to_team_name, signed_at, transfer_type 
     FROM transfer_history_logs 
     WHERE player_user_id = ? ${orgWhere}
     ORDER BY signed_at DESC 
     LIMIT 10`,
    params
  );

  const countRes = await dbProvider.query<{ total: number }>(
    `SELECT COUNT(*) as total FROM transfer_history_logs WHERE player_user_id = ? ${orgWhere}`,
    params
  );

  const totalMovements = countRes[0]?.total || logs.length;

  return {
    userId,
    totalMovements,
    recentTransfers: logs.map((l) => ({
      id: l.id,
      gameSlug: l.game_slug,
      fromTeamName: l.from_team_name || 'Agente Libre',
      toTeamName: l.to_team_name,
      signedAt: l.signed_at,
      transferType: l.transfer_type,
    })),
  };
}

// ── Transfer Market Posts Services ─────────────────────────────────────────

export interface CreateTransferPostData {
  gameSlug: string;
  type: 'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR';
  userId: string;
  userName: string;
  userGamertag: string;
  teamId?: string;
  teamName?: string;
  position: string;
  platform: string;
  message: string;
}

export async function createTransferPostService(data: CreateTransferPostData): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { gameSlug, type, userId, userName, userGamertag, teamId, teamName, position, platform, message } = data;

  const postId = randomUUID();

  try {
    return await dbProvider.withTransaction(async (transaction) => {
      const users = await transaction.users.findById(userId).then(r => r ? [{ id: r.id }] : []);
      if (users.length === 0) return { success: false, error: 'Usuario no encontrado.' };
      if (type === 'CLUB_RECLUTA_JUGADOR') {
        if (!teamId) return { success: false, error: 'Equipo requerido.' };
        const teams = await transaction.teams.findById(teamId).then(r => r ? [{ id: r.id }] : []);
        if (teams.length === 0) return { success: false, error: 'Equipo no encontrado.' };
      }

      const activePosts = await transaction.query<{ id: string }>(
        type === 'JUGADOR_BUSCA_CLUB'
          ? `SELECT id FROM transfer_market_posts
              WHERE user_id = ? AND game_slug = ? AND type = 'JUGADOR_BUSCA_CLUB' AND status = 'ACTIVO' FOR UPDATE`
          : `SELECT id FROM transfer_market_posts
              WHERE team_id = ? AND game_slug = ? AND type = 'CLUB_RECLUTA_JUGADOR' AND position = ? AND status = 'ACTIVO' FOR UPDATE`,
        type === 'JUGADOR_BUSCA_CLUB' ? [userId, gameSlug] : [teamId, gameSlug, position],
      );
      if (activePosts.length > 0) {
        await transaction.execute(
          `UPDATE transfer_market_posts SET status = 'CADUCADO'
            WHERE id IN (${activePosts.map(() => '?').join(', ')}) AND status = 'ACTIVO'`,
          activePosts.map((post) => post.id),
        );
      }
      await transaction.execute(
        `INSERT INTO transfer_market_posts
          (id, game_slug, type, user_id, user_name, user_gamertag, team_id, team_name, position, platform, status, message, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [postId, gameSlug, type, userId, userName, userGamertag, teamId || null, teamName || null, position, platform, message],
      );
      return { success: true, postId };
    });
  } catch (err: unknown) {
    console.error('Error al crear publicación en BD:', err);
    return { success: false, error: getErrorMessage(err, 'Error en BD') };
  }
}

export async function cancelTransferPostService(postId: string, actorUserId: string, expectedTeamId?: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const posts = await transaction.query<{ id: string; user_id: string; team_id: string | null }>(
      "SELECT id, user_id, team_id FROM transfer_market_posts WHERE id = ? AND status = 'ACTIVO' FOR UPDATE",
      [postId],
    );
    const post = posts[0];
    if (!post || (post.user_id !== actorUserId && (!expectedTeamId || post.team_id !== expectedTeamId))) {
      return { success: false, error: 'Publicación no encontrada o no autorizada.' };
    }
    await executeCas(transaction as any,
      "UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE id = ? AND status = 'ACTIVO'",
      [postId],
      'La publicación ya fue cerrada.',
    );
    return { success: true };
  });
}

export async function getTransferPostsService(
  gameSlug: string,
  timeFilter: 'TODAY' | '3_DAYS' | '7_DAYS' | 'ALL' = 'ALL'
) {
  try {
    // 1. Auto-expire old posts older than 7 days
    await dbProvider.query(
      `UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE expires_at < NOW() AND status = 'ACTIVO'`
    );

    // 2. Build time filter clause
    let timeClause = '';
    if (timeFilter === 'TODAY') {
      timeClause = ' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
    } else if (timeFilter === '3_DAYS') {
      timeClause = ' AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)';
    } else if (timeFilter === '7_DAYS') {
      timeClause = ' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    const posts = await dbProvider.query<TransferPostRow>(
      `SELECT id, game_slug, type, user_id, user_name, user_gamertag, team_id, team_name, position, platform, status, message, expires_at, created_at
       FROM transfer_market_posts
       WHERE game_slug = ? AND status = 'ACTIVO' ${timeClause}
       ORDER BY created_at DESC`,
      [gameSlug]
    );

    return posts.map((p) => ({
      id: p.id,
      gameSlug: p.game_slug,
      type: p.type,
      userId: p.user_id,
      userName: p.user_name,
      userGamertag: p.user_gamertag,
      teamId: p.team_id,
      teamName: p.team_name,
      position: p.position,
      platform: p.platform,
      status: p.status,
      message: p.message,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
    }));
  } catch (err) {
    console.error('MySQL Error in getTransferPostsService:', err);
    return [];
  }
}

export async function getCompletedTransfersService(gameSlug: string) {
  try {
    const logs = await dbProvider.query<TransferHistoryRow>(
      `SELECT thl.id, thl.game_slug, thl.player_user_id, COALESCE(u.name, 'Atleta Oficial') as player_name, COALESCE(u.gamertag, 'Atleta') as player_gamertag, 
              thl.from_team_name, thl.to_team_name, thl.transfer_type, thl.signed_at
       FROM transfer_history_logs thl
       LEFT JOIN users u ON thl.player_user_id = u.id
       WHERE thl.game_slug = ?
       ORDER BY thl.signed_at DESC
       LIMIT 50`,
      [gameSlug]
    );

    return logs.map((l) => ({
      id: l.id,
      gameSlug: l.game_slug,
      playerName: l.player_name || 'Atleta Oficial',
      playerGamertag: l.player_gamertag || 'Atleta',
      fromTeamName: l.from_team_name || 'Agente Libre',
      toTeamName: l.to_team_name,
      transferType: l.transfer_type,
      signedAt: l.signed_at,
    }));
  } catch (err) {
    console.error('MySQL Error in getCompletedTransfersService:', err);
    return [];
  }
}

// ── Match Report Service ────────────────────────────────────────────────────

export interface SubmitMatchReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
  code?: string;
}

export async function submitMatchReportService(data: {
  matchId: string;
  reportedByUserId: string;
  scoreHome: number;
  scoreAway: number;
  proofUrl?: string | null;
  playerStats?: Array<{
    userId: string;
    teamId: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    rating: number;
    isMvp: boolean;
  }>;
}): Promise<SubmitMatchReportResult> {
  const { matchId, reportedByUserId, scoreHome, scoreAway, proofUrl, playerStats } = data;

  const reportId = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return dbProvider.withTransaction(async (transaction) => {
    const matches = await transaction.query<{ id: string; status: string }>(
      'SELECT id, status FROM matches WHERE id = ? FOR UPDATE',
      [matchId],
    );
    if (matches.length === 0) return { success: false, error: 'Partido no encontrado', code: 'NOT_FOUND' };

    await transaction.execute(
      `INSERT INTO match_reports (id, match_id, reported_by_user_id, score_home, score_away, proof_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')
       ON DUPLICATE KEY UPDATE reported_by_user_id = VALUES(reported_by_user_id), score_home = VALUES(score_home),
         score_away = VALUES(score_away), proof_url = VALUES(proof_url), status = 'PENDIENTE'`,
      [reportId, matchId, reportedByUserId, scoreHome, scoreAway, proofUrl || null],
    );
    await executeCas(transaction as any,
      `UPDATE matches
          SET reported_score_home = ?, reported_score_away = ?, proof_url = ?, reported_by_user_id = ?, status = 'POR_REVISAR'
        WHERE id = ? AND status IN ('PENDIENTE', 'EN_CURSO', 'DISPUTADO')`,
      [scoreHome, scoreAway, proofUrl || null, reportedByUserId, matchId],
      'El partido ya fue reportado o finalizado.',
    );

    for (const stat of playerStats || []) {
      await transaction.execute(
        `INSERT INTO match_player_stats
           (id, match_id, team_id, user_id, goals, assists, yellow_cards, red_cards, rating, is_mvp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE goals = VALUES(goals), assists = VALUES(assists), yellow_cards = VALUES(yellow_cards),
           red_cards = VALUES(red_cards), rating = VALUES(rating), is_mvp = VALUES(is_mvp)`,
        [
          randomUUID(), matchId, stat.teamId, stat.userId,
          stat.goals || 0, stat.assists || 0, stat.yellowCards || 0, stat.redCards || 0,
          stat.rating || 6.0, stat.isMvp ? 1 : 0,
        ],
      );
    }
    return { success: true, reportId };
  });
}

// ── Season Service ──────────────────────────────────────────────────────────

export interface CreateSeasonResult {
  success: boolean;
  message?: string;
  seasonId?: string;
  seasonName?: string;
  error?: string;
  code?: string;
}

export async function createSeasonService(
  name: string,
  organizationId?: string,
  startDate?: string,
  endDate?: string
): Promise<CreateSeasonResult> {
  try {
    if (!name || name.trim() === '') {
      return { success: false, error: 'El nombre de la temporada es obligatorio.', code: 'VALIDATION_ERROR' };
    }

    const season = await dbProvider.seasons.create({
      name: name.trim(),
      organizationId: organizationId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'Activa',
    });

    return {
      success: true,
      message: `Temporada "${name.trim()}" creada exitosamente.`,
      seasonId: season.id,
      seasonName: season.name,
    };
  } catch (error: unknown) {
    console.error('Error en createSeasonService:', error);
    return { success: false, error: getErrorMessage(error, 'Error al crear la temporada.'), code: 'INTERNAL_ERROR' };
  }
}

// ── Match Report Roster Service ─────────────────────────────────────────────

export interface GetTeamRosterForMatchReportResult {
  success: boolean;
  roster?: Array<{
    id: string;
    user_id: string;
    user_name: string;
    gamertag: string;
    position: string;
    jersey_number: number | null;
    role_in_team: string;
  }>;
  error?: string;
  code?: string;
}

export async function getTeamRosterForMatchReportService(teamId: string): Promise<GetTeamRosterForMatchReportResult> {
  try {
    const roster = await dbProvider.query<{
      id: string;
      user_id: string;
      user_name: string;
      gamertag: string;
      position: string;
      jersey_number: number | null;
      role_in_team: string;
    }>(
      `SELECT tm.id, tm.user_id, u.name as user_name, u.gamertag, tm.tactical_position as position, tm.jersey_number, tm.role_in_team
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role_in_team ASC, u.name ASC`,
      [teamId]
    );

    return { success: true, roster };
  } catch (error: unknown) {
    console.error('Error en getTeamRosterForMatchReportService:', error);
    return { success: false, roster: [], error: getErrorMessage(error, 'Error al cargar plantilla.'), code: 'INTERNAL_ERROR' };
  }
}

// ── Dynamic Game Configuration Service ────────────────────────────────────

export interface GameDynamicConfig {
  gameSlug: string;
  name: string;
  maxSquadCap: number;
  maxTransfersPerWindow: number;
  postExpirationDays: number;
  positions: string[];
  brandColor: string;
}

export async function getGameConfigurationService(gameSlug: string): Promise<GameDynamicConfig> {
  const fallbackCap = gameSlug === 'eafc26' ? 20 : 7;
  const fallbackPositions = GAMES_CATALOG[gameSlug]?.positions || ['MCO', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'DC'];
  const fallbackColor = GAMES_CATALOG[gameSlug]?.brandColor || '#00F0FF';
  const fallbackName = GAMES_CATALOG[gameSlug]?.name || gameSlug.toUpperCase();

  try {
    // Ensure game row is seeded in games table with dynamic config
    await dbProvider.query(
      `INSERT INTO \`games\` (\`slug\`, \`name\`, \`category\`, \`team_size\`, \`max_roster_members\`, \`max_squad_cap\`, \`max_transfers_per_window\`, \`post_expiration_days\`, \`positions_json\`, \`brand_color\`)
       VALUES (?, ?, ?, 11, 45, ?, 3, 7, ?, ?)
       ON DUPLICATE KEY UPDATE \`max_squad_cap\` = VALUES(\`max_squad_cap\`)`,
      [gameSlug, fallbackName, 'Deportes', fallbackCap, JSON.stringify(fallbackPositions), fallbackColor]
    ).catch(() => {});

    const rows = await dbProvider.query<GameConfigurationRow>(
      `SELECT slug, name, max_squad_cap, max_transfers_per_window, post_expiration_days, positions_json, brand_color FROM games WHERE slug = ?`,
      [gameSlug]
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      let parsedPositions: string[] = fallbackPositions;
      if (row.positions_json) {
        try {
          parsedPositions = typeof row.positions_json === 'string' ? JSON.parse(row.positions_json) : row.positions_json;
        } catch {
          parsedPositions = fallbackPositions;
        }
      }

      return {
        gameSlug: row.slug,
        name: row.name || fallbackName,
        maxSquadCap: Number(row.max_squad_cap) || fallbackCap,
        maxTransfersPerWindow: Number(row.max_transfers_per_window) || 3,
        postExpirationDays: Number(row.post_expiration_days) || 7,
        positions: Array.isArray(parsedPositions) && parsedPositions.length > 0 ? parsedPositions : fallbackPositions,
        brandColor: row.brand_color || fallbackColor,
      };
    }
  } catch (err) {
    console.error('MySQL Error in getGameConfigurationService:', err);
  }

  return {
    gameSlug,
    name: fallbackName,
    maxSquadCap: fallbackCap,
    maxTransfersPerWindow: 3,
    postExpirationDays: 7,
    positions: fallbackPositions,
    brandColor: fallbackColor,
  };
}

// ── Player Contract Offers Services ───────────────────────────────────────

export async function getPlayerContractOffersService(userId: string, gameSlug: string) {
  try {
    // Check count of pending contract offers for this player
    const offers = await dbProvider.query<ContractOfferRow>(
      `SELECT o.id, o.game_slug, o.team_id, COALESCE(t.name, 'Escuadra Oficial') as team_name, COALESCE(t.tag, 'PRO') as team_tag, o.position, o.pitch_message, o.status, o.created_at
       FROM transfer_offers o
       LEFT JOIN teams t ON o.team_id = t.id
       WHERE o.player_user_id = ? AND o.game_slug = ? AND o.offer_type = 'OFERTA_CLUB' AND o.status = 'PENDIENTE'
       ORDER BY o.created_at DESC`,
      [userId, gameSlug]
    );

    return offers.map((off) => ({
      id: off.id,
      gameSlug: off.game_slug,
      teamId: off.team_id,
      teamName: off.team_name,
      teamTag: off.team_tag,
      position: off.position,
      pitchMessage: off.pitch_message || 'Propuesta de vinculación oficial para torneo',
      status: off.status,
      createdAt: off.created_at,
    }));
  } catch (err) {
    console.error('Error en getPlayerContractOffersService:', err);
    return [];
  }
}

export async function respondPlayerContractOfferService(
  offerId: string,
  userId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!accept) {
      return await dbProvider.withTransaction(async (transaction) => {
        await executeCas(transaction as any,
          "UPDATE transfer_offers SET status = 'RECHAZADO' WHERE id = ? AND player_user_id = ? AND status = 'PENDIENTE'",
          [offerId, userId],
          'Oferta no encontrada o ya procesada.',
        );
        return { success: true };
      });
    }

    return await dbProvider.withTransaction(async (transaction) => {
      const offers = await transaction.query<ContractOfferRow>(
        "SELECT * FROM transfer_offers WHERE id = ? AND player_user_id = ? AND status = 'PENDIENTE' FOR UPDATE",
        [offerId, userId],
      );
      if (offers.length === 0) return { success: false, error: 'Oferta no encontrada o ya procesada.' };
      const offer = offers[0];

      await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);

      const targetTeam = await transaction.query<{ name: string }>(
        'SELECT name FROM teams WHERE id = ? FOR UPDATE',
        [offer.team_id],
      );
      if (targetTeam.length === 0) return { success: false, error: 'Equipo no encontrado.' };

      const maxSquadSize = offer.game_slug === 'eafc26' ? 20 : 7;
      const rosterCount = await transaction.query<{ total: number }>(
        'SELECT COUNT(*) as total FROM team_members WHERE team_id = ?',
        [offer.team_id],
      );
      if ((rosterCount[0]?.total ?? 0) >= maxSquadSize) {
        return { success: false, error: `No se puede aceptar. La escuadra ya cuenta con el máximo permitido de ${maxSquadSize} jugadores.` };
      }

      const prevTeam = await transaction.query<{ id: string; name: string }>(
        'SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.user_id = ? FOR UPDATE',
        [userId],
      );
      const fromTeamId = prevTeam[0]?.id || null;
      const fromTeamName = prevTeam[0]?.name || 'Agente Libre';

      let orgName = 'Organización General';
      const organizationMatch = offer.pitch_message?.match(/\[Organización:\s*([^\]]+)\]/i);
      if (organizationMatch?.[1]) orgName = organizationMatch[1].trim();

      await executeCas(transaction as any,
        "UPDATE transfer_offers SET status = 'ACEPTADO' WHERE id = ? AND player_user_id = ? AND status = 'PENDIENTE'",
        [offerId, userId],
        'La oferta ya fue procesada por otro usuario.',
      );
      await transaction.execute(
        'DELETE FROM team_members WHERE user_id = ? AND LOWER(organization_name) = LOWER(?)',
        [userId, orgName],
      );
      await transaction.execute(
        `INSERT INTO team_members (id, team_id, user_id, organization_name, tactical_position, role_in_team)
         VALUES (?, ?, ?, ?, ?, 'Jugador')
         ON DUPLICATE KEY UPDATE tactical_position = VALUES(tactical_position)`,
        [randomUUID(), offer.team_id, userId, orgName, offer.position || 'DFC'],
      );
      await transaction.execute(
        `INSERT INTO transfer_history_logs (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LIBRE')`,
        [randomUUID(), offer.game_slug, userId, fromTeamId, fromTeamName, offer.team_id, targetTeam[0].name, userId],
      );
      await transaction.execute(
        "UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND type = 'JUGADOR_BUSCA_CLUB'",
        [userId],
      );
      await transaction.execute(
        'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
        [offer.team_id, offer.team_id],
      );
      return { success: true };
    });
  } catch (err: unknown) {
    console.error('Error al responder oferta de contrato:', err);
    return { success: false, error: getErrorMessage(err, 'Error al procesar contrato.') };
  }
}

// ── eSports Internal Chat Services ───────────────────────────────────────

export interface ChatThreadDTO {
  id: string;
  channelType: 'DIRECTO' | 'SQUAD_EQUIPO' | 'SOPORTE_ORGANIZADOR' | 'ANUNCIO_ADMIN';
  gameSlug: string;
  title: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessageDTO {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export async function getChatThreadsService(
  userId: string,
  userRole: string,
  gameSlug: string = 'eafc26',
  channelFilter: string = 'ALL'
): Promise<ChatThreadDTO[]> {
  try {
    let whereClause = `(ct.participant_a_id = ? OR ct.participant_b_id = ? OR ct.participant_b_id = 'usr-all')`;
    const queryParams: DatabaseParams = [userId, userId];

    if (gameSlug && gameSlug !== 'ALL') {
      whereClause += ` AND ct.game_slug = ?`;
      queryParams.push(gameSlug);
    }

    if (channelFilter !== 'ALL') {
      whereClause += ` AND ct.channel_type = ?`;
      queryParams.push(channelFilter);
    }

    const threads = await dbProvider.query<ChatThreadRow>(
      `SELECT ct.*, 
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.thread_id = ct.id AND cm.sender_id != ? AND cm.is_read = 0) as unread_count
       FROM chat_threads ct
       WHERE ${whereClause}
       ORDER BY ct.last_message_at DESC`,
      [userId, ...queryParams]
    );

    return threads.map((t) => {
      const isParticipantA = t.participant_a_id === userId;
      const otherId = isParticipantA ? t.participant_b_id : t.participant_a_id;
      const otherName = isParticipantA ? t.participant_b_name : t.participant_a_name;
      const otherRole = isParticipantA ? t.participant_b_role : t.participant_a_role;

      return {
        id: t.id,
        channelType: t.channel_type,
        gameSlug: t.game_slug,
        title: t.title || (otherName ? `Chat con ${otherName}` : 'Conversación Directa'),
        participantId: otherId,
        participantName: otherName || t.participant_a_name,
        participantRole: otherRole || t.participant_a_role,
        lastMessageText: t.last_message_text || 'Sin mensajes aún',
        lastMessageAt: new Date(t.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: Number(t.unread_count) || 0,
      };
    });
  } catch (err) {
    console.error('Error en getChatThreadsService:', err);
    return [];
  }
}

export async function getThreadMessagesService(threadId: string): Promise<ChatMessageDTO[]> {
  try {
    const messages = await dbProvider.query<ChatMessageRow>(
      `SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC`,
      [threadId]
    );

    return messages.map((m) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderRole: m.sender_role,
      text: m.message_text,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  } catch (error) {
    console.error('Error en getThreadMessagesService:', error);
    return [];
  }
}

export async function sendChatMessageService(
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // 0. Check if user is banned from chat or system
    const checkBan = await dbProvider.query<{ is_banned: number; ban_reason: string; status: string }>(
      `SELECT is_banned, ban_reason, status FROM users WHERE id = ?`,
      [senderId]
    );
    if (checkBan && checkBan.length > 0) {
      if (checkBan[0].status === 'Baneado' || checkBan[0].status === 'Suspendido') {
        return {
          success: false,
          error: `Tu cuenta se encuentra con estado "${checkBan[0].status}" en el sistema y no puedes enviar mensajes.`,
        };
      }
      if (checkBan[0].is_banned === 1) {
        return {
          success: false,
          error: `Has sido silenciado/baneado de la mensajería. Motivo: ${checkBan[0].ban_reason || 'Infracción de reglamento eSports.'}`,
        };
      }
    }

    const messageId = `cm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await dbProvider.query(
      `INSERT INTO chat_messages (id, thread_id, sender_id, sender_name, sender_role, message_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [messageId, threadId, senderId, senderName, senderRole, text]
    );

    await dbProvider.query(
      `UPDATE chat_threads SET last_message_text = ?, last_message_at = NOW() WHERE id = ?`,
      [text, threadId]
    );

    // Auto-clear typing status when message is sent
    await dbProvider.query(`DELETE FROM chat_typing_status WHERE thread_id = ? AND user_id = ?`, [threadId, senderId]).catch(() => {});

    return { success: true, messageId };
  } catch (err: unknown) {
    console.error('Error en sendChatMessageService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al enviar mensaje.') };
  }
}

export async function updateTypingStatusService(threadId: string, userId: string, userName: string) {
  if (!threadId || !userId) return { success: false };
  try {
    await dbProvider.query(
      `INSERT INTO chat_typing_status (thread_id, user_id, user_name, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW(), user_name = VALUES(user_name)`,
      [threadId, userId, userName || 'Usuario']
    );
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function clearTypingStatusService(threadId: string, userId: string) {
  if (!threadId || !userId) return { success: false };
  try {
    await dbProvider.query(`DELETE FROM chat_typing_status WHERE thread_id = ? AND user_id = ?`, [threadId, userId]);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getTypingUsersService(threadId: string, currentUserId: string): Promise<string[]> {
  if (!threadId || !currentUserId) return [];
  try {
    const rows = await dbProvider.query<{ user_name: string }>(
      `SELECT user_name FROM chat_typing_status 
       WHERE thread_id = ? AND user_id != ? AND updated_at >= NOW() - INTERVAL 4 SECOND`,
      [threadId, currentUserId]
    );
    return rows ? rows.map((r) => r.user_name) : [];
  } catch {
    return [];
  }
}

export async function createOrGetDirectThreadService(
  currentUserId: string,
  currentUserName: string,
  currentUserRole: string,
  targetUserId: string,
  targetUserName: string,
  targetUserRole: string,
  gameSlug: string,
  channelType: 'DIRECTO' | 'SQUAD_EQUIPO' | 'SOPORTE_ORGANIZADOR' | 'ANUNCIO_ADMIN' = 'DIRECTO',
  title?: string
) {
  try {
    // Check if thread already exists
    const existing = await dbProvider.query<{ id: string }>(
      `SELECT id FROM chat_threads 
       WHERE channel_type = ? AND game_slug = ? AND 
             ((participant_a_id = ? AND participant_b_id = ?) OR (participant_a_id = ? AND participant_b_id = ?))`,
      [channelType, gameSlug, currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (existing && existing.length > 0) {
      return { success: true, threadId: existing[0].id };
    }

    const newThreadId = `ct-${Date.now()}`;
    await dbProvider.query(
      `INSERT INTO chat_threads (id, channel_type, game_slug, title, participant_a_id, participant_a_name, participant_a_role, participant_b_id, participant_b_name, participant_b_role, last_message_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Conversación iniciada.')`,
      [
        newThreadId,
        channelType,
        gameSlug,
        title || `Chat con ${targetUserName}`,
        currentUserId,
        currentUserName,
        currentUserRole,
        targetUserId,
        targetUserName,
        targetUserRole,
      ]
    );

    return { success: true, threadId: newThreadId };
  } catch (err: unknown) {
    console.error('Error en createOrGetDirectThreadService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al crear hilo de chat.') };
  }
}

export async function getUsersByRoleService(role: string) {
  try {
    let roleQuery = `role = ?`;
    let queryParams: DatabaseParams = [role];

    if (role === 'Capitan' || role === 'Capitán') {
      roleQuery = `role IN ('Capitan', 'Capitán')`;
      queryParams = [];
    }

    const users = await dbProvider.query<UserRoleRow>(
      `SELECT id, name, gamertag, role, primary_game_slug, is_banned, ban_reason FROM users WHERE ${roleQuery} ORDER BY name ASC`,
      queryParams
    );

    if (users && users.length > 0) {
      return users.map((u) => ({
        id: u.id,
        name: u.name,
        gamertag: u.gamertag,
        role: u.role,
        gameSlug: u.primary_game_slug,
        isBanned: u.is_banned === 1,
        banReason: u.ban_reason,
      }));
    }

    return [];
  } catch (err) {
    console.error('Error en getUsersByRoleService:', err);
    return [];
  }
}

// ── Chat Ban & Sanction Services ──────────────────────────────────────────

export async function banUserFromChatService(targetUserId: string, reason?: string) {
  try {
    const reasonText = reason?.trim() || 'Sanción disciplinaria por infracción de reglamento en chat eSports.';
    await dbProvider.query(`UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?`, [reasonText, targetUserId]);
    return { success: true, message: `Usuario sancionado y baneado exitosamente.` };
  } catch (err: unknown) {
    console.error('Error en banUserFromChatService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al banear usuario.') };
  }
}

export async function unbanUserFromChatService(targetUserId: string) {
  try {
    await dbProvider.query(`UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?`, [targetUserId]);
    return { success: true, message: `Sanción levantada. El usuario puede escribir nuevamente.` };
  } catch (err: unknown) {
    console.error('Error en unbanUserFromChatService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al desbanear usuario.') };
  }
}

export async function checkUserBanStatusService(userId: string) {
  try {
    const res = await dbProvider.query<{ is_banned: number; ban_reason: string; status: string }>(
      `SELECT is_banned, ban_reason, status FROM users WHERE id = ?`,
      [userId]
    );
    if (res && res.length > 0) {
      const isSystemBanned = res[0].status === 'Baneado' || res[0].status === 'Suspendido';
      const isChatBanned = res[0].is_banned === 1;
      return {
        isBanned: isSystemBanned || isChatBanned,
        isChatBanned,
        isSystemBanned,
        status: res[0].status,
        reason: res[0].ban_reason || (isSystemBanned ? `Cuenta con estado ${res[0].status}` : null),
      };
    }
    return { isBanned: false, isChatBanned: false, isSystemBanned: false, status: 'Activo', reason: null };
  } catch (err) {
    console.error('Error en checkUserBanStatusService:', err);
    return { isBanned: false, isChatBanned: false, isSystemBanned: false, status: 'Activo', reason: null };
  }
}
