#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profileArg = process.argv.find((arg) => arg.startsWith('--profile='));
const profile = profileArg?.split('=')[1] || 'full';
if (!['fast', 'full', 'release'].includes(profile)) throw new Error(`Unknown profile ${profile}`);
const failures = [];

const requiredDocs = [
  '../AGENTS.md', '.gitattributes', '.editorconfig', 'AGENTS.md', 'README.md',
  'docs/INICIAL.md', 'docs/OPERADOR_PROYECTO.md',
  'docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md',
  'docs/DECISIONES.md',
  'docs/DOCUMENTATION_ARCHITECTURE.md', 'docs/CORE_DOCUMENTATION_SYSTEM.md',
  'docs/MODOS_DE_TRABAJO.md', 'docs/CODEX_WORKFLOW.md',
  'docs/DELTA_PROJECT_INTERFACE.md', 'docs/ENVIRONMENTS_CONTRACT.md',
  'docs/RELEASE_GOVERNANCE_CONTRACT.md', 'docs/GIT_RELEASE_CONTRACT.md',
  'docs/WORKTREE_LIFECYCLE_CONTRACT.md',
  'docs/DEPLOYMENT_PROTOCOL.md', 'docs/DEPLOYMENT_MANIFEST_TEMPLATE.md',
  'docs/BIBLIA_SPORTEX.md', 'docs/BUSINESS.md', 'docs/ARCHITECTURE.md',
  'docs/CORE_CONTRACT.md', 'docs/MULTITENANCY_CONTRACT.md', 'docs/SECURITY.md',
  'docs/OBSERVABILITY.md', 'docs/WHATSAPP_EVENT_CONTRACT.md',
  'docs/EVOLUTION_CONTRACT.md', 'docs/NOTIFICATIONS_CONTRACT.md',
  'docs/DOCUMENTS_CONTRACT.md', 'docs/SUPABASE_CONTRACT.md',
  'docs/INFRASTRUCTURE_CONTRACT.md', 'docs/CONNECTIONS.md',
  'docs/CURRENT_RUNTIME_BASELINE.md', 'docs/DOMAIN_MODEL_V1.md',
  'docs/API_CONTRACT_V1.md', 'docs/SESSION_STATE.md',
  'docs/state/PROJECT_STATE.json', 'docs/state/DOCUMENT_REGISTRY.json',
  'docs/state/CAMPAIGN_STATE.json', 'docs/state/WORKTREE_CLASSIFICATIONS.json', 'docs/TASKS/README.md',
  'docs/TASKS/TEMPLATE.md', 'docs/TASKS/INDEX.md',
  'docs/generated/CURRENT_CONTEXT.md', 'docs/biblioteca/README.md',
  'docs/biblioteca/MODULE_TEMPLATE.md',
  'docs/biblioteca/MODULE_COMMON_CONTRACT.md', 'docs/evidencias/README.md',
  'docs/historico/README.md', 'docs/historico/PROJECT_HISTORY.json',
  'docs/ERROR_REGISTRY.md',
  'scripts/codex-scan-text-nul.ps1',
  'docs/errors/index.json',
  'docs/errors/entries/SPX-ERR-20260719-001-gate-capacidad-vps.md',
  'docs/errors/entries/SPX-ERR-20260801-001-guidance-mutaba-vista.md',
  'scripts/codex-preflight-errors.ps1', 'scripts/codex-register-error.ps1',
  'scripts/library-context.mjs', 'scripts/error-search.mjs',
  'scripts/documentation/compact-project-history.mjs',
  'scripts/documentation/generate-documentation-views.mjs',
  'scripts/sportex-workflow.mjs',
  'scripts/sportex-workflow.ps1',
  'scripts/tests/sportex-workflow.test.mjs',
  'scripts/validate-task-consistency.mjs',
  'scripts/validate-development-guide-sync.mjs',
  'scripts/task-worktree-doctor.mjs',
  'scripts/worktree-close.mjs', 'scripts/tests/worktree-close.test.mjs',
  'scripts/release-governance-guard.ps1',
  'scripts/new-release-bundle.ps1',
];
const registryRequired = requiredDocs.filter((file) => file.startsWith('docs/')
  && !file.startsWith('docs/state/') && !file.startsWith('docs/generated/')
  && !file.startsWith('docs/errors/')
  && !file.startsWith('docs/TASKS/') && !file.endsWith('MODULE_TEMPLATE.md'));
const moduleSections = [
  'Responsabilidad', 'Fuente/decisión', 'Owner', 'Permisos',
  'Contrato de entrada', 'Contrato de salida', 'Persistencia', 'Auditoría',
  'Side effects', 'Workers', 'Tests', 'Evidencia', 'Rollback', 'Estado',
  'Cierre documental',
];
const textExtensions = new Set(['.md','.json','.mjs','.js','.ts','.tsx','.jsx','.yml','.yaml','.ps1','.sql','.html','.css']);
const binaryExtensions = new Set(['.png','.jpg','.jpeg','.gif','.webp','.ico','.pdf','.zip','.gz','.mp3','.mp4','.woff','.woff2']);
const excluded = /[\\/](node_modules|dist|dist-test|\.git|\.npm-cache|\.sportex-local|coverage|\.next)[\\/]/u;
const mojibake = /\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2[\u0080-\u00bf]|\ufffd/u;

function full(relative) { return path.join(root, ...relative.split('/')); }
function rel(file) { return path.relative(root, file).split(path.sep).join('/'); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules','dist','dist-test','.git','.npm-cache','.sportex-local','coverage','.next'].includes(entry.name)) return walk(target);
    return entry.isDirectory() ? [] : [target];
  });
}
function read(relative) {
  const file = full(relative);
  if (!fs.existsSync(file)) { failures.push(`${relative}: missing`); return ''; }
  const bytes = fs.readFileSync(file);
  if (!bytes.length) failures.push(`${relative}: empty`);
  if (bytes.includes(0) && !binaryExtensions.has(path.extname(file).toLowerCase())) failures.push(`${relative}: contains NUL bytes`);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) failures.push(`${relative}: contains UTF-8 BOM`);
  const text = bytes.toString('utf8');
  if (!relative.startsWith('docs/historico/') && mojibake.test(text)) failures.push(`${relative}: probable mojibake`);
  return text;
}
function run(relative, args = []) {
  try { return execFileSync(process.execPath, [full(relative), ...args], { cwd: root, encoding: 'utf8' }); }
  catch (error) {
    failures.push(`${relative}: ${String(error.stderr || error.stdout || error.message).trim()}`);
    return '';
  }
}

for (const relative of requiredDocs) read(relative);
if (!read('../AGENTS.md').includes('platform/docs/INICIAL.md')) failures.push('../AGENTS.md: must route new work to platform');

let state;
let registry;
try { state = JSON.parse(read('docs/state/PROJECT_STATE.json')); }
catch (error) { failures.push(`PROJECT_STATE invalid JSON: ${error.message}`); }
try { registry = JSON.parse(read('docs/state/DOCUMENT_REGISTRY.json')); }
catch (error) { failures.push(`DOCUMENT_REGISTRY invalid JSON: ${error.message}`); }

if (state) {
  if (state.schemaVersion !== 2 || state.project !== 'SPORTEX') failures.push('PROJECT_STATE: invalid identity/schema');
  if (!['DOCUMENTACION','DESARROLLO_LOCAL','PILOTO_DELTA','PRODUCCION_COMERCIAL'].includes(state.environment)) failures.push('PROJECT_STATE: invalid environment');
  if (state.operatingTarget !== 'PILOTO_DELTA' && state.operatingTarget !== 'PRODUCCION_COMERCIAL') failures.push('PROJECT_STATE: invalid operatingTarget');
}
if (registry) {
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.documents)) failures.push('DOCUMENT_REGISTRY: invalid schema');
  if (!registry.contextBudgets || typeof registry.contextBudgets !== 'object') failures.push('DOCUMENT_REGISTRY: contextBudgets missing');
  const paths = new Set();
  for (const item of registry.documents || []) {
    if (!item.path || paths.has(item.path)) failures.push(`DOCUMENT_REGISTRY: duplicate/missing path ${item.path || '<missing>'}`);
    paths.add(item.path);
    if (!fs.existsSync(full(item.path))) failures.push(`DOCUMENT_REGISTRY: missing ${item.path}`);
    if (!item.owner || !Number.isInteger(item.authority) || !Array.isArray(item.readWhen)) failures.push(`DOCUMENT_REGISTRY: incomplete ${item.path}`);
  }
  for (const relative of registryRequired) {
    if (!paths.has(relative)) failures.push(`DOCUMENT_REGISTRY: unclassified required document ${relative}`);
  }
}

run('scripts/documentation/generate-documentation-views.mjs', ['--check']);
run('scripts/validate-task-consistency.mjs', [`--root=${root}`]);
run('scripts/validate-development-guide-sync.mjs', ['--self-test', `--root=${root}`]);
run('scripts/sportex-workflow.mjs', ['check', '--intent=documentation']);

const guidance = run('scripts/documentation/generate-documentation-views.mjs', ['--print-context','--intent=guidance']);
for (const expected of ['Intencion: `guidance`', 'consulta read-only', 'docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md']) {
  if (!guidance.includes(expected)) failures.push(`guidance router: missing ${expected}`);
}
if (guidance.includes('docs/TASKS/active/')) failures.push('guidance router: active task must not be loaded');
run('scripts/documentation/generate-documentation-views.mjs', ['--check']);

const session = read('docs/SESSION_STATE.md');
if (session.split(/\r?\n/u).length > 100 || session.length > 8192) failures.push('docs/SESSION_STATE.md: exceeds 100 lines or 8 KB');

const modulesRoot = full('docs/biblioteca/modulos');
const library = read('docs/biblioteca/README.md');
const modules = fs.readdirSync(modulesRoot, { withFileTypes: true }).filter((item) => item.isDirectory());
for (const module of modules) {
  const relative = `docs/biblioteca/modulos/${module.name}/README.md`;
  const text = read(relative);
  if (!library.includes(`modulos/${module.name}/README.md`)) failures.push(`${relative}: missing from library index`);
  for (const section of moduleSections) {
    if (!text.includes(`## ${section}`)) failures.push(`${relative}: missing section ${section}`);
  }
}
for (const group of ['capas','superficies']) {
  for (const file of walk(full(`docs/biblioteca/${group}`)).filter((item) => item.endsWith('.md'))) {
    const local = path.relative(full(`docs/biblioteca/${group}`), file).split(path.sep).join('/');
    if (!library.includes(`${group}/${local}`)) failures.push(`${rel(file)}: missing from library index`);
  }
}

if (profile !== 'fast') {
  const textFiles = walk(root).filter((file) => textExtensions.has(path.extname(file).toLowerCase()) && !excluded.test(file));
  for (const file of textFiles) read(rel(file));
  for (const file of textFiles.filter((item) => item.endsWith('.md'))) {
    const relative = rel(file);
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
      let target = match[1].trim().replace(/^<|>$/gu, '').split('#')[0];
      if (!target || /^(https?:|mailto:)/iu.test(target)) continue;
      try { target = decodeURIComponent(target); } catch { /* keep literal */ }
      if (!fs.existsSync(path.resolve(path.dirname(file), target))) failures.push(`${relative}: broken local link ${match[1]}`);
    }
  }
  const activeDocs = [read('docs/INICIAL.md'), read('docs/ENVIRONMENTS_CONTRACT.md'), read('docs/SESSION_STATE.md')].join('\n');
  if (/Modo:\s*`STAGING`/u.test(activeDocs)) failures.push('active governance still declares STAGING as current mode');
  if (!read('docs/DELTA_PROJECT_INTERFACE.md').includes('SPORTEX conserva')) failures.push('DELTA project interface is incomplete');
}

if (profile === 'release') {
  for (const relative of requiredDocs) {
    try { execFileSync('git', ['ls-files','--error-unmatch','--', relative], { cwd: root, stdio: 'ignore' }); }
    catch { failures.push(`${relative}: required release file is not tracked`); }
  }
  try { execFileSync('git', ['diff','--check'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { failures.push(`git diff --check: ${String(error.stdout || error.message).trim()}`); }
  const dirty = execFileSync('git', ['status','--porcelain','--','.'], { cwd: root, encoding: 'utf8' }).trim();
  if (dirty) failures.push('release profile: project worktree is not clean');
  run('scripts/validate-development-guide-sync.mjs', ['--check-changes', `--root=${root}`]);
}

if (failures.length) {
  console.error(`SPORTEX documentation validation failed (${profile}):`);
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`SPORTEX documentation validation passed (${profile}): ${requiredDocs.length} required files, ${modules.length} modules.`);
