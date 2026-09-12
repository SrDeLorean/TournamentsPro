---
name: api-contract-guard
description: Strict API schema validation, Zod runtime guards, request/response contract enforcement, and HTTP error normalization.
---

# 🛡️ API Contract Guard Protocol

Enforces end-to-end type safety between backend route handlers, databases, and frontend clients.

## 📐 Core Principles

1. **Zero Trust at Network Boundaries**:
   - Every input entering a route handler (`req.json()`, `req.nextUrl.searchParams`, path parameters) must be validated through a strict schema (e.g. `Zod`).
   - Never pass raw, unsanitized JSON directly into database queries or repositories.

2. **Single Source of Truth**:
   - Define schemas in a centralized module (`src/lib/api-schemas.ts`).
   - Infer TypeScript types directly from schemas:
     ```typescript
     export const createTeamSchema = z.object({
       name: z.string().trim().min(3).max(40),
       tag: z.string().trim().regex(/^[A-Z0-9]{2,6}$/),
     });
     export type CreateTeamInput = z.infer<typeof createTeamSchema>;
     ```

3. **Consistent Error Payload Shapes**:
   - All error responses must adhere to a standardized JSON structure:
     ```typescript
     {
       error: string;
       code?: string;
       details?: Array<{ field: string; message: string }>;
     }
     ```
   - Return appropriate HTTP status codes:
     - `400 Bad Request`: Schema validation failure.
     - `401 Unauthorized`: Missing or invalid session/JWT.
     - `403 Forbidden`: Authenticated, but insufficient role or entity ownership.
     - `404 Not Found`: Resource does not exist.
     - `409 Conflict`: Unique constraint violation or concurrency collision.
     - `429 Too Many Requests`: Rate limit reached.

4. **Automated Contract Tests**:
   - Write integration tests asserting that valid payloads return 200/201 and invalid payloads return 400 with specific error messages.
   - Guard against silent regressions where payload fields are dropped or types drifted.
