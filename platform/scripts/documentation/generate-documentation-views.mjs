#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const printContext = args.includes('--print-context');
const explicitIntent = args.find((arg) => arg.startsWith('--intent='))?.split('=')[1];
const positionalIntent = args.find((arg) => !arg.startsWith('--'));

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

function field(text, name) {
  return text.match(new RegExp(`^${name}:\\s*([^\\r\\n]+)$`, 'imu'))?.[1]?.trim() ?? '';
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function repoPath(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function parseTasks() {
  return walk(path.join(root, 'docs', 'TASKS'))
    .filter((file) => /^TASK-\d{8}-\d{3}-.+\.md$/u.test(path.basename(file)))
    .map((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return {
        id: field(text, 'id'),
        status: field(text, 'estado'),
        lifecycle: field(text, 'lifecycle'),
        workType: field(text, 'work_type'),
        focus: field(text, 'context_focus'),
        title: text.match(/^#\s+(.+)$/mu)?.[1]?.trim() ?? path.basename(file),
        path: repoPath(file),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

const state = readJson('docs/state/PROJECT_STATE.json');
const registry = readJson('docs/state/DOCUMENT_REGISTRY.json');
const tasks = parseTasks();
const active = tasks.filter((task) => task.lifecycle === 'active');
const queued = tasks.filter((task) => task.lifecycle === 'queued');
const closed = tasks.filter((task) => task.lifecycle === 'closed');
const intent = explicitIntent || positionalIntent || state.mode || 'idle';
const budget = registry.contextBudgets[intent] ?? registry.contextBudgets.idle;

const selected = registry.documents
  .filter((doc) => doc.readWhen.includes('always') || doc.readWhen.includes(intent))
  .sort((a, b) => b.authority - a.authority || a.path.localeCompare(b.path));
if (intent !== 'guidance' && state.currentTask?.path) {
  selected.push({ path: state.currentTask.path, owner: 'active-task', authority: 100, readWhen: [intent] });
}
const uniqueSelected = [...new Map(selected.map((doc) => [doc.path, doc])).values()];

function bulletList(items, empty = '- Ninguno.') {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : empty;
}

function renderSession() {
  return `# Estado vivo SPORTEX

> GENERADO desde \`docs/state/PROJECT_STATE.json\`. No editar manualmente.

Actualizado: ${state.updatedAt}.

## Entorno de trabajo

- Entorno actual: \`${state.environment}\`.
- Entornos permitidos: \`${state.allowedEnvironments.join(', ')}\`.
- Entornos prohibidos: \`${state.prohibitedEnvironments.join(', ')}\`.
- Objetivo operativo futuro: \`${state.operatingTarget}\`.
- Intencion actual: \`${state.mode}\`.

## Git

- Worktree: \`${state.git.worktree}\`.
- Rama: \`${state.git.branch}\`.
- Remote: \`${state.git.remote}\`.
- Verificado: \`${state.git.lastVerifiedAt}\`.

## Campaña y tarea

- Campaña activa: ${state.activeCampaign ? `\`${state.activeCampaign.id}\` - ${state.activeCampaign.title}.` : 'ninguna.'}
- Proxima campaña: ${state.nextCampaign ? `\`${state.nextCampaign.status}\` - ${state.nextCampaign.title}.` : 'ninguna definida.'}
- Tarea tecnica: ${state.currentTask ? `\`${state.currentTask.id}\`: \`${state.currentTask.status}\` (${state.currentTask.path}).` : 'ninguna tarea activa.'}

## Objetivo actual

${state.objective}

## Alcance actual

- Permitido: ${state.scope.allowed.join(' | ')}
- Prohibido: ${state.scope.prohibited.join(' | ')}

## Decisiones vigentes

${bulletList(state.decisions)}

## Estado operativo registrado

- Migraciones: \`${state.migrations.status}\`; ejecutadas ${state.migrations.executed.length}; pendientes ${state.migrations.pending.length}.
- Pruebas: \`${state.tests.status}\`; ultima ejecucion \`${state.tests.lastRunAt}\`.
- Despliegues: \`${state.deployments.status}\`; registros ${state.deployments.records.length}.
- Integraciones: ${state.externalIntegrations.map((item) => `${item.name}=\`${item.status}\``).join(' | ')}
- Datos sensibles: \`${state.sensitiveData.status}\`. ${state.sensitiveData.policy}

## Ultima evidencia verificable

- Tarea: \`${state.latestEvidence.taskId}\`.
- Fecha: \`${state.latestEvidence.date}\`.
- Fuente: \`${state.latestEvidence.path}\`.
- ${state.latestEvidence.summary}

## Riesgos

${bulletList(state.risks)}

## Bloqueos

${bulletList(state.blockers)}

## Siguientes acciones

${bulletList(state.nextActions)}
`;
}

function renderTaskIndex() {
  const render = (items) => items.length
    ? items.map((task) => `- \`${task.id}\` | \`${task.status}\` | ${task.title} | ${task.path}`).join('\n')
    : '- Ninguna.';
  return `# Indice de tareas SPORTEX

> GENERADO desde las tareas y \`docs/state/PROJECT_STATE.json\`. No editar.

Actualizado: ${state.updatedAt}.

## Activa

${render(active)}

## Cola

${render(queued)}

## Cerradas

${render(closed)}
`;
}

function renderContext(potentialChars) {
  return `# Contexto actual SPORTEX

> GENERADO. No editar manualmente.

Actualizado: ${state.updatedAt}.

## Trabajo

- Intencion: \`${intent}\`.
- Entorno actual: \`${state.environment}\`.
- Entornos permitidos: \`${state.allowedEnvironments.join(', ')}\`.
- Objetivo operativo: \`${state.operatingTarget}\`.
- Campaña activa: ${state.activeCampaign ? `\`${state.activeCampaign.id}\` - ${state.activeCampaign.title}` : 'ninguna'}.
- Tarea: ${state.currentTask && intent !== 'guidance' ? `\`${state.currentTask.id}\`` : 'no cargada para esta consulta'}.
- Worktree: \`${state.git.worktree}\`.
- Rama: \`${state.git.branch}\`.
- Presupuesto potencial: ${potentialChars}/${budget} caracteres.
- Tokens estimados: ${Math.ceil(potentialChars / 4)} (aproximacion de 4 caracteres por token).
- Documentos unicos: ${uniqueSelected.length}.

## Objetivo, alcance y riesgo

- Objetivo: ${state.objective}
- Permitido: ${state.scope.allowed.join(' | ')}
- Prohibido: ${state.scope.prohibited.join(' | ')}
- Riesgos: ${state.risks.join(' | ')}
- Proxima accion: ${state.currentTask?.nextAction || state.nextActions[0]}

## Regla de uso

Leer los documentos seleccionados en orden de autoridad. \`guidance\` es una
consulta read-only: no crea tarea ni modifica el estado.

## Documentos seleccionados

${uniqueSelected.map((doc) => `- \`${doc.path}\` — owner \`${doc.owner}\`, autoridad ${doc.authority}.`).join('\n')}
`;
}

function renderErrorIndex() {
  const entries = walk(path.join(root, 'docs', 'errors', 'entries'))
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return {
        id: text.match(/^#\s+(SPX-ERR-\d{8}-\d{3})/mu)?.[1] ?? path.basename(file, '.md'),
        title: text.match(/^#\s+SPX-ERR-\d{8}-\d{3}\s+-\s+(.+)$/mu)?.[1]?.trim() ?? path.basename(file, '.md'),
        path: repoPath(file),
        searchText: text.toLowerCase(),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  return `${JSON.stringify({ schemaVersion: 1, updatedAt: state.updatedAt, entries }, null, 2)}\n`;
}

function renderCampaignState() {
  return `${JSON.stringify({
    schemaVersion: 1,
    generatedFrom: 'docs/state/PROJECT_STATE.json',
    updatedAt: state.updatedAt,
    activeCampaign: state.activeCampaign,
    nextCampaign: state.nextCampaign,
  }, null, 2)}\n`;
}

const sessionOutput = renderSession();
const potentialChars = uniqueSelected.reduce((total, doc) => {
  if (doc.path === 'docs/SESSION_STATE.md') return total + sessionOutput.length;
  const file = path.join(root, doc.path);
  return total + (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').length : 0);
}, 0);
if (potentialChars > budget) {
  throw new Error(`Context budget exceeded for ${intent}: ${potentialChars}/${budget} characters`);
}

const outputs = new Map([
  ['docs/SESSION_STATE.md', sessionOutput],
  ['docs/TASKS/INDEX.md', renderTaskIndex()],
  ['docs/generated/CURRENT_CONTEXT.md', renderContext(potentialChars)],
  ['docs/errors/index.json', renderErrorIndex()],
  ['docs/state/CAMPAIGN_STATE.json', renderCampaignState()],
]);

if (!printContext) {
  if (check) {
    for (const [relative, content] of outputs) {
      const normalized = `${content.trimEnd()}\n`;
      const target = path.join(root, relative);
      const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/gu, '\n') : '';
      if (current !== normalized) throw new Error(`${relative} is stale; run npm run generate-docs`);
    }
  } else {
    const lockPath = path.join(root, 'docs', 'state', '.sportex-workflow.lock');
    let lock;
    try {
      lock = fs.openSync(lockPath, 'wx');
    } catch {
      throw new Error('No se pudo obtener docs/state/.sportex-workflow.lock; no ejecutar sync o close en paralelo');
    }
    try {
      for (const [relative, content] of outputs) {
        const normalized = `${content.trimEnd()}\n`;
        const target = path.join(root, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, normalized, 'utf8');
      }
    } finally {
      fs.closeSync(lock);
      fs.unlinkSync(lockPath);
    }
  }
}

if (printContext) process.stdout.write(outputs.get('docs/generated/CURRENT_CONTEXT.md'));
else if (!check) console.log('SPORTEX generated views updated.');
else console.log('SPORTEX generated views are current.');
