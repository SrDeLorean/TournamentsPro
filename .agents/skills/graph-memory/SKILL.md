---
name: graph-memory
description: Persistent graph memory for tracking project entities, architectural decisions, database schemas, and codebase evolution across independent chat sessions.
---

# 🧠 Graph Memory Protocol

Inspired by `stark-sim/graph-memory` and `Graphiti`. Stores structured knowledge about entities, relations, and past design decisions in an evolving knowledge base.

## 🛠️ Core Principles

### 1. Entity-Relation Architecture
- Treat the codebase not just as files, but as a graph of **Entities**, **Relations**, and **Decisions**:
  - **Entities**: Models (e.g. `Tournament`, `Team`, `Match`), Services, Database Tables, API Endpoints.
  - **Relations**: `Tournament HAS_MANY Teams`, `Match BELONGS_TO Tournament`, `FixtureGenerator MUTATES Matches`.
  - **Decisions**: Architectural rationales (e.g. why soft-deletes are used, why MySQL transactions enclose fixture generation).

### 2. Cross-Session Memory Updates
- When making substantial architectural decisions or modifying database schemas, record or update the knowledge graph in `.agents/memory/knowledge-graph.json` or `.agents/memory/decisions.md`.
- Before proposing structural changes, consult existing memory records to ensure compatibility with past design choices.

### 3. Schema & Constraint Consistency
- When adding fields to database tables or changing TypeScript types, verify all related edges in the graph:
  - SQL Schema definition (`src/lib/db.ts` or migrations)
  - API request/response validation (`Zod` schemas)
  - Frontend components consuming the model
