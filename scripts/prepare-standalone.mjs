import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function assertDirectory(directory, label) {
  try {
    const info = await stat(directory);
    if (info.isDirectory()) return;
  } catch {
    // The actionable error below is shared by missing and invalid paths.
  }

  throw new Error(`${label} not found at ${directory}. Run next build first.`);
}

export async function prepareStandalone(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const standaloneDirectory = path.join(root, '.next', 'standalone');
  const staticSource = path.join(root, '.next', 'static');
  const publicSource = path.join(root, 'public');
  const staticDestination = path.join(standaloneDirectory, '.next', 'static');
  const publicDestination = path.join(standaloneDirectory, 'public');

  await Promise.all([
    assertDirectory(standaloneDirectory, 'Standalone build'),
    assertDirectory(staticSource, 'Next.js static assets'),
    assertDirectory(publicSource, 'Public assets'),
  ]);

  await mkdir(path.dirname(staticDestination), { recursive: true });
  await Promise.all([
    cp(staticSource, staticDestination, { recursive: true, force: true }),
    cp(publicSource, publicDestination, { recursive: true, force: true }),
  ]);

  return { publicDestination, staticDestination };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  const projectRoot = process.argv[2] ?? path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
  const { publicDestination, staticDestination } = await prepareStandalone(projectRoot);
  console.log(`Standalone assets ready:\n- ${staticDestination}\n- ${publicDestination}`);
}
