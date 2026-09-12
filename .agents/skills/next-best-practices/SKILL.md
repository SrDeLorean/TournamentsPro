---
name: next-best-practices
description: Next.js 16 & React 19 App Router architectural guidelines, Server/Client component boundary optimization, streaming, and caching strategies.
---

# ⚛️ Next.js 16 App Router Protocol

Best practices for building high-performance, resilient applications on Next.js 16 and React 19 with Turbopack.

## 📐 Core Architecture Rules

1. **Default to Server Components (RSC)**:
   - Keep components as Server Components unless they need:
     - React state (`useState`, `useReducer`).
     - Lifecycle hooks (`useEffect`, `useLayoutEffect`).
     - Browser-only APIs (`window`, `localStorage`, `matchMedia`).
     - Direct event listeners (`onClick`, `onChange`).
   - Move `'use client'` as deep in the component tree as possible (leaves, not roots).

2. **Server/Client Composition**:
   - Never import a Server Component into a Client Component.
   - Pass Server Components as `children` or JSX slots into Client Component wrappers to preserve server-rendering benefits.

3. **Data Fetching & Cache Hygiene**:
   - Fetch data where it is consumed; Next.js deduplicates requests.
   - Use `revalidatePath` and `revalidateTag` in Server Actions or mutation routes.
   - Never use client-side fetch in loops for data that could have been rendered on the server.

4. **Dynamic Viewport & Metadata**:
   - Use the `viewport` export for responsive settings, not deprecated `<meta name="viewport">` in `<head>`.
   - Use dynamic `generateMetadata` for SEO-critical pages (team profiles, tournament brackets).

5. **Standalone Production Bundle Alignment**:
   - Ensure external dependencies and native binaries (e.g. `sharp`) are properly declared in `serverExternalPackages` when targeting standalone deployments.
   - Verify assets via `scripts/prepare-standalone.mjs` before release.
