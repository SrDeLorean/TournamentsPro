---
name: github-actions-ci-cd
description: GitHub Actions workflow design, automated CI/CD pipelines, caching optimization, standalone release verification, and Hostinger deployment safety.
---

# 🚀 GitHub Actions CI/CD & Deployment Protocol

Architectural standards for reliable continuous integration (CI) and continuous deployment (CD) workflows using GitHub Actions.

## 📐 Best Practices

1. **Pipeline Stage Architecture**:
   - Organize CI workflows into distinct, fail-fast jobs:
     1. **Lint & Typecheck**: `eslint --max-warnings=0` and `npx tsc --noEmit`.
     2. **Unit & Integration Tests**: `npm test` (`vitest run`).
     3. **Production Build Verification**: `npm run build` with standalone packaging check (`scripts/prepare-standalone.mjs`).
     4. **Smoke & Release Verification**: `scripts/check-release-config.mjs` and release health checks.

2. **Dependency & Build Caching**:
   - Cache `~/.npm` and `.next/cache` using `actions/cache`:
     ```yaml
     - name: Cache Next.js build
       uses: actions/cache@v4
       with:
         path: |
           ~/.npm
           ${{ github.workspace }}/.next/cache
         key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**.[jt]s', '**.[jt]sx') }}
         restore-keys: |
           ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
     ```

3. **Secret Security & Isolation**:
   - Never echo environment secrets into build logs.
   - Restrict access to production secrets (`HOSTINGER_SSH_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) to the `main` branch or protected environments.

4. **Zero-Downtime Deployment & Rollbacks**:
   - Deploy standalone builds into timestamped release directories (`releases/<timestamp>`).
   - Atomically swap the symlink (`current -> releases/<timestamp>`) after validating health checks.
   - Maintain at least the previous 2 releases on the server for instant rollback capability.
