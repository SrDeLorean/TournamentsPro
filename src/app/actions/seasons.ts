'use server';

import { revalidatePath } from 'next/cache';
import { dbProvider } from '@/lib/db/provider';
import { getServerUserSession, requireServerActor } from '@/lib/auth-server';
import { canManageOrganization } from '@/lib/authorization';
import { validateSchema, uuidSchema, flexDatetimeSchema } from '@/lib/validation';
import { z } from 'zod';
import { createSeasonService } from '@/lib/services';
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

    let seasons = [];
    if (session?.role !== 'Administrador' && targetOrgId) {
      seasons = await dbProvider.seasons.findByOrganization(targetOrgId);
    } else {
      seasons = await dbProvider.seasons.findAll({ orderBy: 'created_at', orderDirection: 'DESC' });
    }

    // Map to SeasonData format for backwards compatibility
    const mappedSeasons: SeasonData[] = seasons.map(s => ({
      id: s.id,
      name: s.name,
      organization_id: s.organizationId,
      start_date: s.startDate,
      end_date: s.endDate,
      status: s.status,
      created_at: s.createdAt,
    }));

    return { success: true, seasons: mappedSeasons };
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
    const season = await dbProvider.seasons.findById(id);
    if (!season || !season.organizationId || !canManageOrganization(actor, season.organizationId)) {
      return { success: false, error: 'No autorizado para modificar esta temporada.', code: 'FORBIDDEN' };
    }
    if (session?.role !== 'Administrador') {
      if (season && season.organizationId && session?.organizationId !== season.organizationId) {
        return { success: false, error: 'No autorizado para modificar esta temporada.', code: 'FORBIDDEN' };
      }
    }

    await dbProvider.seasons.update(id, data);
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

    await dbProvider.seasons.delete(id);
    revalidatePath('/dashboard/competencias');
    return { success: true, message: 'Temporada eliminada.' };
  } catch (error: unknown) {
    console.error('Error en deleteSeasonAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al eliminar temporada.'), code: 'INTERNAL_ERROR' };
  }
}
