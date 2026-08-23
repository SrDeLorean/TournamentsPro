// =============================================================================
// TournamentsPro — Service Layer (Business Logic)
// =============================================================================

import {
  userRepository,
  organizationRepository,
  teamRepository,
  competitionRepository,
  seasonRepository,
} from '@/lib/repositories';
import { queryDB } from '@/lib/db';
import { validateSchema, uuidSchema } from '@/lib/validation';
import { hashPassword, verifyToken, generateTokenPair, checkRateLimit, createRateLimitKey, verifyPassword } from '@/lib/auth';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { GAMES_CATALOG } from '@/lib/games-data';

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
  user?: any;
  tokenPair?: { accessToken: string; refreshToken: string };
  error?: string;
  code?: string;
}

export async function registerUserService(data: RegisterUserInput): Promise<RegisterUserResult> {
  // Rate limiting
  const rateLimit = checkRateLimit(createRateLimitKey(data.email, 'register'), 5, 60 * 60 * 1000);
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
  const existingByEmail = await userRepository.findByEmail(email);
  if (existingByEmail) {
    return { success: false, error: 'El email ya está registrado', code: 'EMAIL_EXISTS' };
  }

  const existingByGamertag = await userRepository.findByGamertag(gamertag);
  if (existingByGamertag) {
    return { success: false, error: 'El gamertag ya está en uso', code: 'GAMERTAG_EXISTS' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await userRepository.create({
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
  const tokenPair = generateTokenPair({
    userId: user.id,
    role: user.role,
    gamertag: user.gamertag,
    organizationId: user.organizationId,
  });

  return { success: true, user, tokenPair };
}

export interface LoginResult {
  success: boolean;
  user?: any;
  tokenPair?: { accessToken: string; refreshToken: string };
  error?: string;
  code?: string;
}

export async function loginUserService(emailOrGamertag: string, password: string): Promise<LoginResult> {
  // Rate limiting
  const rateLimit = checkRateLimit(createRateLimitKey(emailOrGamertag, 'login'), 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.', code: 'RATE_LIMITED' };
  }

  const user = await userRepository.findByEmailOrGamertag(emailOrGamertag);
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
  await userRepository.update(user.id, { lastLoginAt: new Date().toISOString().slice(0, 19).replace('T', ' ') });

  const tokenPair = generateTokenPair({
    userId: user.id,
    role: user.role,
    gamertag: user.gamertag,
    organizationId: user.organizationId,
  });

  return { success: true, user, tokenPair };
}

// ── Team Service ────────────────────────────────────────────────────────────

export interface CreateTeamInput {
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
}

export interface CreateTeamResult {
  success: boolean;
  team?: any;
  error?: string;
  code?: string;
}

export async function createTeamService(data: CreateTeamInput, captainId: string, captainName: string): Promise<CreateTeamResult> {
  const validation = validateSchema(
    z.object({
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
    }),
    data
  );

  if (!validation.success) {
    return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
  }

  // Check if user already owns a team in this discipline
  const existingTeams = await teamRepository.findByCaptain(captainId, validation.data.gameSlug);
  if (existingTeams.length > 0) {
    return { 
      success: false, 
      error: `Ya posees el club "${existingTeams[0].name}" en esta disciplina. Solo se permite 1 club por disciplina por usuario.`,
      code: 'DUPLICATE_TEAM'
    };
  }

  const team = await teamRepository.create({
    ...validation.data,
    captainId,
    captainName,
    membersCount: 1,
    maxMembers: 45,
    status: 'Activo',
  });

  // Add captain as team member
  await queryDB(
    `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
     VALUES (?, ?, ?, ?, 'Capitan')
     ON DUPLICATE KEY UPDATE role_in_team = 'Capitan'`,
    [`tm-${Date.now()}`, team.id, captainId, validation.data.position || 'DFC']
  );

  // Update user organization if team has one
  if (team.organizationId) {
    await queryDB(
      `UPDATE users SET organization_id = ? WHERE id = ? AND (organization_id IS NULL OR organization_id = '')`,
      [team.organizationId, captainId]
    );
  }

  return { success: true, team };
}

export async function getAvailablePlayersForSquadService(
  teamId: string,
  searchQuery?: string,
  organizerUserId?: string
): Promise<{ success: boolean; players: any[]; error?: string }> {
  try {
    // Get team info
    const team = await teamRepository.findById(teamId);
    if (!team) {
      return { success: false, players: [], error: 'Equipo no encontrado' };
    }

    // Get organizer org
    let organizerOrgId = team.organizationId;
    if (organizerUserId && !organizerOrgId) {
      const orgs = await queryDB<{ id: string }>(
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
    const params: any[] = [];

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

    const players = await queryDB(sql, params);
    return { success: true, players };
  } catch (error: any) {
    console.error('Error en getAvailablePlayersForSquadService:', error);
    return { success: false, players: [], error: error?.message || 'Error al buscar jugadores' };
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

    const squadRows = await queryDB<any>(
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
    const acceptedOffers = await queryDB<any>(
      `SELECT player_user_id, pitch_message FROM transfer_offers WHERE team_id = ? AND status = 'ACEPTADO'`,
      [teamId]
    );

    // Fetch competitions/organizations for this team
    const compOrgs = await queryDB<any>(
      `SELECT DISTINCT o.id as org_id, o.name as org_name
       FROM competition_teams ct
       JOIN competitions c ON ct.competition_id = c.id
       JOIN organizations o ON c.organization_id = o.id
       WHERE ct.team_id = ?`,
      [teamId]
    );

    // Group squadRows by user_id to prevent duplicate cards for multi-org players
    const userMap: Record<string, any> = {};
    for (const r of squadRows) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = { ...r, member_org_names: [] };
      }
      if (r.organization_name) {
        userMap[r.user_id].member_org_names.push(r.organization_name);
      }
    }
    const uniqueSquad = Object.values(userMap);

    const squadWithOrgs = uniqueSquad.map((member: any) => {
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
  } catch (error: any) {
    console.error('Error en getTeamSquadService:', error);
    return { success: false, error: error?.message || 'Error al obtener la plantilla.', code: 'INTERNAL_ERROR' };
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
  // Verify team exists
  const team = await teamRepository.findById(teamId);
  if (!team) {
    return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };
  }

  // Check if player already in a team
  const existing = await queryDB<{ id: string }>(`SELECT id FROM team_members WHERE user_id = ?`, [userId]);
  if (existing.length > 0) {
    return { success: false, error: 'El jugador ya pertenece a otra escuadra', code: 'PLAYER_IN_TEAM' };
  }

  // Get position if not provided
  let positionToUse = tacticalPosition;
  if (!positionToUse) {
    const users = await queryDB<{ position: string }>(`SELECT position FROM users WHERE id = ?`, [userId]);
    positionToUse = users[0]?.position || 'DEL';
  }

  // Add to team_members
  const memberId = `tm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await queryDB(
    `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
     VALUES (?, ?, ?, ?, ?)`,
    [memberId, teamId, userId, positionToUse, roleInTeam]
  );

  // Update user organization
  if (team.organizationId) {
    await queryDB(
      `UPDATE users SET organization_id = ? WHERE id = ? AND (organization_id IS NULL OR organization_id = '')`,
      [team.organizationId, userId]
    );
  }

  // Update members count
  await teamRepository.updateMembersCount(teamId);

  return { success: true };
}

export async function isUserTeamManagerOrCaptainService(userId: string, teamId: string): Promise<boolean> {
  if (!userId || !teamId) return false;

  try {
    // 1. Check if user is global Admin or Organizer
    const userRows = await queryDB<any>('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    if (userRows && userRows.length > 0) {
      const r = userRows[0].role;
      if (r === 'Administrador' || r === 'Organizador') return true;
    }

    // 2. Check if user is Official Captain or listed in encargados_json
    const teamRows = await queryDB<any>('SELECT captain_id, encargados_json FROM teams WHERE id = ? LIMIT 1', [teamId]);
    if (teamRows && teamRows.length > 0) {
      if (teamRows[0].captain_id === userId) return true;

      const jsonStr = teamRows[0].encargados_json;
      if (jsonStr) {
        try {
          const arr = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
          if (Array.isArray(arr) && arr.some((enc: any) => (typeof enc === 'string' ? enc === userId : enc.id === userId))) {
            return true;
          }
        } catch (e) {}
      }
    }

    // 3. Check team_members table for role 'Capitán', 'Capitan', 'Encargado', 'DT / Analyst'
    const memberRows = await queryDB<any>(
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
  if (orgName) {
    // Delete specifically for this organization
    await queryDB(`DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND LOWER(organization_name) = LOWER(?)`, [teamId, userId, orgName]);
    await queryDB(`UPDATE transfer_offers SET status = 'CONCLUIDO' WHERE team_id = ? AND player_user_id = ? AND status = 'ACEPTADO' AND LOWER(pitch_message) LIKE LOWER(?)`, [teamId, userId, `%[organización: ${orgName}]%`]);
  } else {
    // Delete completely from the team
    await queryDB(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`, [teamId, userId]);
    await queryDB(`UPDATE transfer_offers SET status = 'CONCLUIDO' WHERE team_id = ? AND player_user_id = ? AND status = 'ACEPTADO'`, [teamId, userId]);
  }
  
  await teamRepository.updateMembersCount(teamId);
  return { success: true };
}

export async function updateSquadMemberJerseyService(memberId: string, jerseyNumber: number | null) {
  if (!memberId) return { success: false, error: 'ID de miembro de plantilla requerido.' };
  try {
    await queryDB('UPDATE team_members SET jersey_number = ? WHERE id = ?', [jerseyNumber, memberId]);
    return { success: true, message: 'Dorsal asignado y actualizado exitosamente en MySQL.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar dorsal.' };
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
    const params: any[] = [];

    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      sql += ` AND (u.name LIKE ? OR u.gamertag LIKE ? OR u.position LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` GROUP BY u.id ORDER BY u.name ASC LIMIT 100`;

    const players = await queryDB(sql, params);
    return { success: true, players };
  } catch (error: any) {
    console.error('Error en getAllPlayersForContractOfferService:', error);
    return { success: false, players: [], error: error?.message || 'Error al buscar todos los jugadores' };
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

    let count = 0;
    for (const orgNameOrId of orgsToProcess) {
      const offerId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const pitchText = `[Organización: ${orgNameOrId}] ` + (data.pitchMessage || 'Oferta formal de contrato para unirse a la plantilla de la escuadra.');

      await queryDB(
        `INSERT INTO transfer_offers (id, game_slug, team_id, player_user_id, offered_by_user_id, position, pitch_message, offer_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'OFERTA_CLUB', 'PENDIENTE')`,
        [
          offerId,
          data.gameSlug || 'eafc26',
          data.teamId,
          data.playerUserId,
          data.offeredByUserId || 'usr-manager',
          data.position || 'DC',
          pitchText,
        ]
      );
      count++;
    }

    return { success: true, count, message: `Se emitieron ${count} propuesta(s) de contrato independiente(s) por Organización.` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al enviar ofertas de contrato.' };
  }
}

// ── Competition Service ─────────────────────────────────────────────────────

export interface CreateCompetitionResult {
  success: boolean;
  competition?: any;
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
    const season = await seasonRepository.create({
      name: newSeasonName.trim(),
      organizationId: organizationId || undefined,
    });
    finalSeasonId = season.id;
  }

  const competition = await competitionRepository.create({
    name,
    gameSlug,
    organizerId,
    organizerName,
    organizationId,
    seasonId: finalSeasonId,
    prizePool,
    transferMarketMode,
    modeFormat,
    status: (data as any).status || 'Inscripcion',
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
  // Get enrolled teams
  const enrolledTeams = await queryDB<any>(
    `SELECT * FROM competition_teams WHERE competition_id = ? AND status = 'CONFIRMADO'`,
    [competitionId]
  );

  if (enrolledTeams.length < 2) {
    return { success: false, error: 'Se requieren al menos 2 equipos confirmados', code: 'NOT_ENOUGH_TEAMS' };
  }

  const teams = enrolledTeams.map((t: any) => ({ id: t.team_id, name: t.team_name, tag: t.team_tag }));

  // Delete existing matches
  await queryDB(`DELETE FROM matches WHERE competition_id = ? OR tournament_id = ?`, [competitionId, competitionId]);

  const { startDate, selectedDays, selectedTimes, matchMode, format, groupCount, qualifiersPerGroup } = config;
  const totalSavedMatches = await generateMatchesForFormat(competitionId, teams, format, matchMode, startDate, selectedDays, selectedTimes, groupCount, qualifiersPerGroup);

  // Update competition status and configuration
  await competitionRepository.update(competitionId, { 
    status: 'Activo',
    format: config.format,
    matchMode: config.matchMode,
    groupCount: config.groupCount,
    qualifiersPerGroup: config.qualifiersPerGroup
  } as any);

  return { success: true, matchesCreated: totalSavedMatches };
}

async function generateMatchesForFormat(
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
    for (const node of playoffNodes) {
      let matchdayNumber = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      }
      const timing = getScheduledDateTime(matchdayNumber);
      
      await queryDB(
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
    for (const group of groups) {
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
              const homeClean = home.id.replace(/[^a-zA-Z0-9]/g, '');
              const awayClean = away.id.replace(/[^a-zA-Z0-9]/g, '');
              const matchId = `m-${compClean}-${group.groupName.replace(/\s+/g, '')}-j${matchdayNumber}-${homeClean}-vs-${awayClean}`;

              await queryDB(
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

    for (const node of playoffNodes) {
      let playoffRoundOffset = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        playoffRoundOffset = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      }
      const matchdayNumber = maxGroupMatchday + playoffRoundOffset;
      const timing = getScheduledDateTime(matchdayNumber);

      await queryDB(
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
            const homeClean = home.id.replace(/[^a-zA-Z0-9]/g, '');
            const awayClean = away.id.replace(/[^a-zA-Z0-9]/g, '');
            const matchId = `m-${compClean}-j${matchdayNumber}-${homeClean}-vs-${awayClean}`;

            await queryDB(
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

  // 1. Enforce Squad Cap (20 for EA FC 26, 7 for all other games)
  const maxSquadSize = gameSlug === 'eafc26' ? 20 : 7;
  const currentMembersCount = await queryDB<{ total: number }>(
    `SELECT COUNT(*) as total FROM team_members WHERE team_id = ?`,
    [teamId]
  );
  if (currentMembersCount.length > 0 && currentMembersCount[0].total >= maxSquadSize) {
    return {
      success: false,
      error: `El equipo ha alcanzado la capacidad máxima de plantilla (${maxSquadSize} atletas).`,
      code: 'SQUAD_FULL',
    };
  }

  // 2. Check Market Status & Competition Status
  let marketMode: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO' = 'ABIERTO';
  let isCompetitionActive = false;

  if (competitionId) {
    const comps = await queryDB<{ transfer_market_mode: string; status: string }>(
      `SELECT transfer_market_mode, status FROM competitions WHERE id = ?`,
      [competitionId]
    );
    if (comps.length > 0) {
      if (comps[0].transfer_market_mode) {
        marketMode = comps[0].transfer_market_mode as any;
      }
      if (comps[0].status === 'EN_CURSO' || comps[0].status === 'IN_PROGRESS') {
        isCompetitionActive = true;
      }
    }
  }

  if (marketMode === 'SIN_MERCADO') {
    return { success: false, error: 'Mercado de transferencias deshabilitado en esta competencia', code: 'MARKET_CLOSED' };
  }

  const appId = `tr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  // Requires Extraordinary 2-step approval if Market is Closed OR Competition is Active (En Curso)
  const isExtraordinary = marketMode === 'CERRADO' || isCompetitionActive ? 1 : 0;
  const organizerStatus = isExtraordinary ? 'PENDIENTE_ORGANIZADOR' : 'NINGUNO';

  await queryDB(
    `INSERT INTO transfer_applications (id, team_id, applicant_user_id, game_slug, position, pitch_message, application_type, status, is_extraordinary, organizer_approval_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
    [appId, teamId, userId, gameSlug, position, pitchMessage || null, type, isExtraordinary, organizerStatus]
  );

  return { success: true, applicationId: appId, isExtraordinary: Boolean(isExtraordinary) };
}

export async function approveExtraordinaryTransferService(applicationId: string, organizerUserId: string): Promise<{ success: boolean; error?: string }> {
  const apps = await queryDB<any>(`SELECT * FROM transfer_applications WHERE id = ?`, [applicationId]);
  if (!apps.length) return { success: false, error: 'Solicitud no encontrada' };

  const app = apps[0];

  // 1. Verify Squad Cap before final approval
  const maxSquadSize = app.game_slug === 'eafc26' ? 20 : 7;
  const currentMembersCount = await queryDB<{ total: number }>(
    `SELECT COUNT(*) as total FROM team_members WHERE team_id = ?`,
    [app.team_id]
  );
  if (currentMembersCount.length > 0 && currentMembersCount[0].total >= maxSquadSize) {
    return {
      success: false,
      error: `No se puede aprobar. El equipo ya alcanzó su tope máximo de ${maxSquadSize} jugadores.`,
    };
  }

  // 2. Fetch current player team name for historical log
  const prevTeams = await queryDB<{ id: string; name: string }>(
    `SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.user_id = ?`,
    [app.applicant_user_id]
  );
  const fromTeamId = prevTeams.length > 0 ? prevTeams[0].id : null;
  const fromTeamName = prevTeams.length > 0 ? prevTeams[0].name : 'Agente Libre';

  const newTeams = await queryDB<{ name: string }>(`SELECT name FROM teams WHERE id = ?`, [app.team_id]);
  const toTeamName = newTeams.length > 0 ? newTeams[0].name : 'Equipo Desconocido';

  // 3. Mark Application as Approved by Organizer
  await queryDB(
    `UPDATE transfer_applications SET status = 'ACEPTADO', organizer_approval_status = 'APROBADO_ORGANIZADOR', processed_by = ?, processed_at = NOW() WHERE id = ?`,
    [organizerUserId, applicationId]
  );

  // 4. Add to Team Members Roster
  const memberId = `tm-${Date.now()}`;
  await queryDB(
    `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
     VALUES (?, ?, ?, ?, 'Jugador')
     ON DUPLICATE KEY UPDATE tactical_position = ?`,
    [memberId, app.team_id, app.applicant_user_id, app.position, app.position]
  );

  // 6. Record Audit Log in transfer_history_logs
  const logId = `thl-${Date.now()}`;
  await queryDB(
    `INSERT INTO transfer_history_logs (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EXTRAORDINARIO')`,
    [logId, app.game_slug, app.applicant_user_id, fromTeamId, fromTeamName, app.team_id, toTeamName, organizerUserId]
  );

  // 7. Auto-complete player's free agent posts as completed
  await queryDB(
    `UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND type = 'JUGADOR_BUSCA_CLUB'`,
    [app.applicant_user_id]
  );

  return { success: true };
}

export async function rejectExtraordinaryTransferService(applicationId: string, organizerUserId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  await queryDB(
    `UPDATE transfer_applications SET status = 'RECHAZADO', organizer_approval_status = 'RECHAZADO_ORGANIZADOR', processed_by = ?, processed_at = NOW() WHERE id = ?`,
    [organizerUserId, applicationId]
  );
  return { success: true };
}

export async function getAthleteTransferHistoryService(userId: string, organizationId?: string): Promise<AthleteTransferHistoryResult> {
  const params: any[] = [userId];
  let orgWhere = '';
  if (organizationId) {
    orgWhere = ' AND (organization_id = ? OR organization_id IS NULL)';
    params.push(organizationId);
  }

  const logs = await queryDB<any>(
    `SELECT id, game_slug, from_team_name, to_team_name, signed_at, transfer_type 
     FROM transfer_history_logs 
     WHERE player_user_id = ? ${orgWhere}
     ORDER BY signed_at DESC 
     LIMIT 10`,
    params
  );

  const countRes = await queryDB<any>(
    `SELECT COUNT(*) as total FROM transfer_history_logs WHERE player_user_id = ? ${orgWhere}`,
    params
  );

  const totalMovements = countRes[0]?.total || logs.length;

  return {
    userId,
    totalMovements,
    recentTransfers: logs.map((l: any) => ({
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

  const postId = `tmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // 0. Auto-ensure table exists
    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`transfer_market_posts\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`game_slug\` VARCHAR(50) NOT NULL,
        \`type\` ENUM('JUGADOR_BUSCA_CLUB', 'CLUB_RECLUTA_JUGADOR') NOT NULL DEFAULT 'JUGADOR_BUSCA_CLUB',
        \`user_id\` VARCHAR(36) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`user_gamertag\` VARCHAR(50) NOT NULL,
        \`team_id\` VARCHAR(36) NULL,
        \`team_name\` VARCHAR(100) NULL,
        \`position\` VARCHAR(50) NOT NULL,
        \`platform\` VARCHAR(30) NOT NULL DEFAULT 'CROSSPLAY',
        \`status\` ENUM('ACTIVO', 'COMPLETADO', 'CADUCADO') NOT NULL DEFAULT 'ACTIVO',
        \`message\` TEXT NOT NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure user exists in users table so foreign key constraint passes
    if (userId) {
      const sanitizedEmail = `${userId.replace(/[^a-zA-Z0-9]/g, '')}@tournamentspro.esports`;
      await queryDB(
        `INSERT INTO users (id, name, gamertag, email, role) VALUES (?, ?, ?, ?, 'Jugador')
         ON DUPLICATE KEY UPDATE name = VALUES(name), gamertag = VALUES(gamertag)`,
        [userId, userName || 'Atleta Oficial', userGamertag || 'Gamertag', sanitizedEmail]
      ).catch((e) => console.log('Notice on user upsert:', e.message));
    }

    // 1. Auto-expire previous active post by the same user/team to prevent duplicates
    if (type === 'JUGADOR_BUSCA_CLUB') {
      await queryDB(
        `UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE user_id = ? AND game_slug = ? AND type = 'JUGADOR_BUSCA_CLUB' AND status = 'ACTIVO'`,
        [userId, gameSlug]
      );
    } else if (teamId) {
      await queryDB(
        `UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE team_id = ? AND game_slug = ? AND type = 'CLUB_RECLUTA_JUGADOR' AND position = ? AND status = 'ACTIVO'`,
        [teamId, gameSlug, position]
      );
    }

    // 2. Set 7 days expiration rule & insert new active post
    await queryDB(
      `INSERT INTO transfer_market_posts (id, game_slug, type, user_id, user_name, user_gamertag, team_id, team_name, position, platform, status, message, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [postId, gameSlug, type, userId, userName, userGamertag, teamId || null, teamName || null, position, platform, message]
    );

    return { success: true, postId };
  } catch (err: any) {
    console.error('Error al crear publicación en BD:', err);
    return { success: false, error: err.message || 'Error en BD' };
  }
}

export async function getTransferPostsService(
  gameSlug: string,
  timeFilter: 'TODAY' | '3_DAYS' | '7_DAYS' | 'ALL' = 'ALL'
) {
  try {
    // 0. Auto-ensure table exists
    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`transfer_market_posts\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`game_slug\` VARCHAR(50) NOT NULL,
        \`type\` ENUM('JUGADOR_BUSCA_CLUB', 'CLUB_RECLUTA_JUGADOR') NOT NULL DEFAULT 'JUGADOR_BUSCA_CLUB',
        \`user_id\` VARCHAR(36) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`user_gamertag\` VARCHAR(50) NOT NULL,
        \`team_id\` VARCHAR(36) NULL,
        \`team_name\` VARCHAR(100) NULL,
        \`position\` VARCHAR(50) NOT NULL,
        \`platform\` VARCHAR(30) NOT NULL DEFAULT 'CROSSPLAY',
        \`status\` ENUM('ACTIVO', 'COMPLETADO', 'CADUCADO') NOT NULL DEFAULT 'ACTIVO',
        \`message\` TEXT NOT NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 1. Auto-expire old posts older than 7 days
    await queryDB(
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

    const posts = await queryDB<any>(
      `SELECT id, game_slug, type, user_id, user_name, user_gamertag, team_id, team_name, position, platform, status, message, expires_at, created_at
       FROM transfer_market_posts
       WHERE game_slug = ? AND status = 'ACTIVO' ${timeClause}
       ORDER BY created_at DESC`,
      [gameSlug]
    );

    return posts.map((p: any) => ({
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
    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`transfer_history_logs\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`game_slug\` VARCHAR(50) NOT NULL,
        \`organization_id\` VARCHAR(36) NULL,
        \`player_user_id\` VARCHAR(36) NOT NULL,
        \`from_team_id\` VARCHAR(36) NULL,
        \`from_team_name\` VARCHAR(100) NULL,
        \`to_team_id\` VARCHAR(36) NOT NULL,
        \`to_team_name\` VARCHAR(100) NOT NULL,
        \`approved_by_user_id\` VARCHAR(36) NOT NULL,
        \`transfer_type\` ENUM('LIBRE', 'TRASPASO_DIRECTO', 'EXTRAORDINARIO') NOT NULL DEFAULT 'LIBRE',
        \`signed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const logs = await queryDB<any>(
      `SELECT thl.id, thl.game_slug, thl.player_user_id, COALESCE(u.name, 'Atleta Oficial') as player_name, COALESCE(u.gamertag, 'Atleta') as player_gamertag, 
              thl.from_team_name, thl.to_team_name, thl.transfer_type, thl.signed_at
       FROM transfer_history_logs thl
       LEFT JOIN users u ON thl.player_user_id = u.id
       WHERE thl.game_slug = ?
       ORDER BY thl.signed_at DESC
       LIMIT 50`,
      [gameSlug]
    );

    return logs.map((l: any) => ({
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

  await queryDB(
    `INSERT INTO match_reports (id, match_id, reported_by_user_id, score_home, score_away, proof_url, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
    [reportId, matchId, reportedByUserId, scoreHome, scoreAway, proofUrl || null]
  );

  await queryDB(
    `UPDATE matches 
     SET reported_score_home = ?, reported_score_away = ?, proof_url = ?, reported_by_user_id = ?, status = 'POR_REVISAR'
     WHERE id = ?`,
    [scoreHome, scoreAway, proofUrl || null, reportedByUserId, matchId]
  );

  if (playerStats && playerStats.length > 0) {
    for (const stat of playerStats) {
      const statId = `stat-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await queryDB(
        `INSERT INTO match_player_stats 
           (id, match_id, team_id, user_id, goals, assists, yellow_cards, red_cards, rating, is_mvp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           goals = VALUES(goals), assists = VALUES(assists), yellow_cards = VALUES(yellow_cards), 
           red_cards = VALUES(red_cards), rating = VALUES(rating), is_mvp = VALUES(is_mvp)`,
        [
          statId, matchId, stat.teamId, stat.userId,
          stat.goals || 0, stat.assists || 0, stat.yellowCards || 0, stat.redCards || 0,
          stat.rating || 6.0, stat.isMvp ? 1 : 0
        ]
      );
    }
  }

  return { success: true, reportId };
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

    const season = await seasonRepository.create({
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
  } catch (error: any) {
    console.error('Error en createSeasonService:', error);
    return { success: false, error: error?.message || 'Error al crear la temporada.', code: 'INTERNAL_ERROR' };
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
    const roster = await queryDB<{
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
  } catch (error: any) {
    console.error('Error en getTeamRosterForMatchReportService:', error);
    return { success: false, roster: [], error: error?.message || 'Error al cargar plantilla.', code: 'INTERNAL_ERROR' };
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
    // 0. Auto-ensure configuration columns exist on games table in MySQL
    await queryDB(`
      ALTER TABLE \`games\` 
      ADD COLUMN IF NOT EXISTS \`max_squad_cap\` INT NOT NULL DEFAULT 20,
      ADD COLUMN IF NOT EXISTS \`max_transfers_per_window\` INT NOT NULL DEFAULT 3,
      ADD COLUMN IF NOT EXISTS \`post_expiration_days\` INT NOT NULL DEFAULT 7,
      ADD COLUMN IF NOT EXISTS \`positions_json\` JSON NULL;
    `).catch(() => {});

    // Ensure game row is seeded in games table with dynamic config
    await queryDB(
      `INSERT INTO \`games\` (\`slug\`, \`name\`, \`category\`, \`team_size\`, \`max_roster_members\`, \`max_squad_cap\`, \`max_transfers_per_window\`, \`post_expiration_days\`, \`positions_json\`, \`brand_color\`)
       VALUES (?, ?, ?, 11, 45, ?, 3, 7, ?, ?)
       ON DUPLICATE KEY UPDATE \`max_squad_cap\` = VALUES(\`max_squad_cap\`)`,
      [gameSlug, fallbackName, 'Deportes', fallbackCap, JSON.stringify(fallbackPositions), fallbackColor]
    ).catch(() => {});

    const rows = await queryDB<any>(
      `SELECT slug, name, max_squad_cap, max_transfers_per_window, post_expiration_days, positions_json, brand_color FROM games WHERE slug = ?`,
      [gameSlug]
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      let parsedPositions: string[] = fallbackPositions;
      if (row.positions_json) {
        try {
          parsedPositions = typeof row.positions_json === 'string' ? JSON.parse(row.positions_json) : row.positions_json;
        } catch (e) {
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
    // 0. Auto-ensure transfer_offers table exists
    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`transfer_offers\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`game_slug\` VARCHAR(50) NOT NULL,
        \`team_id\` VARCHAR(36) NOT NULL,
        \`player_user_id\` VARCHAR(36) NOT NULL,
        \`offered_by_user_id\` VARCHAR(36) NOT NULL,
        \`position\` VARCHAR(50) NOT NULL,
        \`pitch_message\` TEXT NULL,
        \`offer_type\` ENUM('OFERTA_CLUB', 'POSTULACION_JUGADOR') NOT NULL DEFAULT 'OFERTA_CLUB',
        \`status\` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO') NOT NULL DEFAULT 'PENDIENTE',
        \`is_extraordinary\` TINYINT(1) NOT NULL DEFAULT 0,
        \`organizer_approval_status\` ENUM('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR') NOT NULL DEFAULT 'NINGUNO',
        \`rejection_reason\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check count of pending contract offers for this player
    const offers = await queryDB<any>(
      `SELECT o.id, o.game_slug, o.team_id, COALESCE(t.name, 'Escuadra Oficial') as team_name, COALESCE(t.tag, 'PRO') as team_tag, o.position, o.pitch_message, o.status, o.created_at
       FROM transfer_offers o
       LEFT JOIN teams t ON o.team_id = t.id
       WHERE o.player_user_id = ? AND o.game_slug = ? AND o.offer_type = 'OFERTA_CLUB' AND o.status = 'PENDIENTE'
       ORDER BY o.created_at DESC`,
      [userId, gameSlug]
    );

    return offers.map((off: any) => ({
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
      await queryDB(`UPDATE transfer_offers SET status = 'RECHAZADO' WHERE id = ? AND player_user_id = ?`, [offerId, userId]);
      return { success: true };
    }

    // Get offer details
    const offers = await queryDB<any>(`SELECT * FROM transfer_offers WHERE id = ? AND player_user_id = ?`, [offerId, userId]);
    if (!offers || offers.length === 0) {
      return { success: false, error: 'Oferta no encontrada o ya procesada.' };
    }
    const offer = offers[0];

    // 1. Squad Cap Check (20 for FC26, 7 for others)
    const maxSquadSize = offer.game_slug === 'eafc26' ? 20 : 7;
    const rosterCount = await queryDB<{ total: number }>(`SELECT COUNT(*) as total FROM team_members WHERE team_id = ?`, [offer.team_id]);
    if (rosterCount && rosterCount[0]?.total >= maxSquadSize) {
      return { success: false, error: `No se puede aceptar. La escuadra ya cuenta con el máximo permitido de ${maxSquadSize} jugadores.` };
    }

    // 2. Fetch previous team name
    const prevTeam = await queryDB<{ id: string; name: string }>(`SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.user_id = ?`, [userId]);
    const fromTeamId = prevTeam[0]?.id || null;
    const fromTeamName = prevTeam[0]?.name || 'Agente Libre';

    const targetTeam = await queryDB<{ name: string }>(`SELECT name FROM teams WHERE id = ?`, [offer.team_id]);
    const toTeamName = targetTeam[0]?.name || 'Escuadra Oficial';

    // 3. Mark offer as ACEPTADO
    await queryDB(`UPDATE transfer_offers SET status = 'ACEPTADO' WHERE id = ?`, [offerId]);

    // Extract organization_name from offer's pitch_message
    let orgName = 'Organización General';
    if (offer.pitch_message) {
      const match = offer.pitch_message.match(/\[Organización:\s*([^\]]+)\]/i);
      if (match && match[1]) {
        orgName = match[1].trim();
      }
    }

    // Delete existing team_members entry for this user in this exact Organization (1 Player, 1 Organization, 1 Team rule)
    if (orgName) {
      await queryDB(
        `DELETE FROM team_members WHERE user_id = ? AND LOWER(organization_name) = LOWER(?)`,
        [userId, orgName]
      ).catch(() => {});
    }

    // 5. Add to team_members for this Organization
    const memberId = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await queryDB(
      `INSERT INTO team_members (id, team_id, user_id, organization_name, tactical_position, role_in_team)
       VALUES (?, ?, ?, ?, ?, 'Jugador')
       ON DUPLICATE KEY UPDATE tactical_position = VALUES(tactical_position)`,
      [memberId, offer.team_id, userId, orgName, offer.position || 'DFC']
    );

    // 6. Log audit entry in transfer_history_logs
    const logId = `thl-${Date.now()}`;
    await queryDB(
      `INSERT INTO transfer_history_logs (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LIBRE')`,
      [logId, offer.game_slug, userId, fromTeamId, fromTeamName, offer.team_id, toTeamName, userId]
    );

    // 7. Auto-complete player's free agent posts
    await queryDB(`UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND type = 'JUGADOR_BUSCA_CLUB'`, [userId]);

    return { success: true };
  } catch (err: any) {
    console.error('Error al responder oferta de contrato:', err);
    return { success: false, error: err.message || 'Error al procesar contrato.' };
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

export async function autoEnsureChatTablesService() {
  try {
    try {
      await queryDB(`ALTER TABLE \`users\` MODIFY COLUMN \`status\` VARCHAR(50) NOT NULL DEFAULT 'Activo';`);
    } catch (_err) {
      // Column is already compatible
    }

    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`chat_threads\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`channel_type\` ENUM('DIRECTO', 'SQUAD_EQUIPO', 'SOPORTE_ORGANIZADOR', 'ANUNCIO_ADMIN') NOT NULL DEFAULT 'DIRECTO',
        \`game_slug\` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
        \`title\` VARCHAR(150) NULL,
        \`participant_a_id\` VARCHAR(36) NOT NULL,
        \`participant_a_name\` VARCHAR(100) NOT NULL,
        \`participant_a_role\` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
        \`participant_b_id\` VARCHAR(36) NOT NULL,
        \`participant_b_name\` VARCHAR(100) NOT NULL,
        \`participant_b_role\` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
        \`last_message_text\` TEXT NULL,
        \`last_message_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`chat_messages\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`thread_id\` VARCHAR(36) NOT NULL,
        \`sender_id\` VARCHAR(36) NOT NULL,
        \`sender_name\` VARCHAR(100) NOT NULL,
        \`sender_role\` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
        \`message_text\` TEXT NOT NULL,
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryDB(`
      CREATE TABLE IF NOT EXISTS \`chat_typing_status\` (
        \`thread_id\` VARCHAR(64) NOT NULL,
        \`user_id\` VARCHAR(36) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`thread_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure default official channels exist
    const countThreads = await queryDB<{ total: number }>(`SELECT COUNT(*) as total FROM chat_threads`);
    if (!countThreads || countThreads[0]?.total === 0) {
      await queryDB(`
        INSERT INTO chat_threads (id, channel_type, game_slug, title, participant_a_id, participant_a_name, participant_a_role, participant_b_id, participant_b_name, participant_b_role, last_message_text)
        VALUES 
        ('ct-org-support', 'SOPORTE_ORGANIZADOR', 'eafc26', 'Canal Oficial de Organizadores & Arbitraje', 'usr-organizer', 'Organizador Oficial', 'Organizador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Mesa de ayuda directa habilitada para consultas de torneo y reporte de partidos.'),
        ('ct-admin-broadcast', 'ANUNCIO_ADMIN', 'eafc26', 'Anuncios Globales de Administración', 'usr-admin', 'Administrador Principal', 'Administrador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Canal oficial de boletines, comunicados de sanciones y actualizaciones del sistema.')
      `);

      await queryDB(`
        INSERT INTO chat_messages (id, thread_id, sender_id, sender_name, sender_role, message_text)
        VALUES
        ('cm-org-1', 'ct-org-support', 'usr-organizer', 'Organizador Oficial', 'Organizador', 'Bienvenidos al canal de arbitraje y soporte técnico. Escribe tu consulta o disputa de partido aquí.'),
        ('cm-adm-1', 'ct-admin-broadcast', 'usr-admin', 'Administrador Principal', 'Administrador', 'Comunidad TournamentsPro: El mercado de traspasos eSports y reglamentos de temporada están activos.')
      `);
    }
  } catch (err) {
    console.error('Error en autoEnsureChatTablesService:', err);
  }
}

export async function getChatThreadsService(
  userId: string,
  userRole: string,
  gameSlug: string = 'eafc26',
  channelFilter: string = 'ALL'
): Promise<ChatThreadDTO[]> {
  await autoEnsureChatTablesService();

  try {
    let whereClause = `(ct.participant_a_id = ? OR ct.participant_b_id = ? OR ct.participant_b_id = 'usr-all')`;
    const queryParams: any[] = [userId, userId];

    if (gameSlug && gameSlug !== 'ALL') {
      whereClause += ` AND ct.game_slug = ?`;
      queryParams.push(gameSlug);
    }

    if (channelFilter !== 'ALL') {
      whereClause += ` AND ct.channel_type = ?`;
      queryParams.push(channelFilter);
    }

    const threads = await queryDB<any>(
      `SELECT ct.*, 
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.thread_id = ct.id AND cm.sender_id != ? AND cm.is_read = 0) as unread_count
       FROM chat_threads ct
       WHERE ${whereClause}
       ORDER BY ct.last_message_at DESC`,
      [userId, ...queryParams]
    );

    return threads.map((t: any) => {
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
    const messages = await queryDB<any>(
      `SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC`,
      [threadId]
    );

    return messages.map((m: any) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderRole: m.sender_role,
      text: m.message_text,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  } catch (err) {
    console.error('Error en getThreadMessagesService:', err);
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
    const checkBan = await queryDB<{ is_banned: number; ban_reason: string; status: string }>(
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

    await queryDB(
      `INSERT INTO chat_messages (id, thread_id, sender_id, sender_name, sender_role, message_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [messageId, threadId, senderId, senderName, senderRole, text]
    );

    await queryDB(
      `UPDATE chat_threads SET last_message_text = ?, last_message_at = NOW() WHERE id = ?`,
      [text, threadId]
    );

    // Auto-clear typing status when message is sent
    await queryDB(`DELETE FROM chat_typing_status WHERE thread_id = ? AND user_id = ?`, [threadId, senderId]).catch(() => {});

    return { success: true, messageId };
  } catch (err: any) {
    console.error('Error en sendChatMessageService:', err);
    return { success: false, error: err.message || 'Error al enviar mensaje.' };
  }
}

export async function updateTypingStatusService(threadId: string, userId: string, userName: string) {
  if (!threadId || !userId) return { success: false };
  try {
    await queryDB(
      `INSERT INTO chat_typing_status (thread_id, user_id, user_name, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW(), user_name = VALUES(user_name)`,
      [threadId, userId, userName || 'Usuario']
    );
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function clearTypingStatusService(threadId: string, userId: string) {
  if (!threadId || !userId) return { success: false };
  try {
    await queryDB(`DELETE FROM chat_typing_status WHERE thread_id = ? AND user_id = ?`, [threadId, userId]);
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function getTypingUsersService(threadId: string, currentUserId: string): Promise<string[]> {
  if (!threadId || !currentUserId) return [];
  try {
    const rows = await queryDB<{ user_name: string }>(
      `SELECT user_name FROM chat_typing_status 
       WHERE thread_id = ? AND user_id != ? AND updated_at >= NOW() - INTERVAL 4 SECOND`,
      [threadId, currentUserId]
    );
    return rows ? rows.map((r) => r.user_name) : [];
  } catch (err) {
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
  await autoEnsureChatTablesService();

  try {
    // Check if thread already exists
    const existing = await queryDB<any>(
      `SELECT id FROM chat_threads 
       WHERE channel_type = ? AND game_slug = ? AND 
             ((participant_a_id = ? AND participant_b_id = ?) OR (participant_a_id = ? AND participant_b_id = ?))`,
      [channelType, gameSlug, currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (existing && existing.length > 0) {
      return { success: true, threadId: existing[0].id };
    }

    const newThreadId = `ct-${Date.now()}`;
    await queryDB(
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
  } catch (err: any) {
    console.error('Error en createOrGetDirectThreadService:', err);
    return { success: false, error: err.message || 'Error al crear hilo de chat.' };
  }
}

export async function getUsersByRoleService(role: string) {
  try {
    let roleQuery = `role = ?`;
    let queryParams: any[] = [role];

    if (role === 'Capitan' || role === 'Capitán') {
      roleQuery = `role IN ('Capitan', 'Capitán')`;
      queryParams = [];
    }

    const users = await queryDB<any>(
      `SELECT id, name, gamertag, role, primary_game_slug, is_banned, ban_reason FROM users WHERE ${roleQuery} ORDER BY name ASC`,
      queryParams
    );

    if (users && users.length > 0) {
      return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        gamertag: u.gamertag,
        role: u.role,
        gameSlug: u.primary_game_slug,
        isBanned: u.is_banned === 1,
        banReason: u.ban_reason,
      }));
    }

    // Fallback defaults if no user of that role exists yet in BD
    if (role === 'Organizador') {
      return [{ id: 'usr-organizer', name: 'Organizador Oficial', gamertag: 'Organizador_Pro', role: 'Organizador', isBanned: false }];
    }
    if (role === 'Administrador') {
      return [{ id: 'usr-admin', name: 'Administrador Principal', gamertag: 'Admin_Pro', role: 'Administrador', isBanned: false }];
    }
    if (role === 'Capitan' || role === 'Capitán') {
      return [{ id: 'usr-capitan-1', name: 'Capitán Sangre Nueva', gamertag: 'Capitan_SN', role: 'Capitán', isBanned: false }];
    }
    return [{ id: 'usr-player-1', name: 'Atleta Libre', gamertag: 'Player_Pro', role: 'Jugador', isBanned: false }];
  } catch (err) {
    console.error('Error en getUsersByRoleService:', err);
    return [];
  }
}

// ── Chat Ban & Sanction Services ──────────────────────────────────────────

export async function banUserFromChatService(targetUserId: string, reason?: string) {
  try {
    const reasonText = reason?.trim() || 'Sanción disciplinaria por infracción de reglamento en chat eSports.';
    await queryDB(`UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?`, [reasonText, targetUserId]);
    return { success: true, message: `Usuario sancionado y baneado exitosamente.` };
  } catch (err: any) {
    console.error('Error en banUserFromChatService:', err);
    return { success: false, error: err.message || 'Error al banear usuario.' };
  }
}

export async function unbanUserFromChatService(targetUserId: string) {
  try {
    await queryDB(`UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?`, [targetUserId]);
    return { success: true, message: `Sanción levantada. El usuario puede escribir nuevamente.` };
  } catch (err: any) {
    console.error('Error en unbanUserFromChatService:', err);
    return { success: false, error: err.message || 'Error al desbanear usuario.' };
  }
}

export async function checkUserBanStatusService(userId: string) {
  try {
    const res = await queryDB<{ is_banned: number; ban_reason: string; status: string }>(
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