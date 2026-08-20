import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { auditWorktrees, parseWorktreePorcelain, retireSafeWorktrees } from '../worktree-close.mjs';

const temporaryRoots = [];

test.afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function portable(value) {
  return String(value).replaceAll('\\', '/').toLowerCase();
}

function fixture() {
  const container = fs.mkdtempSync(path.join(os.tmpdir(), 'sportex-worktree-close-'));
  temporaryRoots.push(container);
  const repo = path.join(container, 'repo');
  const project = path.join(repo, 'platform');
  const sibling = path.join(container, 'integrated');
  fs.mkdirSync(path.join(project, 'docs', 'state'), { recursive: true });
  git(container, 'init', '-b', 'canonical', repo);
  git(repo, 'config', 'user.email', 'sportex-test@example.invalid');
  git(repo, 'config', 'user.name', 'SPORTEX test');
  fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n');
  git(repo, 'add', 'seed.txt');
  git(repo, 'commit', '-m', 'seed');
  git(repo, 'branch', 'integrated');
  git(repo, 'worktree', 'add', sibling, 'integrated');
  const inventoryPath = path.join(project, 'docs', 'state', 'WORKTREE_CLASSIFICATIONS.json');
  const writeInventory = (includeSibling = true) => {
    const worktrees = [{ path: repo, classification: 'PRESERVAR', reason: 'checkout canonico' }];
    if (includeSibling) worktrees.push({ path: sibling, classification: 'INTEGRADO', reason: 'rama integrada y limpia' });
    fs.writeFileSync(inventoryPath, `${JSON.stringify({
      schemaVersion: 1, project: 'SPORTEX', targetRef: 'canonical', updatedAt: '2026-08-20', worktrees,
    }, null, 2)}\n`);
  };
  writeInventory();
  return { repo, project, sibling, writeInventory };
}

test('parsea worktrees físicos y metadatos prunable', () => {
  const parsed = parseWorktreePorcelain('worktree C:/repo\nHEAD abc\nbranch refs/heads/main\n\nworktree C:/ghost\nHEAD def\ndetached\nprunable reason\n');
  assert.deepEqual(parsed, [
    { path: 'C:/repo', prunable: false, head: 'abc', branch: 'main' },
    { path: 'C:/ghost', prunable: true, head: 'def', detached: true },
  ]);
});

test('el cierre falla ante un worktree físico no clasificado', () => {
  const { project, sibling, writeInventory } = fixture();
  writeInventory(false);
  const result = auditWorktrees(project);
  assert(result.failures.some((failure) => portable(failure).includes(portable(sibling))));
});

test('INTEGRADO sucio queda bloqueado y no se retira', () => {
  const { project, sibling } = fixture();
  fs.writeFileSync(path.join(sibling, 'exclusive.txt'), 'preservar\n');
  const result = auditWorktrees(project);
  assert(result.failures.some((failure) => failure.includes('cambios locales')));
  assert.throws(() => retireSafeWorktrees(result));
  assert.equal(fs.existsSync(sibling), true);
});

test('retira sólo el worktree limpio e integrado y preserva su ref', () => {
  const { repo, project, sibling } = fixture();
  const result = auditWorktrees(project);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(retireSafeWorktrees(result).map(portable), [portable(sibling)]);
  assert.equal(fs.existsSync(sibling), false);
  assert.match(git(repo, 'show-ref', '--verify', 'refs/heads/integrated'), /^[a-f0-9]{40}/u);
  assert.equal(fs.existsSync(repo), true);
});
