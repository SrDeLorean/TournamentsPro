import { NextResponse } from 'next/server';

import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { isAdministrator } from '@/lib/authorization';
import { buildIdentityWarnings, buildRecentActivity, type DashboardInsights } from '@/lib/dashboard-insights';

const ACTIVE_COMPETITION_STATES = new Set(['ACTIVA', 'ACTIVO', 'EN_CURSO', 'EN CURSO', 'INICIADA']);
const FINISHED_COMPETITION_STATES = new Set(['FINALIZADA', 'FINALIZADO', 'CERRADA', 'CERRADO', 'COMPLETADA']);
const UPCOMING_COMPETITION_STATES = new Set(['BORRADOR', 'INSCRIPCIONES', 'PROXIMA', 'PRÓXIMA', 'PROGRAMADA']);

export async function GET(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const { dbProvider } = await import('@/lib/db/provider');
    const [allUsers, allOrganizations, allTeams, allCompetitions] = await Promise.all([
      dbProvider.users.findAll({ orderBy: 'created_at', orderDirection: 'DESC' }),
      dbProvider.organizations.findAll({ orderBy: 'created_at', orderDirection: 'DESC' }),
      dbProvider.teams.findAll({ orderBy: 'created_at', orderDirection: 'DESC' }),
      dbProvider.competitions.findAll({ orderBy: 'created_at', orderDirection: 'DESC' }),
    ]);

    const globalScope = isAdministrator(actor);
    const organizationIds = globalScope
      ? new Set(allOrganizations.map((organization) => organization.id))
      : new Set(allOrganizations.filter((organization) => organization.id === actor.organizationId || organization.ownerId === actor.userId).map((organization) => organization.id));
    const organizations = globalScope ? allOrganizations : allOrganizations.filter((organization) => organizationIds.has(organization.id));
    const teams = globalScope ? allTeams : allTeams.filter((team) => team.organizationId && organizationIds.has(team.organizationId));
    const competitions = globalScope
      ? allCompetitions
      : allCompetitions.filter((competition) => (competition.organizationId && organizationIds.has(competition.organizationId)) || competition.organizerId === actor.userId);
    const rosterUserIds = new Set<string>();
    if (!globalScope) {
      const squads = await Promise.all(teams.map((team) => dbProvider.teams.getSquad(team.id)));
      for (const member of squads.flat()) {
        const userId = typeof member.user_id === 'string' ? member.user_id : typeof member.userId === 'string' ? member.userId : null;
        if (userId) rosterUserIds.add(userId);
      }
    }
    const users = globalScope
      ? allUsers
      : allUsers.filter((user) => user.id === actor.userId || rosterUserIds.has(user.id) || (user.organizationId && organizationIds.has(user.organizationId)));

    const normalizedCompetitionStatus = (status: string) => status.trim().toUpperCase().replace(/-/g, '_');
    const sanctions: DashboardInsights['sanctions'] = [
      ...users.filter((user) => user.isBanned).map((user) => ({ id: user.id, type: 'user' as const, name: user.gamertag, reason: user.banReason || 'Sin motivo indicado', date: user.bannedAt })),
      ...teams.filter((team) => team.isBanned).map((team) => ({ id: team.id, type: 'team' as const, name: team.name, reason: team.banReason || 'Infracción disciplinaria', date: team.updatedAt })),
      ...organizations.filter((organization) => organization.isBanned).map((organization) => ({ id: organization.id, type: 'organization' as const, name: organization.name, reason: organization.banReason || 'Infracción disciplinaria', date: organization.bannedAt })),
    ];

    const payload: DashboardInsights = {
      scope: globalScope ? 'global' : 'organization',
      users: {
        total: users.length,
        newUsers: buildRecentActivity(users.map((user) => user.createdAt)),
        activeUsers: buildRecentActivity(users.map((user) => user.lastLoginAt)),
      },
      organizations: {
        total: organizations.length,
        newOrganizations: buildRecentActivity(organizations.map((organization) => organization.createdAt)),
      },
      teams: {
        total: teams.length,
        newTeams: buildRecentActivity(teams.map((team) => team.createdAt)),
      },
      competitions: {
        total: competitions.length,
        active: competitions.filter((competition) => ACTIVE_COMPETITION_STATES.has(normalizedCompetitionStatus(competition.status))).length,
        finished: competitions.filter((competition) => FINISHED_COMPETITION_STATES.has(normalizedCompetitionStatus(competition.status))).length,
        upcoming: competitions.filter((competition) => UPCOMING_COMPETITION_STATES.has(normalizedCompetitionStatus(competition.status))).length,
      },
      sanctions,
      identityWarnings: buildIdentityWarnings(users),
    };

    return NextResponse.json({ success: true, insights: payload });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo cargar la analítica.' }, { status: 500 });
  }
}
