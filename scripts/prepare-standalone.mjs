import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function assertDirectory(directory, label) {
  try {
    const info = await stat(directory);
    if (info.isDirectory()) return;
  } catch {
    // Use the shared actionable error below.
  }
  throw new Error(`${label} not found at ${directory}. Run next build first.`);
}

async function assertFile(file, label) {
  try {
    const info = await stat(file);
    if (info.isFile()) return;
  } catch {
    // Use the shared actionable error below.
  }
  throw new Error(`${label} not found at ${file}. Run next build first.`);
}

async function countFiles(directory, matcher = () => true) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    total += entry.isDirectory() ? await countFiles(target, matcher) : Number(matcher(target));
  }
  return total;
}

export async function verifyStandalone(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const standaloneDirectory = path.join(root, '.next', 'standalone');
  const serverFile = path.join(standaloneDirectory, 'server.js');
  const staticDirectory = path.join(standaloneDirectory, '.next', 'static');
  const publicDirectory = path.join(standaloneDirectory, 'public');

  await Promise.all([
    assertFile(serverFile, 'Standalone server'),
    assertDirectory(staticDirectory, 'Standalone static assets'),
    assertDirectory(publicDirectory, 'Standalone public assets'),
  ]);

  const [cssFiles, javascriptFiles, publicFiles] = await Promise.all([
    countFiles(staticDirectory, (file) => file.endsWith('.css')),
    countFiles(staticDirectory, (file) => file.endsWith('.js')),
    countFiles(publicDirectory),
  ]);
  if (cssFiles === 0) throw new Error('Standalone build has no CSS assets. Deployment would render unstyled HTML.');
  if (javascriptFiles === 0) throw new Error('Standalone build has no JavaScript chunks. Navigation would not hydrate.');

  return { cssFiles, javascriptFiles, publicFiles, publicDirectory, serverFile, staticDirectory };
}

export async function prepareStandalone(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const standaloneDirectory = path.join(root, '.next', 'standalone');
  const staticSource = path.join(root, '.next', 'static');
  const publicSource = path.join(root, 'public');
  const staticDestination = path.join(standaloneDirectory, '.next', 'static');
  const publicDestination = path.join(standaloneDirectory, 'public');

  await assertDirectory(standaloneDirectory, 'Standalone build');
  await Promise.all([
    assertFile(path.join(standaloneDirectory, 'server.js'), 'Standalone server'),
    assertDirectory(staticSource, 'Next.js static assets'),
    assertDirectory(publicSource, 'Public assets'),
  ]);

  // Never mix chunks from two builds: stale hashed assets cause reload-only failures.
  await Promise.all([
    rm(staticDestination, { recursive: true, force: true }),
    rm(publicDestination, { recursive: true, force: true }),
  ]);
  await mkdir(path.dirname(staticDestination), { recursive: true });
  await Promise.all([
    cp(staticSource, staticDestination, { recursive: true, force: true }),
    cp(publicSource, publicDestination, { recursive: true, force: true }),
  ]);

  const verification = await verifyStandalone(root);
  const buildIdFile = path.join(root, '.next', 'BUILD_ID');
  const buildId = await readFile(buildIdFile, 'utf8').then((value) => value.trim()).catch(() => 'development');
  await writeFile(
    path.join(standaloneDirectory, 'deployment-manifest.json'),
    `${JSON.stringify({ buildId, deploymentId: process.env.NEXT_DEPLOYMENT_ID || process.env.DEPLOYMENT_VERSION || null, generatedAt: new Date().toISOString(), cssFiles: verification.cssFiles, javascriptFiles: verification.javascriptFiles, publicFiles: verification.publicFiles }, null, 2)}\n`,
  );
  return verification;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  const projectRoot = process.argv[2] ?? path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
  const result = await prepareStandalone(projectRoot);
  console.log(`Standalone release verified: ${result.cssFiles} CSS, ${result.javascriptFiles} JS, ${result.publicFiles} public files.`);
}
