---
name: handoff
description: Structured session checkpointing and state persistence protocol. Generates high-density context summaries when closing or resuming tasks to minimize token consumption and eliminate agent amnesia across sessions.
---

# 📋 Session Handoff Protocol

Inspired by `mattpocock/skills/handoff`. Provides clean context serialization when wrapping up work, switching tasks, or handing over context to a future session or agent.

## 🎯 Objectives

1. **Eliminate Agent Amnesia**: Capture decisions, discovered constraints, and pending items.
2. **Compress Token Context**: Avoid dragging 50+ message histories into new sessions.
3. **Instant Resume**: A new session should be able to resume immediately after reading this single document.

---

## 📝 Checkpoint Structure (`HANDOFF.md`)

When executing a handoff or when prompted by the user to save state, structure the summary as follows:

```markdown
# 🏁 Session Handoff: [Feature / Task Name]

### 1. Current State
- What was completed and verified in this session.
- Files created or modified with their relative paths.

### 2. Discovered Constraints & Edge Cases
- Architectural quirks, database schema requirements, or API conventions learned.
- Non-obvious blockers that were encountered and resolved.

### 3. Immediate Next Actions (Numbered)
1. Exact next step with target file and function.
2. Verification step (test or curl command).

### 4. Open Questions / Blockers
- Pending architectural or user decisions.
```

## ⚡ Execution Rules

- Keep it compact: high signal-to-noise ratio.
- Include exact file paths and function names.
- Never write vague next steps like "continue working"; specify the concrete line or endpoint.
