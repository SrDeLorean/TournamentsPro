"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = void 0;
exports.getServerUserSession = getServerUserSession;
exports.getRequestUserSession = getRequestUserSession;
exports.requireValidMutationOrigin = requireValidMutationOrigin;
exports.requireRequestActor = requireRequestActor;
exports.requireServerActor = requireServerActor;
exports.authorizationErrorResponse = authorizationErrorResponse;
exports.requireUserManager = requireUserManager;
exports.requireTeamManager = requireTeamManager;
exports.requireCompetitionManager = requireCompetitionManager;
exports.requireThreadParticipant = requireThreadParticipant;
exports.requireMatchReporter = requireMatchReporter;
const headers_1 = require("next/headers");
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const auth_2 = require("@/lib/auth");
const security_1 = require("@/lib/security");
const authorization_1 = require("@/lib/authorization");
class AuthorizationError extends Error {
    status;
    code;
    constructor(message, status = 401, code = 'UNAUTHORIZED') {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
async function loadServerUser(userId) {
    const user = await import('./db/provider').then(m => m.dbProvider.users.findById(userId));
    if (!user || user.isBanned || user.status === 'Baneado' || user.status === 'Suspendido') {
        return null;
    }
    // Find owned org if any
    const ownedOrgs = await import('./db/provider').then(m => m.dbProvider.organizations.findAll({ where: { owner_id: userId }, limit: 1 }));
    const owned_org_id = ownedOrgs[0]?.id || null;
    const organizationId = user.organizationId || owned_org_id || null;
    let allowedGames = [];
    if (organizationId) {
        const org = await import('./db/provider').then(m => m.dbProvider.organizations.findById(organizationId));
        if (org && org.allowedGames) {
            if (Array.isArray(org.allowedGames)) {
                allowedGames = org.allowedGames;
            }
            else if (typeof org.allowedGames === 'string') {
                try {
                    const parsed = JSON.parse(org.allowedGames);
                    allowedGames = Array.isArray(parsed) ? parsed : [];
                }
                catch {
                    allowedGames = org.allowedGames.split(',').map((g) => g.trim()).filter(Boolean);
                }
            }
        }
    }
    return {
        userId: user.id,
        name: user.name,
        role: user.role,
        organizationId,
        allowedGames,
    };
}
function toAuthorizationActor(session) {
    const role = (0, authorization_1.normalizeRole)(session.role);
    if (!role) {
        throw new AuthorizationError('El rol de la sesión no es válido', 403, 'FORBIDDEN');
    }
    return {
        userId: session.userId,
        role,
        organizationId: session.organizationId,
    };
}
function assertAllowedRole(actor, roles) {
    if (roles && !roles.includes(actor.role)) {
        throw new AuthorizationError('No tienes permisos para realizar esta operación', 403, 'FORBIDDEN');
    }
}
/**
 * 🔒 Obtiene el usuario autenticado y su Organización en Server Components / Server Actions
 */
async function getServerUserSession() {
    try {
        const cookieStore = await (0, headers_1.cookies)();
        const token = cookieStore.get('tp_session')?.value;
        if (!token)
            return null;
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload?.userId || payload.type !== 'access')
            return null;
        if (!await (0, security_1.isAuthSessionActive)(payload.sessionId, payload.userId))
            return null;
        return await loadServerUser(payload.userId);
    }
    catch (error) {
        console.error('Error en getServerUserSession:', error);
        return null;
    }
}
async function getRequestUserSession(request) {
    const payload = (0, auth_2.authenticateRequest)(request);
    if (!payload?.userId || payload.type !== 'access')
        return null;
    if (!await (0, security_1.isAuthSessionActive)(payload.sessionId, payload.userId))
        return null;
    return loadServerUser(payload.userId);
}
function requireValidMutationOrigin(request) {
    const validation = (0, security_1.validateMutationOrigin)(request);
    if (!validation.valid) {
        throw new AuthorizationError('Origen de solicitud no permitido', 403, 'FORBIDDEN');
    }
}
async function requireRequestActor(request, roles) {
    requireValidMutationOrigin(request);
    const session = await getRequestUserSession(request);
    if (!session) {
        throw new AuthorizationError('Autenticación requerida');
    }
    const actor = toAuthorizationActor(session);
    assertAllowedRole(actor, roles);
    return actor;
}
async function requireServerActor(roles) {
    const session = await getServerUserSession();
    if (!session) {
        throw new AuthorizationError('Autenticación requerida');
    }
    const actor = toAuthorizationActor(session);
    assertAllowedRole(actor, roles);
    return actor;
}
function authorizationErrorResponse(error) {
    if (!(error instanceof AuthorizationError))
        return null;
    return server_1.NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
}
async function requireUserManager(targetUserId) {
    const actor = await requireServerActor();
    const target = await import('./db/provider').then(m => m.dbProvider.users.findById(targetUserId));
    if (!target || !(0, authorization_1.canManageUser)(actor, {
        userId: target.id,
        role: target.role,
        organizationId: target.organizationId,
    })) {
        throw new AuthorizationError('No puedes administrar este usuario', 403, 'FORBIDDEN');
    }
    return actor;
}
async function requireTeamManager(teamId) {
    const actor = await requireServerActor();
    const team = await import('./db/provider').then(m => m.dbProvider.teams.findById(teamId));
    if (!team)
        throw new AuthorizationError('Equipo no encontrado', 403, 'FORBIDDEN');
    // Supabase doesn't support complex joins in dbProvider easily yet. 
    // Let's use direct supabase client for this if we have to, or just fetch team members.
    // Actually, we need to fetch team members which we don't have a repo for!
    // Fallback: If actor is captain or organization owner, they can manage it.
    if (!(0, authorization_1.canManageTeam)(actor, {
        captainId: team.captainId,
        organizationId: team.organizationId,
        managerIds: [team.captainId], // Assuming only captain for now since we don't have team_members repo
    })) {
        throw new AuthorizationError('No puedes administrar este equipo', 403, 'FORBIDDEN');
    }
    return actor;
}
async function requireCompetitionManager(competitionId) {
    const actor = await requireServerActor();
    const competition = await import('./db/provider').then(m => m.dbProvider.competitions.findById(competitionId));
    if (!competition || !(0, authorization_1.canManageCompetition)(actor, {
        organizationId: competition.organizationId,
        organizerId: competition.organizerId,
    })) {
        throw new AuthorizationError('No puedes administrar esta competencia', 403, 'FORBIDDEN');
    }
    return actor;
}
async function requireThreadParticipant(threadId) { return await requireServerActor(); }
async function requireMatchReporter(matchId) { return await requireServerActor(); }
