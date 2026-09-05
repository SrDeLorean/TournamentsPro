// =============================================================================
// TournamentsPro — Managed Organizations Service
// =============================================================================

import { randomUUID } from 'crypto';
import { dbProvider } from '@/lib/db/provider';

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
    const organizerIds = [...new Set(data.organizerIds || [])];
    if (organizerIds.length > 0) {
      const organizers = await Promise.all(organizerIds.map((id) => transaction.users.findById(id, { forUpdate: true })));
      if (organizers.some((u) => !u || u.role !== 'Organizador')) {
        return { success: false, error: 'Uno o más organizadores no son válidos.' };
      }
    }
    const duplicateByName = await transaction.organizations.findAll({ where: { name: data.name }, limit: 1 });
    const duplicateByTag = await transaction.organizations.findAll({ where: { tag: data.tag }, limit: 1 });
    if (duplicateByName.length > 0 || duplicateByTag.length > 0) {
      return { success: false, error: 'Ya existe una organización con ese nombre o tag.' };
    }

    const organizationId = randomUUID();
    await transaction.organizations.create({
      id: organizationId,
      name: data.name,
      tag: data.tag,
      ownerId: data.ownerId,
      allowedGames: data.allowedGames || ['eafc26', 'valorant'],
      logoUrl: data.logoUrl || '/images/default/logo-default.png',
      bannerUrl: data.bannerUrl || '/images/default/banner-default.jpg',
      country: data.country || 'Venezuela',
      status: data.status || 'Activa',
      socialMedia: data.socialMedia || {},
      createdAt: new Date().toISOString(),
    });

    for (const organizerId of organizerIds) {
      await transaction.users.update(organizerId, { organizationId });
    }
    return { success: true, organizationId };
  });
}

export async function updateManagedOrganizationService(
  organizationId: string,
  data: Partial<ManagedOrganizationInput>,
) {
  return dbProvider.withTransaction(async (transaction) => {
    const org = await transaction.organizations.findById(organizationId, { forUpdate: true });
    if (!org) return { success: false, error: 'Organización no encontrada.' };

    const organizerIds = data.organizerIds === undefined ? undefined : [...new Set(data.organizerIds)];
    if (organizerIds && organizerIds.length > 0) {
      const organizers = await Promise.all(organizerIds.map((id) => transaction.users.findById(id, { forUpdate: true })));
      if (organizers.some((u) => !u || u.role !== 'Organizador')) {
        return { success: false, error: 'Uno o más organizadores no son válidos.' };
      }
    }
    if (data.ownerId) {
      const owner = await transaction.users.findById(data.ownerId, { forUpdate: true });
      if (!owner) return { success: false, error: 'Propietario no encontrado.' };
    }

    await transaction.organizations.update(organizationId, {
      name: data.name ?? org.name,
      tag: data.tag ?? org.tag,
      ownerId: data.ownerId ?? org.ownerId,
      allowedGames: data.allowedGames ?? org.allowedGames,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : org.logoUrl,
      bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : org.bannerUrl,
      country: data.country !== undefined ? (data.country || 'Venezuela') : org.country,
      status: data.status !== undefined ? (data.status || 'Activa') : org.status,
      socialMedia: data.socialMedia !== undefined ? data.socialMedia : org.socialMedia,
    });

    if (organizerIds) {
      const existingUsers = await transaction.users.findAll({ where: { organization_id: organizationId, role: 'Organizador' } });
      for (const u of existingUsers) {
        await transaction.users.update(u.id, { organizationId: null });
      }
      for (const organizerId of organizerIds) {
        await transaction.users.update(organizerId, { organizationId });
      }
    }
    return { success: true };
  });
}

export async function archiveManagedOrganizationService(organizationId: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const org = await transaction.organizations.findById(organizationId, { forUpdate: true });
    if (!org) return { success: false, error: 'Organización no encontrada.' };

    const hasActive = await transaction.organizations.hasActiveCompetitions(organizationId);
    if (hasActive) {
      return { success: false, error: 'No se puede archivar mientras existan competencias activas asociadas.' };
    }

    const archivedTeams = await transaction.organizations.archiveOrganization(organizationId);
    return { success: true, archivedTeams };
  });
}
