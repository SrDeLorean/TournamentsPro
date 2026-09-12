import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
  {
    env: { ...process.env, E2E_REQUIRE_AUTH: '1' },
    stdio: 'inherit',
    shell: false,
  },
);

if (result.error) {
  console.error(`No se pudo iniciar Playwright: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
