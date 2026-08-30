import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const appDirectory = path.join(process.cwd(), 'src', 'app');
const maximumPageLines = 150;
const maximumComponentLines = 300;
const debtPath = path.join(process.cwd(), 'scripts', 'architecture-debt.json');
const sourceDirectory = path.join(process.cwd(), 'src');

async function findFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findFiles(target, predicate);
    return entry.isFile() && predicate(entry.name) ? [target] : [];
  }));
  return nested.flat();
}

const emittedJavaScript = await findFiles(sourceDirectory, (name) => name.endsWith('.js'));
if (emittedJavaScript.length > 0) {
  console.error(`No guarde JavaScript compilado dentro de src; puede resolver antes que TypeScript y romper producción:\n${emittedJavaScript.map((file) => path.relative(process.cwd(), file)).join('\n')}`);
  process.exitCode = 1;
}

async function findPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPages(target);
    return entry.isFile() && entry.name === 'page.tsx' ? [target] : [];
  }));
  return nested.flat();
}

const pages = await findPages(appDirectory);
const oversized = [];

for (const page of pages) {
  const source = await readFile(page, 'utf8');
  const lines = source.trimEnd().split(/\r?\n/).length;
  if (lines > maximumPageLines) {
    oversized.push(`${path.relative(process.cwd(), page)} (${lines} líneas)`);
  }
}

if (oversized.length > 0) {
  console.error(`Las páginas no pueden superar ${maximumPageLines} líneas:\n${oversized.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Arquitectura válida: ${pages.length} páginas, ninguna supera ${maximumPageLines} líneas.`);
}

async function findTsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTsxFiles(target);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [target] : [];
  }));
  return nested.flat();
}

const debt = JSON.parse(await readFile(debtPath, 'utf8'));
const componentFiles = [
  ...await findTsxFiles(path.join(process.cwd(), 'src', 'components')),
  ...await findTsxFiles(path.join(process.cwd(), 'src', 'features')),
];
const componentViolations = [];

for (const file of componentFiles) {
  const relative = path.relative(process.cwd(), file).replaceAll('\\', '/');
  const lines = (await readFile(file, 'utf8')).trimEnd().split(/\r?\n/).length;
  const allowed = debt[relative] ?? maximumComponentLines;
  if (lines > allowed) componentViolations.push(`${relative} (${lines}; máximo ${allowed})`);
}

if (componentViolations.length > 0) {
  console.error(`La deuda de componentes no puede crecer:\n${componentViolations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Presupuesto válido: ${componentFiles.length} componentes revisados; nuevos componentes ≤ ${maximumComponentLines} líneas.`);
}
