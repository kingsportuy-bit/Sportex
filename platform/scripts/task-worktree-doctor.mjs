#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const nextIdOnly = process.argv.includes('--next-id');
const dateArg = process.argv.find((arg) => arg.startsWith('--date='))?.split('=')[1];
const date = dateArg || new Date().toISOString().slice(0, 10).replaceAll('-', '');
const idPattern = /TASK-(\d{8})-(\d{3})/gu;
const failures = [];

function gitFrom(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
function collectIds(text, target) {
  for (const match of text.matchAll(idPattern)) target.add(`TASK-${match[1]}-${match[2]}`);
}

let repoRoot = '';
let branch = '';
let origin = '';
try { repoRoot = gitFrom(root, 'rev-parse','--show-toplevel'); }
catch { failures.push('No se encontro un repositorio Git.'); }
const git = (...args) => gitFrom(repoRoot || root, ...args);
const projectPrefix = repoRoot ? path.relative(repoRoot, root).split(path.sep).join('/') : '';
if (repoRoot) {
  try { branch = git('symbolic-ref','--short','HEAD'); }
  catch { failures.push('HEAD esta detached.'); }
  try { origin = git('remote','get-url','origin'); }
  catch { failures.push('Falta remote origin.'); }
}

const ids = new Set();
for (const file of walk(path.join(root, 'docs', 'TASKS')).filter((item) => item.endsWith('.md'))) {
  collectIds(fs.readFileSync(file, 'utf8'), ids);
}
if (repoRoot) {
  let refs = [];
  try { refs = git('for-each-ref','--format=%(refname)','refs/heads','refs/remotes').split(/\r?\n/u).filter(Boolean); }
  catch { refs = []; }
  for (const ref of refs) {
    let names = [];
    try {
      const treeArgs = ['ls-tree','-r','--name-only',ref];
      if (projectPrefix) treeArgs.push('--', `${projectPrefix}/docs/TASKS`);
      names = git(...treeArgs).split(/\r?\n/u).filter((name) => /TASK-\d{8}-\d{3}-.+\.md$/u.test(name));
    }
    catch { continue; }
    for (const name of names) {
      try { collectIds(git('show',`${ref}:${name}`), ids); } catch { /* ref moved */ }
    }
  }
}

let maximum = 0;
for (const id of ids) {
  const match = id.match(/^TASK-(\d{8})-(\d{3})$/u);
  if (match?.[1] === date) maximum = Math.max(maximum, Number(match[2]));
}
const nextId = `TASK-${date}-${String(maximum + 1).padStart(3, '0')}`;

if (nextIdOnly) {
  if (failures.length && strict) {
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(nextId);
  process.exit(0);
}

let worktrees = '';
let status = '';
try { worktrees = git('worktree','list','--porcelain'); } catch { /* reported above */ }
try { status = git('status','--short','--','.'); } catch { /* reported above */ }
const activeFiles = walk(path.join(root, 'docs', 'TASKS', 'active')).filter((file) => /^TASK-.+\.md$/u.test(path.basename(file)));
if (activeFiles.length > 1) failures.push(`Hay ${activeFiles.length} tareas activas.`);

console.log(`SPORTEX_PROJECT_ROOT=${root}`);
console.log(`SPORTEX_GIT_ROOT=${repoRoot || '<missing>'}`);
console.log(`SPORTEX_BRANCH=${branch || '<detached>'}`);
console.log(`SPORTEX_ORIGIN=${origin || '<missing>'}`);
console.log(`SPORTEX_ACTIVE_TASKS=${activeFiles.length}`);
console.log(`SPORTEX_NEXT_TASK_ID=${nextId}`);
console.log(`SPORTEX_DIRTY_FILES=${status ? status.split(/\r?\n/u).length : 0}`);
console.log('SPORTEX_WORKTREES_BEGIN');
console.log(worktrees);
console.log('SPORTEX_WORKTREES_END');

if (failures.length) {
  for (const failure of failures) console.error(`DOCTOR: ${failure}`);
  if (strict) process.exit(1);
}
console.log('SPORTEX_TASK_DOCTOR_RESULT=pass');
