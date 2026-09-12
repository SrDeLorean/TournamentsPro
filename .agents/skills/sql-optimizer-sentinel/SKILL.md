---
name: sql-optimizer-sentinel
description: SQL performance optimization, index analysis, N+1 query elimination, transaction isolation, and connection pool efficiency.
---

# 🗄️ SQL Optimizer Sentinel Protocol

Audits and optimizes database queries, indexing strategies, transactions, and connection lifecycle management across MySQL and Supabase/PostgreSQL.

## 📐 Core Principles

1. **Eliminate N+1 Queries**:
   - Never execute queries inside loops (`for (const team of teams) { queryMembers(team.id) }`).
   - Use batch operations:
     - `WHERE id IN (...)` with single join queries.
     - Supabase REST: `.in('id', ids)` or composite joins `.select('*, members(*)')`.

2. **Index Alignment**:
   - Queries with `WHERE`, `ORDER BY`, or `JOIN` conditions must match existing composite or single-column indexes.
   - Run `EXPLAIN` or `EXPLAIN ANALYZE` on complex queries to detect `ALL` (full table scans) or filesorts.

3. **Transaction Atomicity & Row Locking**:
   - Multi-step state mutations (e.g. transfers, match results, wallet balances) MUST run inside atomic transactions.
   - Use row locking (`SELECT ... FOR UPDATE`) or optimistic concurrency control (Compare-And-Swap: `UPDATE ... WHERE status = 'pending' AND version = ?`) to avoid race conditions.

4. **Connection Pool Hygiene**:
   - Always release connections back to the pool in a `finally` block:
     ```typescript
     const conn = await pool.getConnection();
     try {
       await conn.beginTransaction();
       // ... work ...
       await conn.commit();
     } catch (err) {
       await conn.rollback();
       throw err;
     } finally {
       conn.release();
     }
     ```

5. **Pagination & Query Limits**:
   - Never run unconstrained `SELECT * FROM table`. Always enforce `LIMIT` and cursor-based or keyset pagination for high-volume entities (users, matches, logs).
