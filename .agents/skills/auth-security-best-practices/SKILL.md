---
name: auth-security-best-practices
description: Authentication architecture, JWT token rotation, secure HttpOnly cookies, session management, OAuth hardening, and role-based access control (RBAC).
---

# 🔐 Authentication & Session Security Protocol

Architectural rules for building hardened authentication systems, secure sessions, and granular permission controls.

## 📐 Core Security Guidelines

1. **HttpOnly, Secure, SameSite Cookie Storage**:
   - Never store authentication tokens (JWTs, session IDs) in `localStorage` or `sessionStorage` (vulnerable to XSS).
   - Set cookies with:
     - `httpOnly: true` (inaccessible to JavaScript).
     - `secure: true` in production (HTTPS only).
     - `sameSite: 'lax'` or `'strict'` (mitigates CSRF).
     - `path: '/'`.

2. **Session Token Validation & Expiry**:
   - Sign JWTs with strong HMAC-SHA256 or RS256 secrets (`JWT_SECRET`).
   - Enforce explicit expiration (`expiresIn: '7d'`).
   - Validate token claims (`userId`, `role`, `iat`, `exp`) on every protected request.

3. **Password Hashing Standards**:
   - Use `bcrypt` or `argon2` with adequate work factor (salt rounds >= 10).
   - Never log passwords or compare plaintext strings directly; always use `bcrypt.compare()`.

4. **OAuth 2.0 Hardening**:
   - When integrating Google OAuth or third-party providers:
     - Verify id_token signatures server-side via official libraries (`OAuth2Client`).
     - Check token audience (`aud === GOOGLE_CLIENT_ID`).
     - Reject expired or unverified emails (`email_verified !== true`).

5. **Role-Based Access Control (RBAC)**:
   - Verify permissions server-side on every mutation:
     - Admin: Global platform management.
     - Organizer: Competitions and matches within their organization.
     - Captain: Club roster and match check-ins.
     - Athlete: Personal profile and contract offers.
   - Never trust client-supplied role claims without database or signed session verification.
