---
name: find-skills
description: Meta-skill from Vercel Labs / Skills.sh to search, discover, evaluate, and install new skills dynamically when missing specific domain capabilities.
---

# 🔍 Find Skills Meta-Protocol

Inspired by `vercel-labs/skills/find-skills`. Equips the agent to dynamically identify capability gaps, search community skill registries (such as `Skills.sh`), and recommend or import relevant skills into `.agents/skills/`.

## 🛠️ Workflow

### 1. Capability Gap Detection
- Triggered when:
  - A task requires specialized domain knowledge not covered by existing project skills (e.g. specialized mobile framework rules, web scraping, custom CI/CD pipelines).
  - The user asks for recommended skills or plugins.

### 2. Registry Search & Evaluation
- Search the `skills.sh` or community catalog for relevant skills:
  - Check author credibility and community installs (e.g. `vercel-labs`, `anthropics`, `mattpocock`).
  - Verify skill compatibility with the current runtime (Node.js, TypeScript, Next.js, MySQL).
  - Inspect rule density, quality of code examples, and token overhead.

### 3. Installation Pattern
- When installing a new skill:
  1. Create directory under `.agents/skills/<skill-name>/`.
  2. Write `SKILL.md` with standard YAML frontmatter (`name`, `description`).
  3. Include actionable principles, examples, and edge case warnings.
