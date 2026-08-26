'use server';

import { revalidatePath } from 'next/cache';
import { queryDB } from '@/lib/db';
import { getServerUserSession, requireServerActor } from '@/lib/auth-server';
import { canManageOrganization } from '@/lib/authorization';
import { validateSchema, uuidSchema, flexDatetimeSchema } from '@/lib/validation';
import { z } from 'zod';
import { createSeasonService } from '@/lib/services';
import { seasonRepository } from '@/lib/repositories';
import { getActionErrorMessage } from '@/lib/action-utils';

export interface SeasonData {
  id: string;
  name: string;
  organization_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
}

export async function getOrganizationSeasonsAction(organizationId?: string) {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const session = await getServerUserSession();
    const targetOrgId = organizationId || session?.organizationId || null;
    if (targetOrgId && !canManageOrganization(actor, targetOrgId)) {
      return { success: false, seasons: [], error: 'No autorizado para consultar estas temporadas.', code: 'FORBIDDEN' };
    }

    let sql = `SELECT * FROM seasons`;
    const params: string[] = [];

    if (session?.role !== 'Administrador' && targetOrgId) {
      sql += ` WHERE organization_id = ? OR organization_id IS NULL`;
      params.push(targetOrgId);
    }

    sql += ` ORDER BY created_at DESC`;

    const seasons = await queryDB<SeasonData>(sql, params);
    return { success: true, seasons };
  } catch (error: unknown) {
    console.error('Error en getOrganizationSeasonsAction:', error);
    return { success: false, seasons: [], error: getActionErrorMessage(error, 'Error al cargar temporadas.'), code: 'INTERNAL_ERROR' };
  }
}

export async function createSeasonAction(
  name: string,
  organizationId?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const session = await getServerUserSession();
    const targetOrgId = organizationId || session?.organizationId || null;
    if (!targetOrgId || !canManageOrganization(actor, targetOrgId)) {
      return { success: false, error: 'No autorizado para crear temporadas en esta organización.', code: 'FORBIDDEN' };
    }

    const validation = validateSchema(
      z.object({
        name: z.string().min(3).max(100),
        organizationId: uuidSchema,
        startDate: flexDatetimeSchema,
        endDate: flexDatetimeSchema,
      }),
      { name, organizationId: targetOrgId, startDate, endDate }
    );

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const result = await createSeasonService(
      validation.data.name,
      validation.data.organizationId || undefined,
      validation.data.startDate || undefined,
      validation.data.endDate || undefined
    );

    if (result.success) {
      revalidatePath('/dashboard/competencias');
      revalidatePath('/api/organizer/seasons');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en createSeasonAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al crear la temporada.'), code: 'INTERNAL_ERROR' };
  }
}

export async function updateSeasonAction(
  id: string,
  data: Partial<SeasonData>
) {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const session = await getServerUserSession();
    const season = await seasonRepository.findById(id);
    if (!season || !season.organizationId || !canManageOrganization(actor, season.organizationId)) {
      return { success: false, error: 'No autorizado para modificar esta temporada.', code: 'FORBIDDEN' };
    }
    if (session?.role !== 'Administrador') {
      if (season && season.organizationId && session?.organizationId !== season.organizationId) {
        return { success: false, error: 'No autorizado para modificar esta temporada.', code: 'FORBIDDEN' };
      }
    }

    await seasonRepository.update(id, data);
    revalidatePath('/dashboard/competencias');
    return { success: true, message: 'Temporada actualizada.' };
  } catch (error: unknown) {
    console.error('Error en updateSeasonAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al actualizar temporada.'), code: 'INTERNAL_ERROR' };
  }
}

export async function deleteSeasonAction(id: string) {
  try {
    await requireServerActor(['Administrador']);

    await seasonRepository.delete(id);
    revalidatePath('/dashboard/competencias');
    return { success: true, message: 'Temporada eliminada.' };
  } catch (error: unknown) {
    console.error('Error en deleteSeasonAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al eliminar temporada.'), code: 'INTERNAL_ERROR' };
  }
}
