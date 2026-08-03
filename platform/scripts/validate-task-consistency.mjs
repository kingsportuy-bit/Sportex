#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv.find((arg) => arg.startsWith('--root='))?.split('=')[1];
const root = path.resolve(rootArg || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const failures = [];
const lifecycleStatus = {
  active: new Set(['approved', 'in_progress']),
  queued: new Set(['draft', 'blocked', 'review']),
  closed: new Set(['done']),
};
const workTypes = new Set(['fix', 'feature', 'operacion', 'documentacion']);
const guideImpact = new Set(['required', 'none']);
const requiredSections = ['objetivo','alcance_permitido','alcance_prohibido','entradas','salidas','validacion','evidencia','rollback','deuda_restante'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
function rel(file) { return path.relative(root, file).split(path.sep).join('/'); }
function field(text, name) { return text.match(new RegExp(`^${name}:\\s*([^\\r\\n]+)$`, 'imu'))?.[1]?.trim() ?? ''; }

const taskRoot = path.join(root, 'docs', 'TASKS');
const files = walk(taskRoot).filter((file) => /^TASK-\d{8}-\d{3}-.+\.md$/u.test(path.basename(file)));
const tasks = [];
const ids = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const task = {
    id: field(text, 'id'),
    status: field(text, 'estado'),
    lifecycle: field(text, 'lifecycle'),
    workType: field(text, 'work_type'),
    campaign: field(text, 'campaign'),
    focus: field(text, 'context_focus'),
    guideImpact: field(text, 'development_guide_impact'),
    path: rel(file),
  };
  tasks.push(task);
  for (const key of ['id','estado','lifecycle','work_type','campaign','context_focus','development_guide_impact']) {
    if (!field(text, key)) failures.push(`${task.path}: missing ${key}`);
  }
  for (const section of requiredSections) {
    if (!new RegExp(`^## ${section}$`, 'imu').test(text)) failures.push(`${task.path}: missing section ${section}`);
  }
  if (!task.id || !path.basename(file).startsWith(task.id)) failures.push(`${task.path}: id does not match filename`);
  if (ids.has(task.id)) failures.push(`${task.path}: duplicate id also in ${ids.get(task.id)}`);
  ids.set(task.id, task.path);
  const pathLifecycle = task.path.includes('/active/') ? 'active' : task.path.includes('/queued/') ? 'queued' : task.path.includes('/closed/') ? 'closed' : 'invalid';
  if (pathLifecycle === 'invalid') failures.push(`${task.path}: task must live in active, queued or closed`);
  if (task.lifecycle !== pathLifecycle) failures.push(`${task.path}: lifecycle ${task.lifecycle} does not match path ${pathLifecycle}`);
  if (!lifecycleStatus[pathLifecycle]?.has(task.status)) failures.push(`${task.path}: status ${task.status} invalid for ${pathLifecycle}`);
  if (!workTypes.has(task.workType)) failures.push(`${task.path}: invalid work_type ${task.workType}`);
  if (!guideImpact.has(task.guideImpact)) failures.push(`${task.path}: invalid development_guide_impact ${task.guideImpact}`);
  if (pathLifecycle === 'active') {
    if (!field(text, 'updated_at')) failures.push(`${task.path}: active task missing updated_at`);
    for (const section of ['registro_de_avances', 'decisiones']) {
      if (!new RegExp(`^## ${section}$`, 'imu').test(text)) failures.push(`${task.path}: active task missing section ${section}`);
    }
  }
}

const active = tasks.filter((task) => task.lifecycle === 'active');
if (active.length > 1) failures.push(`more than one active task: ${active.map((task) => task.id).join(', ')}`);

let state;
try { state = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'state', 'PROJECT_STATE.json'), 'utf8')); }
catch (error) { failures.push(`PROJECT_STATE invalid: ${error.message}`); }
if (state) {
  if (state.schemaVersion !== 2) failures.push('PROJECT_STATE: unsupported schemaVersion');
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(state.updatedAt || '')) failures.push('PROJECT_STATE: updatedAt must be YYYY-MM-DD');
  if (active.length === 0 && state.currentTask !== null) failures.push('PROJECT_STATE: currentTask must be null when no active task exists');
  if (active.length === 1) {
    const task = active[0];
    if (!state.currentTask || state.currentTask.id !== task.id || state.currentTask.status !== task.status || state.currentTask.path !== task.path) {
      failures.push(`PROJECT_STATE: currentTask does not match ${task.id}`);
    }
  }
}

if (failures.length) {
  console.error('SPORTEX task consistency failed:');
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`SPORTEX task consistency passed: ${tasks.length} tasks, ${active.length} active.`);
