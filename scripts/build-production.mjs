import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareStandalone } from './prepare-standalone.mjs';

export function createDeploymentId(date = new Date(), entropy = randomBytes(6).toString('hex')) {
  return `${date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${entropy}`;
}

function runNextBuild(projectRoot, environment) {
  const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, 'build'], {
      cwd: projectRoot,
      env: environment,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Next.js build failed (${signal || `exit ${code}`}).`));
    });
  });
}

export async function buildProduction(projectRoot = process.cwd()) {
  const deploymentId = process.env.NEXT_DEPLOYMENT_ID || process.env.DEPLOYMENT_VERSION || createDeploymentId();
  const environment = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_DEPLOYMENT_ID: deploymentId,
    DEPLOYMENT_VERSION: deploymentId,
  };

  console.log(`Building deployment ${deploymentId}...`);
  await runNextBuild(path.resolve(projectRoot), environment);

  process.env.NEXT_DEPLOYMENT_ID = deploymentId;
  process.env.DEPLOYMENT_VERSION = deploymentId;
  const result = await prepareStandalone(projectRoot);
  console.log(`Standalone release ${deploymentId} verified: ${result.cssFiles} CSS, ${result.javascriptFiles} JS, ${result.publicFiles} public files.`);
  return { deploymentId, ...result };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  const projectRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
  await buildProduction(projectRoot);
}
