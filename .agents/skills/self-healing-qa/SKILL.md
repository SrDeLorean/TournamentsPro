---
name: self-healing-qa
description: Automated QA protocol for diagnosing flaky tests, mutation analysis, regression isolation, and self-healing test assertions.
---

# 🧪 Self-Healing QA & Flakiness Mitigation Protocol

Systematic methodology for analyzing test failures, isolating non-deterministic behavior, and hardening test suites against regressions.

## 📐 Core Protocol

1. **Root Cause Diagnosis Before Edits**:
   - When a test fails, inspect the exact failure mode:
     - **Assertion mismatch**: Did expected output change due to a business requirement, or is it a regression?
     - **Timing / Race condition**: Did an asynchronous promise resolve out of order?
     - **Mock leakage**: Did an earlier test modify a global mock without restoring (`vi.restoreAllMocks()`)?
     - **Environment discrepancy**: Missing environment variable or mock database connection?

2. **Isolation Guarantee**:
   - Every test suite must be fully self-contained.
   - Use `beforeEach` and `afterEach` hooks to clear and restore mocks:
     ```typescript
     beforeEach(() => {
       vi.clearAllMocks();
     });
     afterEach(() => {
       vi.restoreAllMocks();
     });
     ```
   - Never share mutable state between parallel test files.

3. **Mutation Testing Mindset**:
   - A test that passes when the underlying logic is broken is worse than no test.
   - Intentionally invert a condition (e.g. `>` to `<`) or delete a check to ensure at least one test fails loudly.
   - If tests still pass when code is broken, add explicit edge case assertions immediately.

4. **Flake Elimination**:
   - Ban non-deterministic inputs (`Date.now()`, `Math.random()`) in tests without explicit time freezing (`vi.useFakeTimers()`) or seeded mocks.
   - Wait for explicit conditions instead of arbitrary delays.
