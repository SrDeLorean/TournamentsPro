# Security model

TournamentsPro treats every Route Handler and Server Action as a public entry point.
Authorization must be evaluated from the verified `tp_session` cookie and current
database state, never from a role or actor identifier supplied by the browser.

## Roles and scope

- `Jugador`: may manage only their own non-privileged profile and resources.
- `Capitan` / `Encargado`: may manage teams where the database records that relationship.
- `Organizador`: may manage only resources belonging to their organization.
- `Administrador`: may manage global resources and privileged role assignments.

Use the guards in `src/lib/auth-server.ts` before reading or mutating protected data.
Return sanitized DTOs and never expose password hashes. Mutations involving fixtures,
transfers, rosters, or match approval must use a single database transaction and lock
the relevant rows before checking capacity or status.

## Deployment requirements

1. Set a unique production `JWT_SECRET`; the application refuses to sign tokens without it.
2. Configure both Google client ID variables to the same authorized web client.
3. Run `npm run db:migrate` before starting the new application release.
4. Run `npm run db:migrate:verify` after deployment.
5. Do not give the runtime database account `ALTER` or `CREATE` privileges after migrations.
6. Terminate TLS at the edge and preserve secure, HttpOnly, same-site cookies.
7. Store archives and database backups outside the public web root and Git repository.

## Operational security controls

- Migration `0002_security_operations.sql` creates the persistent rate-limit,
  revocable-session, and audit tables. Deploy it before serving application traffic.
- Authentication, chat messages, and uploads use database-backed rate limits. If MySQL
  is temporarily unavailable, a bounded in-process limiter takes over and fails closed
  when its capacity is exhausted; degraded-limit events are emitted through the
  structured logger. Forwarded client addresses are used only with explicit
  `TRUST_PROXY=true`; authentication also retains case-normalized per-account limits.
- Every signed access token carries a `sessionId` that must remain active in
  `auth_sessions`. Logout revokes that identifier; bans and password changes revoke all
  sessions for the affected account. Deploying this migration intentionally requires
  users with legacy, unregistered tokens to sign in again.
- Cookie-authenticated mutable Route Handlers reject requests whose `Origin` does not
  match the effective host (or the configured application origin). Non-browser clients
  should use an explicit Bearer token. Browser/E2E API clients that reuse cookies must
  send the matching `Origin` header.
- Administrative and organizer mutations write structured records to
  `security_audit_log`. Secret-like metadata is redacted before persistence, and audit
  persistence failures are logged without failing the completed domain mutation.

## Temporarily accepted browser-policy risk

The production CSP currently retains `script-src 'unsafe-inline'` for compatibility with
the existing Next.js bootstrap and static rendering path. This weakens CSP protection
against an otherwise exploitable inline-script injection. It is an explicitly accepted,
temporary risk: do not broaden script origins, keep `object-src 'none'` and
`frame-ancestors 'none'`, and migrate to request nonces only alongside an end-to-end
static/rendering compatibility test.
