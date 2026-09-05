'use server';

import { dbProvider } from '@/lib/db/provider';
import type { Organization } from '@/lib/db/interfaces';

export interface OrgWithStats extends Organization {
  comp_count: number;
}

export async function getOrganizationsWithStatsAction(gameSlug?: string) {
  try {
    const orgs = await dbProvider.organizations.getOrganizationsWithStats(gameSlug);
    return { success: true, organizations: orgs as OrgWithStats[] };
  } catch (error) {
    console.error('Error in getOrganizationsWithStatsAction:', error);
    return { success: false, error: 'Failed to fetch organizations', organizations: [] };
  }
}

export async function getAllOrganizationsAction() {
  try {
    const orgs = await dbProvider.organizations.findAll({ orderBy: 'name', orderDirection: 'ASC', limit: 100 });
    return {
      success: true,
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        tag: o.tag,
        logoUrl: o.logoUrl,
      })),
    };
  } catch (error) {
    console.error('Error in getAllOrganizationsAction:', error);
    return { success: false, organizations: [], error: 'Error al cargar organizaciones' };
  }
}

export interface OrganizerOrganizationDTO {
  id: string;
  name: string;
  tag: string;
  banner_url?: string;
  logo_url?: string;
  country?: string;
  founded_year?: string | number;
  rating?: string | number;
  organizers?: Array<{
    id: string;
    name: string;
    gamertag?: string;
    avatar_url?: string;
  }>;
}

export async function getOrganizerOrganizationAction(): Promise<{
  success: boolean;
  organization: OrganizerOrganizationDTO | null;
  error?: string;
}> {
  try {
    const { requireServerActor, getServerUserSession } = await import('@/lib/auth-server');
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const session = await getServerUserSession();

    let targetOrgId = actor.organizationId || session?.organizationId || null;

    if (!targetOrgId) {
      const user = await dbProvider.users.findById(actor.userId);
      targetOrgId = user?.organizationId || null;
    }

    let org: Organization | null = null;
    if (targetOrgId) {
      org = await dbProvider.organizations.findById(targetOrgId);
    }

    if (!org) {
      org = await dbProvider.organizations.findByOwnerId(actor.userId);
    }

    if (!org) {
      const comps = await dbProvider.competitions.findAll({
        where: { organizerId: actor.userId },
        limit: 1,
      });
      if (comps.length > 0 && comps[0].organizationId) {
        org = await dbProvider.organizations.findById(comps[0].organizationId);
      }
    }

    if (!org && actor.role === 'Administrador') {
      const allOrgs = await dbProvider.organizations.findAll({ limit: 1 });
      if (allOrgs.length > 0) {
        org = allOrgs[0];
      }
    }

    if (!org) {
      return { success: false, organization: null, error: 'Sin organización vinculada' };
    }

    // Fetch organizers associated with this organization
    const orgUsers = await dbProvider.users.findAll({
      where: { organization_id: org.id },
      limit: 20,
    });

    const organizers = orgUsers.map((u) => ({
      id: u.id,
      name: u.name,
      gamertag: u.gamertag,
      avatar_url: u.avatarUrl || undefined,
    }));

    // If current actor is not yet in organizers list (e.g. owner_id link), add them
    if (!organizers.some((o) => o.id === actor.userId)) {
      const currentUser = await dbProvider.users.findById(actor.userId);
      if (currentUser) {
        organizers.unshift({
          id: currentUser.id,
          name: currentUser.name,
          gamertag: currentUser.gamertag,
          avatar_url: currentUser.avatarUrl || undefined,
        });
      }
    }

    return {
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        tag: org.tag,
        banner_url: org.bannerUrl || undefined,
        logo_url: org.logoUrl || undefined,
        country: org.country || 'Chile',
        founded_year: org.foundedYear || 2022,
        rating: org.rating || 4.98,
        organizers,
      },
    };
  } catch (error: unknown) {
    console.error('Error en getOrganizerOrganizationAction:', error);
    return {
      success: false,
      organization: null,
      error: error instanceof Error ? error.message : 'Error al obtener la organización',
    };
  }
}

