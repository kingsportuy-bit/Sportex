#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv.find((arg) => arg.startsWith('--root='))?.split('=')[1];
const root = path.resolve(rootArg || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const selfTest = process.argv.includes('--self-test');
const checkChanges = process.argv.includes('--check-changes');
const guide = 'docs/GUIA_TRABAJO_DESARROLLO_SPORTEX.md';
const watched = [
  /^AGENTS\.md$/u,
  /^package\.json$/u,
  /^docs\/(INICIAL|DOCUMENTATION_ARCHITECTURE|CORE_DOCUMENTATION_SYSTEM|MODOS_DE_TRABAJO|CODEX_WORKFLOW|ENVIRONMENTS_CONTRACT|RELEASE_GOVERNANCE_CONTRACT)\.md$/u,
  /^docs\/TASKS\/(README|TEMPLATE)\.md$/u,
  /^docs\/state\/DOCUMENT_REGISTRY\.json$/u,
  /^scripts\/(documentation\/generate-documentation-views|validate-task-consistency|validate-development-guide-sync|validate-docs)\.mjs$/u,
  /^scripts\/sportex-workflow\.(mjs|ps1)$/u,
  /^scripts\/tests\/sportex-workflow\.test\.mjs$/u,
  /^scripts\/(release-governance-guard|new-release-bundle)\.ps1$/u,
];
const affectsGuide = (file) => watched.some((pattern) => pattern.test(file.replaceAll('\\', '/')));

if (selfTest) {
  const cases = [
    ['AGENTS.md', true],
    ['docs/INICIAL.md', true],
    ['scripts/validate-docs.mjs', true],
    ['core/src/server.ts', false],
  ];
  for (const [file, expected] of cases) {
    if (affectsGuide(file) !== expected) throw new Error(`guide sync self-test failed for ${file}`);
  }
}

const text = fs.readFileSync(path.join(root, guide), 'utf8');
for (const required of [
  '## Organigrama del sistema de desarrollo',
  '## Arquitectura por responsabilidades',
  '## Que fuente responde cada duda',
  '## Quien puede decidir que',
  '## Como se mantiene actualizada esta guia',
  '## Glosario simple',
  'scripts/validate-development-guide-sync.mjs',
]) {
  if (!text.includes(required)) throw new Error(`${guide}: missing ${required}`);
}

if (checkChanges) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split(/\r?\n/u).filter(Boolean);
  let changed = [...new Set([
    ...git('diff', '--name-only', '--relative', 'HEAD', '--'),
    ...git('diff', '--cached', '--name-only', '--relative', '--'),
    ...git('ls-files', '--others', '--exclude-standard', '--'),
  ])];
  if (changed.length === 0) {
    try { changed = git('diff-tree', '--no-commit-id', '--name-only', '-r', '--relative', 'HEAD'); }
    catch { changed = []; }
  }
  const relevant = changed.filter(affectsGuide);
  if (relevant.length && !changed.includes(guide)) {
    throw new Error(`Development system changed without ${guide}: ${relevant.join(', ')}`);
  }
}

console.log('SPORTEX development guide synchronization passed.');
