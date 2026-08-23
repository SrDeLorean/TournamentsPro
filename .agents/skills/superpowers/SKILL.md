---
name: superpowers
description: Superpowers agentic framework for structured task decomposition, TDD, systematic execution, subagent delegation, and strict verification before completion.
---

# 🚀 Superpowers Agentic Framework

This skill arms the agent with systematic problem-solving workflows inspired by `obra/superpowers`.

## 🛠️ Core Principles

1. **Systematic Task Decomposition**:
   - Break complex features into small, atomic, verifiable steps.
   - Execute one step at a time and verify before moving to the next.

2. **Test-Driven & Verification-First**:
   - Always verify changes with unit tests, type checks (`npm run build`), or empirical runtime execution.
   - Never declare success without concrete execution results showing 0 errors.

3. **Subagent Delegation & Parallel Research**:
   - Spawn subagents for isolated research, broad codebase surveys, or background task execution.
   - Maintain clean state isolation.

4. **Root Cause Analysis**:
   - Trace full stack trace logs before editing code.
   - Fix underlying contracts rather than applying superficial symptom patches.
