import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  contextDocuments,
  estimateTokens,
  inferValidationProfile,
  npmValidateInvocation,
  parseWorkflowArgs,
  parseTaskText,
  resolveValidationProfile,
  validateClosure,
  validateProject,
} from '../sportex-workflow.mjs';

const temporaryRoots = [];

test.afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function write(root, relative, content = 'fixture\n') {
  const target = path.join(root, ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function fixture() {
  const container = fs.mkdtempSync(path.join(os.tmpdir(), 'sportex-workflow-'));
  const root = path.join(container, 'platform');
  fs.mkdirSync(root);
  temporaryRoots.push(container);
  const taskPath = 'docs/TASKS/active/TASK-20260802-999-prueba.md';
  const evidencePath = 'docs/evidencias/TASK-20260802-999.md';
  const taskText = `# Prueba de workflow

id: TASK-20260802-999
owner: Codex
requester: Fito
estado: in_progress
lifecycle: active
work_type: documentacion
campaign: none
context_focus: documentation
development_guide_impact: required
updated_at: 2026-08-02

## objetivo
x
## alcance_permitido
x
## alcance_prohibido
x
## entradas
x
## salidas
x
## validacion
x
## evidencia
docs/evidencias/TASK-20260802-999.md
## rollback
x
## deuda_restante
x
## registro_de_avances
x
## decisiones
x
`;
  const required = [
    '../AGENTS.md', 'AGENTS.md', 'docs/INICIAL.md', 'docs/OPERADOR_PROYECTO.md',
    'docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md', 'docs/TASKS/README.md',
    'docs/SESSION_STATE.md',
    'docs/state/CAMPAIGN_STATE.json',
    'scripts/documentation/generate-documentation-views.mjs',
  ];
  for (const relative of required) write(root, relative);
  write(root, 'docs/DECISIONES.md', '## SPORTEX-DEC-999 - Prueba\n');
  write(root, taskPath, taskText);
  write(root, evidencePath);
  write(root, 'docs/state/DOCUMENT_REGISTRY.json', JSON.stringify({
    schemaVersion: 1,
    contextBudgets: { idle: 10000, guidance: 10000, documentation: 10000 },
    documents: [
      { path: 'docs/INICIAL.md', owner: 'system', authority: 100, readWhen: ['always'] },
      { path: 'docs/SESSION_STATE.md', owner: 'system', authority: 100, readWhen: ['always'] },
      { path: 'docs/DECISIONES.md', owner: 'system', authority: 90, readWhen: ['documentation'] },
    ],
  }));
  const state = {
    schemaVersion: 2,
    project: 'SPORTEX',
    updatedAt: '2026-08-02',
    updatedBy: 'TASK-20260802-999',
    environment: 'DOCUMENTACION',
    allowedEnvironments: ['DOCUMENTACION'],
    prohibitedEnvironments: ['PILOTO_DELTA', 'PRODUCCION_COMERCIAL'],
    operatingTarget: 'PILOTO_DELTA',
    mode: 'documentation',
    objective: 'Probar.',
    scope: { allowed: ['fixture'], prohibited: ['runtime'] },
    currentTask: {
      id: 'TASK-20260802-999', title: 'Prueba de workflow', status: 'in_progress',
      path: taskPath, workType: 'documentacion', campaign: 'none', nextAction: 'Cerrar.',
    },
    activeCampaign: null,
    nextCampaign: { title: 'Campaña futura', status: 'NOT_STARTED' },
    decisions: ['Prueba.'],
    decisionRefs: ['SPORTEX-DEC-999'],
    git: { worktree: root, branch: 'fixture', remote: 'fixture', lastVerifiedAt: '2026-08-02' },
    migrations: { status: 'NONE', executed: [], pending: [] },
    tests: { status: 'PASS', lastRunAt: '2026-08-02', commands: ['npm run validate'], evidence: evidencePath },
    deployments: { status: 'NONE', records: [] },
    externalIntegrations: [{ name: 'fixture', status: 'NONE', writeAuthorized: false }],
    sensitiveData: { status: 'NONE', policy: 'No secrets.' },
    latestEvidence: { taskId: 'TASK-20260802-999', date: '2026-08-02', path: evidencePath, summary: 'PASS' },
    recentChanges: [{
      date: '2026-08-02', taskId: 'TASK-20260802-999', summary: 'Fixture.',
      documents: [taskPath], evidence: [evidencePath], decisions: ['SPORTEX-DEC-999'],
    }],
    history: { path: 'docs/historico/PROJECT_HISTORY.json', archivedChanges: 0, throughDate: null },
    blockers: [],
    risks: ['Fixture stale.'],
    nextActions: ['Cerrar fixture.'],
  };
  write(root, 'docs/historico/PROJECT_HISTORY.json', `${JSON.stringify({ schemaVersion: 1, project: 'SPORTEX', entries: [] }, null, 2)}\n`);
  write(root, 'docs/state/PROJECT_STATE.json', `${JSON.stringify(state, null, 2)}\n`);
  return { root, state, taskPath, taskText };
}

test('parsea una tarea tecnica con metadata de cierre', () => {
  const { taskText } = fixture();
  const task = parseTaskText(taskText, 'docs/TASKS/active/TASK-20260802-999-prueba.md');
  assert.equal(task.id, 'TASK-20260802-999');
  assert.equal(task.updatedAt, '2026-08-02');
  assert.equal(task.workType, 'documentacion');
});

test('acepta el TASK-ID posicional del comando npm de cierre', () => {
  const args = parseWorkflowArgs(['close', 'TASK-20260802-999']);
  assert.equal(args.action, 'close');
  assert.equal(args.task, 'TASK-20260802-999');
  assert.equal(args.intent, 'guidance');
  assert.equal(args.profile, 'auto');
});

test('estima tokens y evita degradar un perfil sensible', () => {
  assert.equal(estimateTokens(4001), 1001);
  assert.equal(inferValidationProfile({ workType: 'documentacion' }, ['docs/INICIAL.md']), 'docs');
  assert.equal(inferValidationProfile({ workType: 'feature' }, ['docs/DECISIONES.md']), 'local');
  assert.equal(inferValidationProfile({ workType: 'documentacion' }, ['core/db/migrations/staging/001.sql']), 'pilot-release');
  assert.throws(() => resolveValidationProfile('docs', 'pilot-release'), /no puede degradar/u);
  assert.equal(resolveValidationProfile('local', 'docs'), 'local');
});

test('ejecuta npm mediante cmd.exe en Windows y directamente en otros sistemas', () => {
  assert.match(npmValidateInvocation('win32').file.toLowerCase(), /cmd\.exe$/u);
  assert.equal(npmValidateInvocation('win32').args.at(-1), 'npm.cmd run validate');
  assert.deepEqual(npmValidateInvocation('linux'), { file: 'npm', args: ['run', 'validate'] });
});

test('valida estado canonico, tarea activa y evidencia sin depender de Git', () => {
  const { root } = fixture();
  const result = validateProject(root, { checkGenerated: false, checkGit: false });
  assert.deepEqual(result.failures, []);
  assert.equal(result.tasks.length, 1);
});

test('acepta una campaña activa sin inventar una campaña siguiente', () => {
  const { root, state, taskPath, taskText } = fixture();
  const campaignId = 'CAMP-20260803-001';
  write(root, taskPath, taskText.replace('campaign: none', `campaign: ${campaignId}`));
  state.activeCampaign = {
    id: campaignId,
    title: 'SPORTEX - Sistema Comercial Asistido de Delta',
    status: 'ACTIVE',
  };
  state.nextCampaign = null;
  state.currentTask.campaign = campaignId;
  write(root, 'docs/state/PROJECT_STATE.json', `${JSON.stringify(state, null, 2)}\n`);

  const result = validateProject(root, { checkGenerated: false, checkGit: false });
  assert.deepEqual(result.failures, []);
});

test('router carga la tarea material pero guidance permanece read-only', () => {
  const { root, state, taskPath } = fixture();
  assert(contextDocuments(root, state, 'documentation').documents.some((doc) => doc.path === taskPath));
  assert(!contextDocuments(root, state, 'guidance').documents.some((doc) => doc.path === taskPath));
});

test('cierre exige pruebas, evidencia, avance, decisiones y pendientes', () => {
  const { root, state, taskText, taskPath } = fixture();
  const task = parseTaskText(taskText, taskPath);
  assert.deepEqual(validateClosure(state, task, root), []);
  const invalid = structuredClone(state);
  invalid.tests.status = 'PENDING';
  assert(validateClosure(invalid, task, root).some((failure) => failure.includes('npm run validate')));
});

test('una sola regeneracion deja las vistas idempotentes aunque cambie SESSION_STATE', () => {
  const { root } = fixture();
  const source = path.join(process.cwd(), 'scripts', 'documentation', 'generate-documentation-views.mjs');
  write(root, 'scripts/documentation/generate-documentation-views.mjs', fs.readFileSync(source, 'utf8'));
  execFileSync(process.execPath, [path.join(root, 'scripts', 'documentation', 'generate-documentation-views.mjs')], { cwd: root });
  const first = fs.readFileSync(path.join(root, 'docs', 'generated', 'CURRENT_CONTEXT.md'), 'utf8');
  execFileSync(process.execPath, [path.join(root, 'scripts', 'documentation', 'generate-documentation-views.mjs'), '--check'], { cwd: root });
  const second = fs.readFileSync(path.join(root, 'docs', 'generated', 'CURRENT_CONTEXT.md'), 'utf8');
  assert.equal(second, first);
});
