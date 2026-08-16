#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const statePath = path.join(root, 'docs', 'state', 'PROJECT_STATE.json');
const historyPath = path.join(root, 'docs', 'historico', 'PROJECT_HISTORY.json');
const keep = 5;
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const existing = fs.existsSync(historyPath)
  ? JSON.parse(fs.readFileSync(historyPath, 'utf8'))
  : { schemaVersion: 1, project: 'SPORTEX', entries: [] };
const archived = (state.recentChanges || []).slice(keep);
const byKey = new Map(existing.entries.map((entry) => [`${entry.date}|${entry.taskId}|${entry.summary}`, entry]));
for (const entry of archived) byKey.set(`${entry.date}|${entry.taskId}|${entry.summary}`, entry);
existing.entries = [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
existing.updatedAt = state.updatedAt;
state.recentChanges = (state.recentChanges || []).slice(0, keep);
state.history = {
  path: 'docs/historico/PROJECT_HISTORY.json',
  archivedChanges: existing.entries.length,
  throughDate: existing.entries[0]?.date || null,
};
fs.mkdirSync(path.dirname(historyPath), { recursive: true });
fs.writeFileSync(historyPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
console.log(`SPORTEX_HISTORY_COMPACT=PASS recent=${state.recentChanges.length} archived=${existing.entries.length}`);
