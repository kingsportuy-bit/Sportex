import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIncidentState } from '../incident-reconciliation.mjs';

function baseline() {
  return {
    schemaVersion: 1,
    project: 'SPORTEX',
    environmentModel: 'PILOT_ONLY',
    readOnlyDiagnosisAllowed: true,
    transition: { status: 'NOT_REQUESTED', acceptanceTask: null, transitionTask: null },
    activeIncidents: [],
    pausedTask: null,
    reconciliation: { status: 'NOT_REQUIRED', hotfixCommit: null, localValidation: null, stagingCertification: null, coherence: null },
  };
}

function incidentState() {
  const state = baseline();
  state.activeIncidents = [{
    taskId: 'TASK-20260820-099', status: 'ACTIVE_INCIDENT',
    observedRuntime: { commit: 'runtime-commit', digest: 'sha256:runtime' },
    mutationAuthorized: true,
    go: { exactScope: 'replace image only', authorizedBy: 'Fito', authorizedAt: '2026-08-20T10:00:00Z' },
    rollback: { version: 'previous', procedure: 'restore immutable artifact' },
    evidence: 'docs/evidencias/incident.md',
  }];
  state.pausedTask = {
    status: 'PAUSED_BY_INCIDENT', candidateStatus: 'STALE_AFTER_HOTFIX',
    snapshot: {
      taskId: 'TASK-20260820-001', branch: 'feature', worktree: 'C:/work/feature', head: 'head',
      candidate: 'candidate-old', environment: 'PILOTO_DELTA', incidentTaskId: 'TASK-20260820-099',
      pausedAt: '2026-08-20T09:00:00Z',
    },
  };
  return state;
}

test('PILOT_ONLY permite diagnostico read-only y no exige STAGING', () => {
  assert.deepEqual(validateIncidentState(baseline(), { closure: true }), []);
});

test('preemption completa preserva worktree y deja candidato stale', () => {
  const state = incidentState();
  assert.deepEqual(validateIncidentState(state, {
    worktrees: [{ path: 'C:/work/feature', classification: 'PRESERVAR' }],
  }), []);
});

test('bloquea snapshot incompleto, worktree no preservado y candidato viejo reutilizable', () => {
  const state = incidentState();
  delete state.pausedTask.snapshot.head;
  state.pausedTask.candidateStatus = 'READY';
  const failures = validateIncidentState(state, {
    worktrees: [{ path: 'C:/work/feature', classification: 'INTEGRADO' }],
  });
  assert(failures.some((item) => item.includes('snapshot incompleto')));
  assert(failures.some((item) => item.includes('STALE_AFTER_HOTFIX')));
  assert(failures.some((item) => item.includes('PRESERVAR')));
});

test('bloquea segunda task incidente y mutacion sin GO rollback o evidencia', () => {
  const state = incidentState();
  state.activeIncidents.push({ taskId: 'TASK-20260820-098' });
  state.activeIncidents[0].go = null;
  state.activeIncidents[0].rollback = null;
  state.activeIncidents[0].evidence = null;
  const failures = validateIncidentState(state);
  assert(failures.some((item) => item.includes('solo puede existir')));
  assert(failures.some((item) => item.includes('GO exacto')));
  assert(failures.some((item) => item.includes('rollback')));
  assert(failures.some((item) => item.includes('evidencia')));
});

test('RECOVERED_RECONCILIATION_PENDING bloquea cierre', () => {
  const state = baseline();
  state.reconciliation.status = 'RECOVERED_RECONCILIATION_PENDING';
  assert(validateIncidentState(state, { closure: true }).some((item) => item.includes('cierre bloqueado')));
});

test('RECONCILED bloquea rama o candidato que no contienen hotfix', () => {
  const state = incidentState();
  state.reconciliation = {
    status: 'RECONCILED', hotfixCommit: 'hotfix', localValidation: { status: 'PASS' }, stagingCertification: null,
    coherence: { taskIndexState: 'PASS', releaseVersion: 'PASS', worktrees: 'PASS' },
  };
  state.pausedTask.replacementCandidate = 'candidate-new';
  const failures = validateIncidentState(state, { contains: () => false });
  assert(failures.some((item) => item.includes('rama pausada')));
  assert(failures.some((item) => item.includes('candidato renovado')));
});

test('aceptacion usable no crea STAGING y modelo futuro exige certificacion', () => {
  const accepted = baseline();
  accepted.transition = { status: 'REQUIRED', acceptanceTask: 'TASK-ACCEPTED', transitionTask: null };
  assert.deepEqual(validateIncidentState(accepted), []);

  const separated = baseline();
  separated.environmentModel = 'SEPARATED_STAGING_PRODUCTION';
  separated.transition = { status: 'COMPLETED', acceptanceTask: 'TASK-ACCEPTED', transitionTask: 'TASK-TRANSITION' };
  separated.reconciliation.status = 'RECONCILED';
  separated.reconciliation.hotfixCommit = 'hotfix';
  separated.reconciliation.localValidation = { status: 'PASS' };
  separated.reconciliation.coherence = { taskIndexState: 'PASS', releaseVersion: 'PASS', worktrees: 'PASS' };
  const failures = validateIncidentState(separated);
  assert(failures.some((item) => item.includes('STAGING certificado')));
  separated.reconciliation.stagingCertification = { gate: 'ENVIRONMENT_RECONCILIATION', status: 'CERTIFIED' };
  assert.deepEqual(validateIncidentState(separated), []);
});
