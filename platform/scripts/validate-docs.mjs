import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const requiredDocs = [
  'AGENTS.md',
  'README.md',
  'docs/INICIAL.md',
  'docs/DOCUMENTATION_ARCHITECTURE.md',
  'docs/ENVIRONMENTS_CONTRACT.md',
  'docs/OPERADOR_PROYECTO.md',
  'docs/BIBLIA_SPORTEX.md',
  'docs/BUSINESS.md',
  'docs/ARCHITECTURE.md',
  'docs/CORE_CONTRACT.md',
  'docs/MULTITENANCY_CONTRACT.md',
  'docs/SECURITY.md',
  'docs/OBSERVABILITY.md',
  'docs/WHATSAPP_EVENT_CONTRACT.md',
  'docs/DOCUMENTS_CONTRACT.md',
  'docs/NOTIFICATIONS_CONTRACT.md',
  'docs/INFRASTRUCTURE_CONTRACT.md',
  'docs/CONNECTIONS.md',
  'docs/GIT_RELEASE_CONTRACT.md',
  'docs/SUPABASE_CONTRACT.md',
  'docs/EVOLUTION_CONTRACT.md',
  'docs/CURRENT_RUNTIME_BASELINE.md',
  'docs/DEPLOYMENT_PROTOCOL.md',
  'docs/DEPLOYMENT_MANIFEST_TEMPLATE.md',
  'docs/DOMAIN_MODEL_V1.md',
  'docs/API_CONTRACT_V1.md',
  'docs/SESSION_STATE.md',
  'docs/ROADMAP.md',
  'docs/CHANGELOG.md',
  'docs/BACKLOG.md',
  'docs/ERROR_REGISTRY.md',
  'docs/TASKS/README.md',
  'docs/TASKS/TEMPLATE.md',
  'docs/biblioteca/README.md',
  'docs/evidencias/README.md',
  'docs/generated/README.md',
  'docs/historico/README.md',
  '.agents/SKILLS.md',
  'core/README.md',
  'frontend/README.md',
];

const moduleSections = [
  'Responsabilidad',
  'Fuente/decisión',
  'Owner',
  'Permisos',
  'Contrato de entrada',
  'Contrato de salida',
  'Persistencia',
  'Auditoría',
  'Side effects',
  'Workers',
  'Tests',
  'Evidencia',
  'Rollback',
  'Estado',
  'Cierre documental',
];

const taskFields = [
  'id:',
  'owner:',
  'requester:',
  'estado:',
  '## objetivo',
  '## alcance_permitido',
  '## alcance_prohibido',
  '## entradas',
  '## salidas',
  '## validacion',
  '## evidencia',
];

const allowedTaskStates = new Set([
  'draft',
  'approved',
  'in_progress',
  'blocked',
  'review',
  'done',
  'superseded',
  'cancelled',
]);

const executableStates = new Set(['approved', 'in_progress', 'review']);
const textExtensions = new Set(['.md', '.json', '.mjs', '.js', '.ts', '.tsx', '.jsx', '.yml', '.yaml']);
const mojibakeMarkers = [
  String.fromCodePoint(0x00c3),
  String.fromCodePoint(0x00c2),
  String.fromCodePoint(0x00e2, 0x20ac),
  String.fromCodePoint(0x00ef, 0x00bf, 0x00bd),
  String.fromCodePoint(0xfffd),
];

function absolute(rel) {
  return path.join(root, rel);
}

function read(rel) {
  const full = absolute(rel);
  if (!fs.existsSync(full)) {
    failures.push(`${rel}: missing`);
    return '';
  }
  const bytes = fs.readFileSync(full);
  if (bytes.length === 0) failures.push(`${rel}: empty`);
  if (bytes.includes(0)) failures.push(`${rel}: contains NUL bytes`);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    failures.push(`${rel}: contains UTF-8 BOM`);
  }
  const text = bytes.toString('utf8');
  for (const marker of mojibakeMarkers) {
    if (text.includes(marker)) failures.push(`${rel}: probable mojibake marker ${marker}`);
  }
  return text;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

for (const rel of requiredDocs) read(rel);

const allTextFiles = walk(root).filter((file) => textExtensions.has(path.extname(file).toLowerCase()));
for (const full of allTextFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  read(rel);
}

const library = read('docs/biblioteca/README.md');
const modulesRoot = absolute('docs/biblioteca/modulos');
const moduleEntries = fs.readdirSync(modulesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
for (const entry of moduleEntries) {
  const rel = `docs/biblioteca/modulos/${entry.name}/README.md`;
  const text = read(rel);
  if (!library.includes(`modulos/${entry.name}/README.md`)) failures.push(`${rel}: missing from library index`);
  for (const section of moduleSections) {
    if (!text.includes(`## ${section}`)) failures.push(`${rel}: missing section ${section}`);
  }
}

for (const group of ['capas', 'superficies']) {
  const groupRoot = absolute(`docs/biblioteca/${group}`);
  const entries = walk(groupRoot).filter((file) => path.extname(file) === '.md');
  for (const full of entries) {
    const relFromGroup = path.relative(groupRoot, full).replaceAll('\\', '/');
    if (!library.includes(`${group}/${relFromGroup}`)) {
      failures.push(`docs/biblioteca/${group}/${relFromGroup}: missing from library index`);
    }
  }
}

const tasksRoot = absolute('docs/TASKS');
const taskFiles = fs.readdirSync(tasksRoot).filter((name) => /^TASK-\d{8}-\d{3}-.+\.md$/u.test(name));
const taskIndex = read('docs/TASKS/README.md');
const executable = [];
for (const name of taskFiles) {
  const rel = `docs/TASKS/${name}`;
  const text = read(rel);
  for (const field of taskFields) {
    if (!text.includes(field)) failures.push(`${rel}: missing task field ${field}`);
  }
  const id = text.match(/^id:\s*(TASK-\d{8}-\d{3})$/mu)?.[1];
  const state = text.match(/^estado:\s*([a-z_]+)$/mu)?.[1];
  if (!id || !name.startsWith(id)) failures.push(`${rel}: id does not match filename`);
  if (!state || !allowedTaskStates.has(state)) failures.push(`${rel}: invalid state ${state ?? '<missing>'}`);
  if (id && !taskIndex.includes(`\`${id}\``)) failures.push(`${rel}: missing from task index`);
  if (id && state && executableStates.has(state)) executable.push({ id, state });
}
if (executable.length > 1) failures.push(`more than one executable task: ${executable.map((item) => item.id).join(', ')}`);

const session = read('docs/SESSION_STATE.md');
const sessionLines = session.split(/\r?\n/u).length;
if (sessionLines > 250) failures.push(`docs/SESSION_STATE.md: too long (${sessionLines} lines, max 250)`);
if (executable.length === 1) {
  const current = executable[0];
  if (!session.includes(`\`${current.id}\`: \`${current.state}\``)) {
    failures.push(`docs/SESSION_STATE.md: executable task ${current.id} ${current.state} not declared`);
  }
}

const markdownFiles = allTextFiles.filter((file) => path.extname(file).toLowerCase() === '.md');
for (const full of markdownFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  const text = fs.readFileSync(full, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const target = match[1].split('#')[0].trim();
    if (!target || /^(https?:|mailto:)/iu.test(target)) continue;
    const resolved = path.resolve(path.dirname(full), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) failures.push(`${rel}: broken local link ${target}`);
  }
}

if (failures.length) {
  console.error('SPORTEX documentation validation failed:');
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SPORTEX documentation validation passed: ${requiredDocs.length} required docs, ${moduleEntries.length} modules, ${taskFiles.length} tasks.`);
