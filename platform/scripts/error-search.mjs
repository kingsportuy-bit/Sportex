#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSearch, queryTerms } from './library-context.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');

export function rankErrors(entries, query, mode = 'ranked', limit = 6) {
  const terms = queryTerms(query);
  const phrase = normalizeSearch(query).trim();
  if (!terms.length) throw new Error('Indicar una o mas palabras utiles.');
  if (!['all', 'ranked'].includes(mode)) throw new Error('mode debe ser all o ranked.');

  return entries.map((entry) => {
    const title = normalizeSearch(entry.title);
    const text = normalizeSearch(entry.searchText);
    const pathText = normalizeSearch(entry.path);
    const matchedTerms = terms.filter((term) => title.includes(term) || text.includes(term) || pathText.includes(term));
    if (mode === 'all' && matchedTerms.length !== terms.length) return null;
    if (mode === 'ranked' && matchedTerms.length === 0) return null;
    let score = phrase && title.includes(phrase) ? 20 : 0;
    for (const term of matchedTerms) {
      if (title.includes(term)) score += 8;
      if (text.includes(term)) score += 4;
      if (pathText.includes(term)) score += 2;
    }
    return { ...entry, score, matchedTerms, coverage: matchedTerms.length / terms.length };
  }).filter(Boolean)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || b.id.localeCompare(a.id))
    .slice(0, limit);
}

function parseArgs(argv) {
  const mode = argv.find((arg) => arg.startsWith('--mode='))?.slice(7).toLowerCase() || 'ranked';
  const separator = argv.indexOf('--');
  const queryArgs = separator === -1 ? argv.filter((arg) => !arg.startsWith('--')) : argv.slice(separator + 1);
  return { mode, query: queryArgs.join(' ').trim() };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const index = JSON.parse(fs.readFileSync(path.join(defaultRoot, 'docs', 'errors', 'index.json'), 'utf8'));
    const found = rankErrors(index.entries || [], args.query, args.mode);
    if (!found.length) {
      console.log(`PRECHECK OK: sin entradas conocidas para: ${args.query}`);
      return;
    }
    console.log(`PRECHECK ALERTA: entradas conocidas para: ${args.query}`);
    for (const entry of found) {
      console.log(`- ${entry.id} - ${entry.title} [score=${entry.score}; matched=${entry.matchedTerms.join(',')}]`);
      const entryPath = path.join(defaultRoot, ...entry.path.split('/'));
      const lines = fs.readFileSync(entryPath, 'utf8').split(/\r?\n/u)
        .filter((line) => /Sintoma:|Causa raiz:|Solucion:|Prevencion\/guardia:/iu.test(line))
        .slice(0, 10);
      for (const line of lines) console.log(`  ${line.trim()}`);
    }
  } catch (error) {
    console.error(`PRECHECK FAIL: ${error.message}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) main();
