// =============================================================================
// TournamentsPro — Teams & Club Management Service
// =============================================================================

import { randomUUID } from 'crypto';
import type { Team } from '@/lib/db/interfaces';
import { dbProvider } from '@/lib/db/provider';
import { validateSchema, uuidSchema } from '@/lib/validation';
import { isManagerEntry } from './types';
import { z } from 'zod';

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
    const captain = await transaction.users.findById(captainId, { forUpdate: true });
    if (!captain) return { success: false, error: 'Capitán no encontrado', code: 'CAPTAIN_NOT_FOUND' };

    if (validation.data.organizationId) {
      const org = await transaction.organizations.findById(validation.data.organizationId, { forUpdate: true });
      if (!org) return { success: false, error: 'Organización no encontrada', code: 'ORG_NOT_FOUND' };
    }

    const managerIds = [...new Set(validation.data.managerIds || [])].filter((userId) => userId !== captainId);
    if (managerIds.length > 0) {
      const managers = await Promise.all(managerIds.map((id) => transaction.users.findById(id, { forUpdate: true })));
      if (managers.some((m) => !m)) {
        return { success: false, error: 'Uno o más encargados no existen.', code: 'MANAGER_NOT_FOUND' };
      }
    }

    const existingTeams = await transaction.teams.findByCaptain(captainId, validation.data.gameSlug);
    if (existingTeams.length > 0) {
      return {
        success: false,
        error: `Ya posees el club "${existingTeams[0].name}" en esta disciplina. Solo se permite 1 club por disciplina por usuario.`,
        code: 'DUPLICATE_TEAM',
      };
    }

    const teamId = validation.data.id || randomUUID();
    const createdTeam = await transaction.teams.create({
      id: teamId,
      name: validation.data.name,
      tag: validation.data.tag,
      gameSlug: validation.data.gameSlug,
      organizationId: validation.data.organizationId || null,
      captainId,
      captainName,
      platform: validation.data.platform,
      membersCount: 1,
      maxMembers: 45,
      color: validation.data.color,
      logoText: validation.data.logoText,
      description: validation.data.description || null,
      vacantPositions: validation.data.vacantPositions || [],
      status: validation.data.status || 'Activo',
      clubIdEa: validation.data.clubIdEa || null,
      logoUrl: validation.data.logoUrl || null,
      bannerUrl: validation.data.bannerUrl || null,
    });

    await transaction.teams.syncStaff(teamId, captainId, managerIds, validation.data.position || 'DFC');

    if (validation.data.organizationId && !captain.organizationId) {
      await transaction.users.update(captainId, { organizationId: validation.data.organizationId });
    }

    return {
      success: true,
      team: { ...createdTeam, id: teamId, ...validation.data, captainId, captainName, membersCount: 1, maxMembers: 45 },
    };
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
    const existingTeam = await transaction.teams.findById(teamId, { forUpdate: true });
    if (!existingTeam) return { success: false, error: 'Equipo no encontrado.' };

    const captainId = data.captainId || existingTeam.captainId;
    const staffIds = [...new Set([captainId, ...(data.managerIds || [])])];
    const staffUsers = await Promise.all(staffIds.map((id) => transaction.users.findById(id, { forUpdate: true })));
    if (staffUsers.some((u) => !u)) return { success: false, error: 'Uno o más responsables no existen.' };

    if (data.organizationId) {
      const org = await transaction.organizations.findById(data.organizationId, { forUpdate: true });
      if (!org) return { success: false, error: 'Organización no encontrada.' };
    }

    const updated = await transaction.teams.update(teamId, {
      name: data.name ?? existingTeam.name,
      tag: data.tag ?? existingTeam.tag,
      gameSlug: data.gameSlug ?? existingTeam.gameSlug,
      organizationId: data.organizationId !== undefined ? data.organizationId : existingTeam.organizationId,
      captainId,
      captainName: data.captainName ?? existingTeam.captainName,
      platform: data.platform ?? existingTeam.platform,
      color: data.color ?? existingTeam.color,
      logoText: data.logoText ?? existingTeam.logoText,
      description: data.description !== undefined ? data.description : existingTeam.description,
      status: data.status ?? existingTeam.status,
      clubIdEa: data.clubIdEa !== undefined ? data.clubIdEa : existingTeam.clubIdEa,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : existingTeam.logoUrl,
      bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : existingTeam.bannerUrl,
    });

    if (!updated) {
      return { success: false, error: 'Error actualizando equipo' };
    }

    if (data.captainId || data.managerIds !== undefined) {
      await transaction.teams.syncStaff(teamId, captainId, data.managerIds || []);
    }

    return { success: true };
  });
}

export async function archiveManagedTeamService(teamId: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const team = await transaction.teams.findById(teamId, { forUpdate: true });
    if (!team) return { success: false, error: 'Equipo no encontrado.' };

    const hasActive = await transaction.teams.hasActiveCompetitions(teamId);
    if (hasActive) {
      return { success: false, error: 'No se puede archivar un equipo inscrito en una competencia activa.' };
    }

    await transaction.teams.archiveTeam(teamId);
    return { success: true };
  });
}

export async function isUserTeamManagerOrCaptainService(userId: string, teamId: string): Promise<boolean> {
  if (!userId || !teamId) return false;

  try {
    const user = await dbProvider.users.findById(userId);
    if (user) {
      if (user.role === 'Administrador') return true;
      if (user.role === 'Organizador') {
        if (!user.organizationId) return false;
        const team = await dbProvider.teams.findById(teamId);
        if (team?.organizationId === user.organizationId) return true;

        const compOrgs = await dbProvider.teams.getTeamCompetitionOrganizations(teamId);
        if (compOrgs.some((co) => co.org_id === user.organizationId)) return true;

        return false;
      }
    }

    const team = await dbProvider.teams.findById(teamId);
    if (team) {
      if (team.captainId === userId) return true;
      const encargadosJson = (team as Team & { encargados_json?: unknown }).encargados_json;
      if (encargadosJson) {
        try {
          const arr = typeof encargadosJson === 'string' ? JSON.parse(encargadosJson) : encargadosJson;
          if (Array.isArray(arr) && arr.some((enc: unknown) => (typeof enc === 'string' ? enc === userId : isManagerEntry(enc) && enc.id === userId))) {
            return true;
          }
        } catch {}
      }
    }

    return await dbProvider.teams.isMemberOrManager(teamId, userId);
  } catch (err) {
    console.error('Error en isUserTeamManagerOrCaptainService:', err);
    return false;
  }
}
