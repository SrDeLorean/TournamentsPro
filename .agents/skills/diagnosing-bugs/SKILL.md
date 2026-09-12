---
name: diagnosing-bugs
description: Matt Pocock's systematic bug diagnosis protocol. Prevents shotgun debugging by enforcing reproducing scripts, log inspection, root-cause isolation, and minimal regression testing before touching code.
---

# 🔍 Diagnosing Bugs Protocol

Inspired by `mattpocock/skills/diagnosing-bugs`. Enforces scientific, hypothesis-driven debugging to eliminate "shotgun debugging" (randomly editing code hoping a bug disappears).

## 🛑 Golden Rule

**NEVER modify production application code until the bug is reliably reproduced and its root cause is proven.**

---

## 🛠️ The 4-Step Diagnosis Loop

### 1. Reproduce First
- Construct a minimal, deterministic reproduction scenario before touching implementation code.
- Prefer a standalone test script, a unit test case, or a minimal curl/fetch command.
- If the bug cannot be reproduced reliably, gather more logging and environment details instead of guessing.

### 2. Inspect State & Data Flow
- Trace inputs at the boundary (API request payload, route params, database response).
- Check data types, nullability, unexpected undefined fields, and serialization mismatches.
- Log intermediate values or use runtime execution to confirm where assumptions break.

### 3. Isolate the Root Cause
- Differentiate symptoms from causes:
  - *Symptom*: "TypeError: Cannot read properties of undefined (reading 'team_name')".
  - *Root Cause*: "The SQL query returns an empty array when the tournament ID is numeric string instead of number, bypassing the fallback".
- Explain the mechanism in 1-2 concise sentences before writing any fix.

### 4. Minimal Targeted Fix & Verification
- Apply the smallest coherent fix addressing the root cause directly.
- Rerun the reproduction test: verify it passes.
- Run the full test suite / build checks (`npm run build`) to ensure no collateral regressions.
- Remove temporary debug logs.
