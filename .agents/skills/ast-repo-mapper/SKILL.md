---
name: ast-repo-mapper
description: Structural AST analysis, symbol reference tracing, and safe codebase-wide refactoring without broken imports or caller regressions.
---

# 🌳 AST Repo Mapper Protocol

Specialized protocol for structural code parsing, abstract syntax tree (AST) traversal, symbol resolution, and high-confidence refactorings across monorepos and complex Next.js applications.

## 📐 Core Principles

1. **Syntax Over Substrings**:
   - Never use blind regex replacement for renaming functions, types, or exported constants across multiple files.
   - Use AST patterns (imports, call expressions, type declarations) to guarantee exact lexical scoping.

2. **Caller Graph Verification**:
   - Before modifying or removing any exported function, type, or component:
     1. Trace all incoming call sites (`ripgrep` with word boundaries `\bFunctionName\b` or AST matchers).
     2. Verify every consumer's argument types and return contracts.
     3. Check dynamic imports (`next/dynamic`, `import(...)`) and route handlers.

3. **Structural Component Mapping**:
   - Map parent-child component trees before refactoring shared layouts or navbars.
   - Identify slot usage, prop forwarding (`...props`), and context providers to avoid breaking implicit runtime dependencies.

4. **Safe Breaking-Change Protocol**:
   - When updating a public signature:
     - Keep deprecated signature with `@deprecated` annotation during transition if callers are distributed.
     - Provide atomic codemod or migration pass to update all call sites in the same commit.
     - Run `npx tsc --noEmit` and test suites immediately to verify 0 breakage.

## 🛠️ Typical Workflows

- **Refactoring Prop Types**: Scan all JSX elements using the component to ensure every required prop is supplied.
- **API Signature Evolution**: Ensure both route handler (`route.ts`) and client invocation (`fetch(...)`) update atomically with matching types.
- **Dead Code Pruning**: Trace exports with 0 references across the repository before safe removal.
