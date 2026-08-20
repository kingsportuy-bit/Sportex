#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadIncidentState, validateIncidentState } from './incident-reconciliation.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), '..');

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function normalizedPath(value) {
  const resolved = path.resolve(String(value)).replaceAll('\\', '/').replace(/\/$/u, '');
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

export function parseWorktreePorcelain(text) {
  const records = [];
  let current = null;
  for (const line of String(text).split(/\r?\n/u)) {
    if (line.startsWith('worktree ')) {
      if (current) records.push(current);
      current = { path: line.slice('worktree '.length), prunable: false };
    } else if (current && line.startsWith('HEAD ')) current.head = line.slice('HEAD '.length);
    else if (current && line.startsWith('branch ')) current.branch = line.slice('branch '.length).replace(/^refs\/heads\//u, '');
    else if (current && line === 'detached') current.detached = true;
    else if (current && line.startsWith('prunable')) current.prunable = true;
  }
  if (current) records.push(current);
  return records;
}

function isAncestor(repoRoot, head, targetRef) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', head, targetRef], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function readInventory(projectRoot, inventoryPath) {
  const absolute = path.resolve(projectRoot, inventoryPath);
  const inventory = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (inventory.schemaVersion !== 1 || !inventory.targetRef || !Array.isArray(inventory.worktrees)) {
    throw new Error(`${inventoryPath}: inventario incompatible`);
  }
  const allowed = new Set(['INTEGRADO', 'PRESERVAR', 'BLOQUEADO']);
  for (const item of inventory.worktrees) {
    if (!item.path || !allowed.has(item.classification) || !item.reason) {
      throw new Error(`${inventoryPath}: clasificacion incompleta para ${item.path || '<sin-path>'}`);
    }
  }
  return { absolute, inventory };
}

export function auditWorktrees(projectRoot = defaultProjectRoot, options = {}) {
  const repoRoot = git(projectRoot, 'rev-parse', '--show-toplevel');
  const inventoryPath = options.inventoryPath || 'docs/state/WORKTREE_CLASSIFICATIONS.json';
  const { inventory } = readInventory(projectRoot, inventoryPath);
  const targetRef = options.targetRef || inventory.targetRef;
  git(repoRoot, 'rev-parse', '--verify', targetRef);
  const classifications = new Map(inventory.worktrees.map((item) => [normalizedPath(item.path), item]));
  const worktrees = parseWorktreePorcelain(git(repoRoot, 'worktree', 'list', '--porcelain'));
  const failures = [];
  const audited = worktrees.map((worktree, index) => {
    const physical = fs.existsSync(worktree.path);
    const classification = classifications.get(normalizedPath(worktree.path)) || null;
    let clean = null;
    let integrated = null;
    if (physical) {
      if (!classification) failures.push(`worktree fisico sin clasificar: ${worktree.path}`);
      clean = git(worktree.path, 'status', '--porcelain').length === 0;
      integrated = isAncestor(repoRoot, worktree.head, targetRef);
      if (classification?.classification === 'INTEGRADO' && !clean) {
        failures.push(`INTEGRADO con cambios locales: ${worktree.path}`);
      }
      if (classification?.classification === 'INTEGRADO' && !integrated) {
        failures.push(`INTEGRADO no contenido en ${targetRef}: ${worktree.path} (${worktree.head})`);
      }
      if (classification?.classification === 'INTEGRADO' && index === 0) {
        failures.push(`working tree administrativo no es retirable automáticamente; usar PRESERVAR: ${worktree.path}`);
      }
    }
    return {
      ...worktree,
      physical,
      classification: classification?.classification || 'NO_CLASIFICADO',
      reason: classification?.reason || '',
      clean,
      integrated,
      administrative: index === 0,
    };
  });
  const incidentStatePath = path.join(projectRoot, 'docs', 'state', 'INCIDENT_RECONCILIATION_STATE.json');
  if (fs.existsSync(incidentStatePath)) {
    const incidentFailures = validateIncidentState(loadIncidentState(projectRoot), {
      worktrees: inventory.worktrees,
    });
    failures.push(...incidentFailures.map((failure) => `preemption: ${failure}`));
  }
  return { repoRoot, projectRoot, inventoryPath, targetRef, inventory, audited, failures };
}

export function retireSafeWorktrees(result) {
  if (result.failures.length) throw new Error(result.failures.join('\n'));
  const current = normalizedPath(git(result.projectRoot, 'rev-parse', '--show-toplevel'));
  const preservedSnapshots = new Map(result.audited
    .filter((item) => item.physical && item.classification !== 'INTEGRADO')
    .map((item) => [item.path, git(item.path, 'status', '--porcelain')]));
  const retired = [];
  for (const item of result.audited) {
    if (!item.physical || item.classification !== 'INTEGRADO' || !item.clean || !item.integrated) continue;
    if (normalizedPath(item.path) === current) continue;
    git(result.repoRoot, 'worktree', 'remove', '--', item.path);
    retired.push(item.path);
    for (const [preservedPath, before] of preservedSnapshots) {
      const after = git(preservedPath, 'status', '--porcelain');
      if (after !== before) {
        throw new Error(`retiro de ${item.path} alteró el worktree PRESERVAR/BLOQUEADO ${preservedPath}`);
      }
    }
  }
  git(result.repoRoot, 'worktree', 'prune');
  return retired;
}

function printResult(result, retired = []) {
  for (const item of result.audited) {
    console.log(`WORKTREE=${item.path}`);
    console.log(`CLASSIFICATION=${item.classification}`);
    console.log(`PHYSICAL=${item.physical}`);
    if (item.clean !== null) console.log(`CLEAN=${item.clean}`);
    if (item.integrated !== null) console.log(`INTEGRATED=${item.integrated}`);
    if (item.prunable) console.log('PRUNABLE=true');
  }
  for (const target of retired) console.log(`RETIRED=${target}`);
  if (result.failures.length) {
    console.error('WORKTREE_CLOSE=FAIL');
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('WORKTREE_CLOSE=PASS');
  console.log(`WORKTREE_TARGET=${result.targetRef}`);
}

function main() {
  const args = process.argv.slice(2);
  const projectRoot = path.resolve(args.find((arg) => arg.startsWith('--root='))?.slice(7) || defaultProjectRoot);
  const inventoryPath = args.find((arg) => arg.startsWith('--inventory='))?.slice(12)
    || 'docs/state/WORKTREE_CLASSIFICATIONS.json';
  const targetRef = args.find((arg) => arg.startsWith('--target='))?.slice(9);
  let result;
  try {
    result = auditWorktrees(projectRoot, { inventoryPath, targetRef });
    const retired = args.includes('--apply') ? retireSafeWorktrees(result) : [];
    if (retired.length) result = auditWorktrees(projectRoot, { inventoryPath, targetRef });
    printResult(result, retired);
  } catch (error) {
    console.error('WORKTREE_CLOSE=FAIL');
    console.error(`- ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) main();
