---
name: improve-codebase-architecture
description: Matt Pocock's software architecture protocol. Focuses on deep modules, narrow interfaces, high cohesion, low coupling, navigability, and testability across the codebase.
---

# 🏛️ Improve Codebase Architecture Protocol

Inspired by `mattpocock/skills/improve-codebase-architecture`. Guides architectural refactoring and module design following "A Philosophy of Software Design" principles.

## 🛠️ Core Principles

### 1. Deep Modules vs. Shallow Modules
- **Deep Modules**: Simple, narrow interfaces that hide substantial internal complexity (e.g. `generateFixtures(tournamentId)` that internally handles seeding, rounds, team pairing, and database transactions).
- **Avoid Shallow Modules**: Interfaces that are as complex as their implementations, adding layer indirection without reducing cognitive load.

### 2. Information Hiding & Encapsulation
- Keep implementation details private to the module. Do not expose internal database row representations directly to the UI; use domain models or DTOs.
- Isolate external dependencies (e.g. database driver `mysql2`, third-party APIs) behind clean abstractions in `src/lib/`.

### 3. Cohesion & Low Coupling
- Colocate code that changes together (features, components, hooks, and localized tests).
- Eliminate circular dependencies between folders or modules.
- Prefer explicit dependency injection or parameter passing over hidden global states.

### 4. Codebase Navigability
- Organize by domain/feature rather than technical layer when features grow complex.
- Keep file sizes manageable: split components over 300 lines into cohesive subcomponents.
