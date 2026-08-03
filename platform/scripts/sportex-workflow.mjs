#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');
const allowedEnvironments = new Set([
  'DOCUMENTACION',
  'DESARROLLO_LOCAL',
  'PILOTO_DELTA',
  'PRODUCCION_COMERCIAL',
]);
const allowedIntents = new Set([
  'idle', 'guidance', 'documentation', 'architecture', 'feature', 'fix',
  'operation', 'incident', 'product', 'quality', 'library', 'deploy',
  'runtime', 'tasks',
]);

function normalize(value) {
  return String(value || '').replaceAll('\\', '/').replace(/\/$/u, '');
}

function absolute(root, relative) {
  return path.join(root, ...normalize(relative).split('/'));
}

function readText(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.includes(0)) throw new Error(`NUL detectado en ${file}`);
  return bytes.toString('utf8').replaceAll('\r\n', '\n');
}

function readJson(file) {
  try {
    return JSON.parse(readText(file));
  } catch (error) {
    throw new Error(`${file}: JSON invalido: ${error.message}`);
  }
}

function field(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return text.match(new RegExp(`^${escaped}:\\s*([^\\r\\n]+)$`, 'imu'))?.[1]?.trim() || '';
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

export function parseTaskText(text, relativePath = 'task.md') {
  const normalized = String(text).replaceAll('\r\n', '\n');
  const task = {
    id: field(normalized, 'id'),
    status: field(normalized, 'estado'),
    lifecycle: field(normalized, 'lifecycle'),
    workType: field(normalized, 'work_type'),
    campaign: field(normalized, 'campaign'),
    focus: field(normalized, 'context_focus'),
    guideImpact: field(normalized, 'development_guide_impact'),
    updatedAt: field(normalized, 'updated_at'),
    title: normalized.match(/^#\s+(.+)$/mu)?.[1]?.trim() || path.basename(relativePath),
    path: normalize(relativePath),
    text: normalized,
  };
  if (!/^TASK-\d{8}-\d{3}$/u.test(task.id)) throw new Error(`${relativePath}: id invalido`);
  return task;
}

export function collectTasks(root) {
  return walk(absolute(root, 'docs/TASKS'))
    .filter((file) => /^TASK-\d{8}-\d{3}-.+\.md$/u.test(path.basename(file)))
    .map((file) => parseTaskText(readText(file), normalize(path.relative(root, file))))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function validatePath(root, relative, label, failures) {
  const clean = normalize(String(relative || '').split('#')[0]);
  if (!clean || path.isAbsolute(clean) || clean.startsWith('../')) {
    failures.push(`${label}: ruta no permitida ${relative || '<vacia>'}`);
  } else if (!fs.existsSync(absolute(root, clean))) {
    failures.push(`${label}: no existe ${clean}`);
  }
}

function requireArray(value, label, failures, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) failures.push(`${label}: lista ausente o vacia`);
}

function runNode(root, relative, args = []) {
  return execFileSync(process.execPath, [absolute(root, relative), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function git(root, ...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function contextDocuments(root, state, intent) {
  const registry = readJson(absolute(root, 'docs/state/DOCUMENT_REGISTRY.json'));
  const selected = registry.documents
    .filter((doc) => doc.readWhen.includes('always') || doc.readWhen.includes(intent))
    .sort((a, b) => b.authority - a.authority || a.path.localeCompare(b.path));
  if (intent !== 'guidance' && state.currentTask?.path) {
    selected.push({ path: state.currentTask.path, owner: 'active-task', authority: 100 });
  }
  const unique = [...new Map(selected.map((doc) => [doc.path, doc])).values()];
  const budget = registry.contextBudgets[intent] ?? registry.contextBudgets.idle;
  const chars = unique.reduce((total, doc) => {
    const file = absolute(root, doc.path);
    return total + (fs.existsSync(file) ? readText(file).length : 0);
  }, 0);
  if (chars > budget) throw new Error(`presupuesto de contexto excedido para ${intent}: ${chars}/${budget}`);
  return { documents: unique, chars, budget };
}

export function validateProject(root, { checkGenerated = true, checkGit = true } = {}) {
  const failures = [];
  const required = [
    '../AGENTS.md', 'AGENTS.md', 'docs/INICIAL.md', 'docs/OPERADOR_PROYECTO.md',
    'docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md', 'docs/DECISIONES.md',
    'docs/state/PROJECT_STATE.json', 'docs/state/DOCUMENT_REGISTRY.json',
    'docs/state/CAMPAIGN_STATE.json', 'docs/TASKS/README.md',
    'scripts/documentation/generate-documentation-views.mjs',
  ];
  for (const relative of required) {
    if (!fs.existsSync(absolute(root, relative))) failures.push(`falta ${relative}`);
  }
  if (failures.length) return { failures, state: null, tasks: [] };

  let state;
  let tasks;
  try {
    state = readJson(absolute(root, 'docs/state/PROJECT_STATE.json'));
    tasks = collectTasks(root);
  } catch (error) {
    return { failures: [error.message], state: null, tasks: [] };
  }

  if (state.schemaVersion !== 2 || state.project !== 'SPORTEX') failures.push('PROJECT_STATE: identidad o schemaVersion invalidos');
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/u.test(state.updatedAt || '')) failures.push('PROJECT_STATE.updatedAt invalido');
  if (!state.updatedBy) failures.push('PROJECT_STATE.updatedBy ausente');
  if (!allowedEnvironments.has(state.environment)) failures.push('PROJECT_STATE.environment invalido');
  if (!allowedIntents.has(state.mode)) failures.push('PROJECT_STATE.mode invalido');
  if (!state.objective) failures.push('PROJECT_STATE.objective ausente');
  requireArray(state.allowedEnvironments, 'PROJECT_STATE.allowedEnvironments', failures);
  if (!state.allowedEnvironments?.includes(state.environment)) failures.push('PROJECT_STATE.environment no esta permitido por allowedEnvironments');
  requireArray(state.prohibitedEnvironments, 'PROJECT_STATE.prohibitedEnvironments', failures);
  requireArray(state.scope?.allowed, 'PROJECT_STATE.scope.allowed', failures);
  requireArray(state.scope?.prohibited, 'PROJECT_STATE.scope.prohibited', failures);
  requireArray(state.risks, 'PROJECT_STATE.risks', failures);
  requireArray(state.blockers, 'PROJECT_STATE.blockers', failures, { allowEmpty: true });
  requireArray(state.nextActions, 'PROJECT_STATE.nextActions', failures);
  requireArray(state.decisionRefs, 'PROJECT_STATE.decisionRefs', failures);
  requireArray(state.recentChanges, 'PROJECT_STATE.recentChanges', failures);

  const active = tasks.filter((task) => task.lifecycle === 'active');
  if (active.length > 1) failures.push(`hay ${active.length} tareas activas; maximo 1`);
  if (active.length === 0 && state.currentTask !== null) failures.push('PROJECT_STATE.currentTask debe ser null sin tarea activa');
  if (active.length === 1) {
    const task = active[0];
    for (const key of ['id', 'status', 'path']) {
      const stateKey = key === 'status' ? 'status' : key;
      if (!state.currentTask || normalize(state.currentTask[stateKey]) !== normalize(task[key])) {
        failures.push(`PROJECT_STATE.currentTask.${stateKey} no coincide con ${task.id}`);
      }
    }
    if (state.currentTask?.title !== task.title || state.currentTask?.workType !== task.workType || !state.currentTask?.nextAction) {
      failures.push(`PROJECT_STATE.currentTask incompleta para ${task.id}`);
    }
    if (state.currentTask?.campaign !== task.campaign) failures.push(`PROJECT_STATE.currentTask.campaign no coincide con ${task.id}`);
    if (state.activeCampaign === null && task.campaign !== 'none') failures.push(`${task.id}: declara campaña ${task.campaign} pero no hay campaña activa`);
  }

  if (state.activeCampaign !== null) {
    if (!state.activeCampaign?.id || !state.activeCampaign?.title || state.activeCampaign?.status !== 'ACTIVE') {
      failures.push('PROJECT_STATE.activeCampaign invalida');
    }
    if (state.currentTask && state.currentTask.campaign !== state.activeCampaign.id) {
      failures.push('PROJECT_STATE: tarea y campaña activas no coinciden');
    }
  }
  if (state.nextCampaign !== null
      && (!state.nextCampaign?.title || state.nextCampaign?.status !== 'NOT_STARTED')) {
    failures.push('PROJECT_STATE.nextCampaign debe ser null o identificar una campaña no iniciada');
  }

  for (const key of ['worktree', 'branch', 'remote', 'lastVerifiedAt']) {
    if (!state.git?.[key]) failures.push(`PROJECT_STATE.git.${key} ausente`);
  }
  if (!state.migrations?.status || !Array.isArray(state.migrations.executed) || !Array.isArray(state.migrations.pending)) {
    failures.push('PROJECT_STATE.migrations incompleto');
  }
  if (!state.tests?.status || !state.tests?.lastRunAt || !Array.isArray(state.tests.commands) || !state.tests.evidence) {
    failures.push('PROJECT_STATE.tests incompleto');
  } else {
    validatePath(root, state.tests.evidence, 'PROJECT_STATE.tests.evidence', failures);
  }
  if (!state.deployments?.status || !Array.isArray(state.deployments.records)) failures.push('PROJECT_STATE.deployments incompleto');
  if (!Array.isArray(state.externalIntegrations) || state.externalIntegrations.length === 0) {
    failures.push('PROJECT_STATE.externalIntegrations ausente o vacio');
  } else {
    for (const integration of state.externalIntegrations) {
      if (!integration.name || !integration.status || typeof integration.writeAuthorized !== 'boolean') {
        failures.push('PROJECT_STATE.externalIntegrations contiene una entrada incompleta');
      }
    }
  }
  if (!state.sensitiveData?.status || !state.sensitiveData?.policy) failures.push('PROJECT_STATE.sensitiveData incompleto');
  if (!state.latestEvidence?.taskId || !state.latestEvidence?.path || !state.latestEvidence?.summary) {
    failures.push('PROJECT_STATE.latestEvidence incompleta');
  } else {
    validatePath(root, state.latestEvidence.path, 'PROJECT_STATE.latestEvidence.path', failures);
  }

  const decisions = readText(absolute(root, 'docs/DECISIONES.md'));
  for (const id of state.decisionRefs || []) {
    if (!decisions.includes(`## ${id} `)) failures.push(`PROJECT_STATE.decisionRefs: no existe ${id}`);
  }
  for (const change of state.recentChanges || []) {
    if (!change.date || !change.taskId || !change.summary) failures.push('PROJECT_STATE.recentChanges contiene una entrada incompleta');
    requireArray(change.documents, `recentChanges ${change.taskId} documents`, failures);
    requireArray(change.evidence, `recentChanges ${change.taskId} evidence`, failures);
    requireArray(change.decisions, `recentChanges ${change.taskId} decisions`, failures);
    for (const relative of [...(change.documents || []), ...(change.evidence || [])]) {
      validatePath(root, relative, `recentChanges ${change.taskId}`, failures);
    }
  }

  if (checkGit && state.git) {
    try {
      const actualWorktree = normalize(git(root, 'rev-parse', '--show-toplevel')).toLowerCase();
      const expectedWorktree = normalize(state.git.worktree).toLowerCase();
      const actualBranch = git(root, 'branch', '--show-current');
      if (actualWorktree !== expectedWorktree) failures.push(`Git worktree actual ${actualWorktree} no coincide con ${expectedWorktree}`);
      if (actualBranch !== state.git.branch) failures.push(`Git branch actual ${actualBranch} no coincide con ${state.git.branch}`);
    } catch (error) {
      failures.push(`Git no verificable: ${error.message}`);
    }
  }

  if (checkGenerated && failures.length === 0) {
    try {
      runNode(root, 'scripts/documentation/generate-documentation-views.mjs', ['--check']);
    } catch (error) {
      failures.push(`vistas generadas: ${String(error.stderr || error.stdout || error.message).trim()}`);
    }
  }

  return { failures: [...new Set(failures)], state, tasks };
}

export function validateClosure(state, task, root) {
  const failures = [];
  const latest = state.recentChanges?.[0];
  if (state.updatedBy !== task.id) failures.push(`PROJECT_STATE.updatedBy debe ser ${task.id}`);
  if (!task.updatedAt || !state.updatedAt.startsWith(task.updatedAt)) failures.push(`${task.id}: updated_at no coincide con PROJECT_STATE.updatedAt`);
  if (!latest || latest.taskId !== task.id) failures.push(`recentChanges[0] debe registrar ${task.id}`);
  if (latest && latest.date !== task.updatedAt) failures.push(`${task.id}: fecha de recentChanges no coincide con updated_at`);
  if (state.latestEvidence?.taskId !== task.id) failures.push(`latestEvidence debe corresponder a ${task.id}`);
  if (state.latestEvidence?.path) validatePath(root, state.latestEvidence.path, 'latestEvidence', failures);
  if (!state.tests?.commands?.includes('npm run validate') || state.tests.status !== 'PASS') {
    failures.push('PROJECT_STATE.tests debe registrar npm run validate en PASS');
  }
  if (!state.nextActions?.length) failures.push('PROJECT_STATE.nextActions debe registrar pendientes o proxima accion');
  for (const section of ['## registro_de_avances', '## decisiones', '## deuda_restante']) {
    if (!task.text.includes(section)) failures.push(`${task.id}: falta ${section}`);
  }
  if (!task.text.includes(state.latestEvidence?.path || '<sin-evidencia>')) {
    failures.push(`${task.id}: la evidencia canonica no esta referenciada en la tarea`);
  }
  return failures;
}

export function npmValidateInvocation(platform = process.platform) {
  if (platform === 'win32') {
    return {
      file: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd run validate'],
    };
  }
  return { file: 'npm', args: ['run', 'validate'] };
}

function printFailures(failures) {
  console.error('SPORTEX_WORKFLOW=FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}

export function parseWorkflowArgs(argv) {
  const positional = argv.filter((value) => !value.startsWith('--'));
  const action = String(positional[0] || 'context').toLowerCase();
  return {
    action,
    intent: argv.find((value) => value.startsWith('--intent='))?.slice(9)
      || (action === 'context' ? positional[1] : null)
      || 'guidance',
    task: argv.find((value) => value.startsWith('--task='))?.slice(7)
      || (action === 'close' ? positional[1] : null),
    root: path.resolve(argv.find((value) => value.startsWith('--root='))?.slice(7) || defaultRoot),
  };
}

function main() {
  const args = parseWorkflowArgs(process.argv.slice(2));
  if (!allowedIntents.has(args.intent)) return printFailures([`intencion desconocida: ${args.intent}`]);

  if (args.action === 'sync') {
    const before = validateProject(args.root, { checkGenerated: false, checkGit: true });
    if (before.failures.length) return printFailures(before.failures);
    try { runNode(args.root, 'scripts/documentation/generate-documentation-views.mjs'); }
    catch (error) { return printFailures([String(error.stderr || error.stdout || error.message).trim()]); }
    const after = validateProject(args.root, { checkGenerated: true, checkGit: true });
    if (after.failures.length) return printFailures(after.failures);
    console.log('SPORTEX_SYNC=PASS');
    return;
  }

  if (args.action === 'context' || args.action === 'check') {
    const result = validateProject(args.root, { checkGenerated: true, checkGit: true });
    if (result.failures.length) return printFailures(result.failures);
    if (args.action === 'check') {
      console.log('SPORTEX_CHECK=PASS');
      console.log(`ACTIVE_CAMPAIGN=${result.state.activeCampaign?.id || 'none'}`);
      console.log(`ACTIVE_TASK=${result.state.currentTask?.id || 'none'}`);
      console.log(`NEXT_ACTION=${result.state.nextActions[0]}`);
      return;
    }
    let selected;
    try { selected = contextDocuments(args.root, result.state, args.intent); }
    catch (error) { return printFailures([error.message]); }
    console.log('SPORTEX_CONTEXT=PASS');
    console.log(`INTENT=${args.intent}`);
    console.log(`ACTIVE_CAMPAIGN=${result.state.activeCampaign?.id || 'none'}`);
    console.log(`ACTIVE_TASK=${result.state.currentTask?.id || 'none'}`);
    console.log(`OBJECTIVE=${result.state.objective}`);
    console.log(`SCOPE_ALLOWED=${result.state.scope.allowed.join(' | ')}`);
    console.log(`SCOPE_PROHIBITED=${result.state.scope.prohibited.join(' | ')}`);
    console.log(`ENVIRONMENT=${result.state.environment}`);
    console.log(`ALLOWED_ENVIRONMENTS=${result.state.allowedEnvironments.join(',')}`);
    console.log(`WORKTREE=${result.state.git.worktree}`);
    console.log(`BRANCH=${result.state.git.branch}`);
    console.log(`RISKS=${result.state.risks.join(' | ')}`);
    console.log(`NEXT_ACTION=${result.state.nextActions[0]}`);
    console.log(`CONTEXT_BUDGET=${selected.chars}/${selected.budget}`);
    console.log('READ:');
    for (const document of selected.documents) console.log(`- ${document.path}`);
    return;
  }

  if (args.action === 'close') {
    if (!args.task) return printFailures(['close requiere --task=TASK-AAAAMMDD-NNN']);
    const before = validateProject(args.root, { checkGenerated: false, checkGit: true });
    if (before.failures.length) return printFailures(before.failures);
    const task = before.tasks.find((item) => item.id === args.task);
    if (!task) return printFailures([`no existe ${args.task}`]);
    const closureFailures = validateClosure(before.state, task, args.root);
    if (closureFailures.length) return printFailures(closureFailures);
    try {
      runNode(args.root, 'scripts/documentation/generate-documentation-views.mjs');
      const npm = npmValidateInvocation();
      execFileSync(npm.file, npm.args, { cwd: args.root, stdio: 'inherit' });
      git(args.root, 'diff', '--check');
    } catch (error) {
      return printFailures([String(error.stderr || error.stdout || error.message).trim()]);
    }
    const after = validateProject(args.root, { checkGenerated: true, checkGit: true });
    if (after.failures.length) return printFailures(after.failures);
    console.log('SPORTEX_CLOSE=PASS');
    console.log(`RECORDED_TASK=${args.task}`);
    console.log(`ACTIVE_CAMPAIGN=${after.state.activeCampaign?.id || 'none'}`);
    console.log(`ACTIVE_TASK=${after.state.currentTask?.id || 'none'}`);
    console.log(`NEXT_ACTION=${after.state.nextActions[0]}`);
    return;
  }

  printFailures([`accion desconocida: ${args.action}. Usar context, sync, check o close.`]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) main();
