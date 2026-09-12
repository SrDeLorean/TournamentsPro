---
name: typescript-best-practices
description: Matt Pocock's TypeScript guidelines for total type safety, discriminating unions, satisfies operator, strict narrowing, and eliminating any/unknown escapes.
---

# 🔷 TypeScript Best Practices Protocol

Comprehensive guidelines for robust, maintainable, and strictly typed TypeScript architectures.

## 📐 Core Tenets

1. **Eliminate `any` and Reckless `as` Casting**:
   - `any` disables compiler protection. Use `unknown` and narrow with type guards or Zod schemas.
   - Avoid type assertions (`as Type`) unless interfacing with untyped 3rd party libraries at the boundary. Use `satisfies` to validate shapes while preserving exact literal types.

2. **Discriminated Unions for State**:
   - Never represent loading, error, and success states with multiple independent booleans (`isLoading: boolean, isError: boolean, data?: T`).
   - Use discriminated unions with a tag (`status: 'idle' | 'loading' | 'success' | 'error'`) to prevent impossible states.

3. **Narrowing Over Casting**:
   - Use user-defined type predicates (`function isTeam(obj: unknown): obj is Team`).
   - Use `in` operator, `instanceof`, or Zod `.safeParse()` for safe boundary validation.

4. **Satisfies Operator**:
   ```typescript
   // ❌ Loose: loses specific keys
   const config: Record<string, RouteConfig> = { ... };

   // ✅ Strict: enforces contract while retaining literal key inference
   const config = { ... } satisfies Record<string, RouteConfig>;
   ```

5. **Branded Types for Critical Identifiers**:
   - Prevent passing a `UserId` into a `TeamId` parameter:
   ```typescript
   type Brand<K, T> = K & { readonly __brand: T };
   type UserId = Brand<string, 'UserId'>;
   type TeamId = Brand<string, 'TeamId'>;
   ```

6. **Generics with Constraints**:
   - Always constrain generic type arguments: `<T extends { id: string }>(item: T) => ...` instead of unconstrained `<T>`.

## 🛠️ Verification Command
- Always verify type integrity using:
  ```bash
  npx tsc --noEmit
  ```
