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
