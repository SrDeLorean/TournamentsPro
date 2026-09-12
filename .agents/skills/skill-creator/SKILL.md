---
name: skill-creator
description: Anthropic's skill development protocol. Standards and workflows for creating, testing against baseline benchmarks, refining, and documenting custom agent skills.
---

# 🛠️ Skill Creator Protocol

Inspired by `anthropics/skills/skill-creator`. Establishes systematic guidelines for authoring, evaluating, and refining custom agent skills to ensure high behavioral fidelity and token efficiency.

## 📐 Skill Anatomy

Every skill created in `.agents/skills/<name>/` must satisfy:

1. **Frontmatter**:
   - `name`: Lowercase, hyphen-separated identifier matching the directory name.
   - `description`: Clear, 1-2 sentence overview of triggers, purpose, and scope.

2. **Actionable Instructions (`SKILL.md`)**:
   - Concise principles written in imperative form.
   - Realistic "Incorrect" vs. "Correct" code examples.
   - Concrete boundary conditions and edge cases.

3. **Benchmarking & Refinement**:
   - Test the skill against a baseline prompt without the skill.
   - Verify that the agent follows instructions without unnecessary tokens or hallucinations.
   - Ensure it does not conflict with existing skills (e.g. `caveman`, `superpowers`).
