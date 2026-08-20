#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');
const MODELS = new Set(['PILOT_ONLY', 'SEPARATED_STAGING_PRODUCTION']);
const RECONCILIATION = new Set(['NOT_REQUIRED', 'RECOVERED_RECONCILIATION_PENDING', 'RECONCILED']);
const SNAPSHOT_FIELDS = ['taskId', 'branch', 'worktree', 'head', 'candidate', 'environment', 'incidentTaskId', 'pausedAt'];

function normalized(value) {
  const result = path.resolve(String(value || '')).replaceAll('\\', '/').replace(/\/$/u, '');
  return process.platform === 'win32' ? result.toLowerCase() : result;
}

function gitContains(root, descendant, ancestor) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function validateIncidentState(state, options = {}) {
  const failures = [];
  const closure = Boolean(options.closure);
  const worktrees = options.worktrees || [];
  const contains = options.contains || (() => false);

  if (state?.schemaVersion !== 1 || state?.project !== 'SPORTEX') failures.push('incident state: identidad o schema invalidos');
  if (!MODELS.has(state?.environmentModel)) failures.push('incident state: environmentModel invalido');
  if (state?.readOnlyDiagnosisAllowed !== true) failures.push('incident state: diagnostico read-only debe permanecer permitido');
  if (!Array.isArray(state?.activeIncidents)) failures.push('incident state: activeIncidents debe ser una lista');
  if ((state?.activeIncidents?.length || 0) > 1) failures.push('incident state: solo puede existir una task incidente activa');
  if (!RECONCILIATION.has(state?.reconciliation?.status)) failures.push('incident state: reconciliation.status invalido');

  const incident = state?.activeIncidents?.[0];
  if (incident) {
    if (incident.status !== 'ACTIVE_INCIDENT') failures.push('incident state: la task incidente debe estar ACTIVE_INCIDENT');
    const paused = state.pausedTask;
    if (!paused || paused.status !== 'PAUSED_BY_INCIDENT') failures.push('incident state: falta task PAUSED_BY_INCIDENT');
    for (const field of SNAPSHOT_FIELDS) {
      if (!paused?.snapshot?.[field]) failures.push(`incident state: snapshot incompleto (${field})`);
    }
    if (paused?.snapshot?.incidentTaskId !== incident.taskId) failures.push('incident state: snapshot no referencia la task incidente activa');
    if (paused?.candidateStatus !== 'STALE_AFTER_HOTFIX') failures.push('incident state: candidato pausado debe quedar STALE_AFTER_HOTFIX');
    if (!incident.observedRuntime?.commit || !incident.observedRuntime?.digest) failures.push('incident state: hotfix sin commit/digest observado');
    if (incident.mutationAuthorized) {
      if (!incident.go?.exactScope || !incident.go?.authorizedBy || !incident.go?.authorizedAt) failures.push('incident state: mutacion sin GO exacto');
      if (!incident.rollback?.version || !incident.rollback?.procedure) failures.push('incident state: mutacion sin rollback');
      if (!incident.evidence) failures.push('incident state: mutacion sin evidencia');
    }
    if (worktrees.length) {
      const classified = worktrees.find((item) => normalized(item.path) === normalized(paused?.snapshot?.worktree));
      if (!classified || classified.classification !== 'PRESERVAR') failures.push('incident state: worktree pausado debe estar clasificado PRESERVAR');
    }
  } else if (state?.pausedTask) {
    failures.push('incident state: pausedTask sin task incidente activa');
  }

  const reconciliation = state?.reconciliation || {};
  if (reconciliation.status === 'RECOVERED_RECONCILIATION_PENDING' && closure) {
    failures.push('incident state: cierre bloqueado por RECOVERED_RECONCILIATION_PENDING');
  }
  if (reconciliation.status === 'RECONCILED') {
    if (!reconciliation.hotfixCommit) failures.push('incident state: RECONCILED sin hotfix canonico');
    if (reconciliation.localValidation?.status !== 'PASS') failures.push('incident state: RECONCILED sin revalidacion local PASS');
    for (const gate of ['taskIndexState', 'releaseVersion', 'worktrees']) {
      if (reconciliation.coherence?.[gate] !== 'PASS') failures.push(`incident state: coherencia ${gate} sin PASS`);
    }
    if (state.pausedTask?.snapshot?.branch && reconciliation.hotfixCommit
      && !contains(state.pausedTask.snapshot.branch, reconciliation.hotfixCommit)) {
      failures.push('incident state: rama pausada no contiene el hotfix');
    }
    if (state.pausedTask?.replacementCandidate && reconciliation.hotfixCommit
      && !contains(state.pausedTask.replacementCandidate, reconciliation.hotfixCommit)) {
      failures.push('incident state: candidato renovado no contiene el hotfix');
    }
  }

  if (state?.environmentModel === 'PILOT_ONLY' && reconciliation.stagingCertification) {
    failures.push('incident state: PILOT_ONLY no puede fingir certificacion STAGING');
  }
  if (state?.environmentModel === 'SEPARATED_STAGING_PRODUCTION') {
    if (state.transition?.status !== 'COMPLETED' || !state.transition?.transitionTask) {
      failures.push('incident state: modelo separado requiere task de transicion completada');
    }
    if (reconciliation.status !== 'NOT_REQUIRED'
      && (reconciliation.stagingCertification?.gate !== 'ENVIRONMENT_RECONCILIATION'
        || reconciliation.stagingCertification?.status !== 'CERTIFIED')) {
      failures.push('incident state: ENVIRONMENT_RECONCILIATION requiere STAGING certificado');
    }
  }
  if (state?.transition?.status === 'REQUIRED' && state.environmentModel !== 'PILOT_ONLY') {
    failures.push('incident state: aceptacion usable no cambia el modelo sin task de transicion');
  }
  return failures;
}

export function loadIncidentState(root = defaultRoot) {
  return JSON.parse(fs.readFileSync(path.join(root, 'docs', 'state', 'INCIDENT_RECONCILIATION_STATE.json'), 'utf8'));
}

function main() {
  const args = process.argv.slice(2);
  const root = path.resolve(args.find((arg) => arg.startsWith('--root='))?.slice(7) || defaultRoot);
  const state = loadIncidentState(root);
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'state', 'WORKTREE_CLASSIFICATIONS.json'), 'utf8'));
  const failures = validateIncidentState(state, {
    closure: args.includes('--closure'),
    worktrees: inventory.worktrees,
    contains: (descendant, ancestor) => gitContains(root, descendant, ancestor),
  });
  if (failures.length) {
    console.error('INCIDENT_RECONCILIATION=FAIL');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('INCIDENT_RECONCILIATION=PASS');
  console.log(`ENVIRONMENT_MODEL=${state.environmentModel}`);
  console.log(`RECONCILIATION=${state.reconciliation.status}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) main();
