'use server';

import { queryDB } from '@/lib/db';
import { Organization } from '@/lib/repositories';

export interface OrgWithStats extends Organization {
  comp_count: number;
}

export async function getOrganizationsWithStatsAction(gameSlug?: string) {
  try {
    const isAll = !gameSlug || ['ALL', 'all', 'TODOS', 'todas'].includes(gameSlug);
    const query = isAll
      ? `
        SELECT o.*, COUNT(c.id) as comp_count
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id
        LEFT JOIN competitions c ON (c.organization_id = o.id OR c.organizer_id = u.id) 
          AND c.status != 'Borrador'
        GROUP BY o.id
        ORDER BY comp_count DESC, o.name ASC
      `
      : `
        SELECT o.*, COUNT(c.id) as comp_count
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id
        LEFT JOIN competitions c ON (c.organization_id = o.id OR c.organizer_id = u.id) 
          AND c.game_slug = ? 
          AND c.status != 'Borrador'
        GROUP BY o.id
        ORDER BY comp_count DESC, o.name ASC
      `;

    const params = isAll ? [] : [gameSlug];
    const orgs = await queryDB<OrgWithStats>(query, params);
    return { success: true, organizations: orgs };
  } catch (error) {
    console.error('Error in getOrganizationsWithStatsAction:', error);
    return { success: false, error: 'Failed to fetch organizations', organizations: [] };
  }
}
