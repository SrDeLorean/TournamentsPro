---
name: security-review
description: Specialized security audit pass detecting OWASP vulnerabilities, SQL injections, broken access control (IDOR), authentication bypasses, sensitive data leakage, and untrusted user inputs.
---

# 🛡️ Security Review Protocol

Specialized security evaluation protocol to audit code changes and API endpoints for critical security vulnerabilities.

## 🚨 Critical Checkpoints

### 1. Injection Vulnerabilities (SQL, Command, Scripting)
- **Prepared Statements**: ALWAYS use parameterized queries with `?` placeholders (e.g. in `mysql2/promise`). Never concatenate raw user input into SQL strings.
- **XSS Sanitization**: Ensure user-generated markup is sanitized or rendered via safe React text bindings. Never use `dangerouslySetInnerHTML` with untrusted data.

### 2. Broken Object-Level Authorization (IDOR)
- Never rely solely on an entity's `id` from the URL or request body to authorize actions.
- Verify ownership: Check that the authenticated user (`session.userId` or tenant) actually owns or manages the requested tournament/team/resource.

### 3. Input Validation & Boundaries
- Validate all incoming payloads (`req.json()`, query parameters, headers) using strict schemas (e.g. `zod`).
- Reject unexpected extra fields (`.strict()` or `.strip()`).
- Sanitize file uploads, limiting file sizes and verifying MIME types.

### 4. Secrets & Sensitive Data Leakage
- Ensure API keys, database passwords, and JWT secrets are loaded only via `process.env` on the server side.
- Never prefix sensitive environment variables with `NEXT_PUBLIC_`.
- Do not expose hashed passwords, internal tokens, or raw database error traces in client API responses.
