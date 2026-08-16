#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..');

export function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase();
}

export function queryTerms(query) {
  const candidates = normalizeSearch(query).match(/[a-z0-9_]{2,}/gu) || [];
  return [...new Set(candidates.filter((term) => term.length >= 3 || term === 'db'))];
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

export function rankLibrary(records, query, limit = 5) {
  const phrase = normalizeSearch(query).trim();
  const terms = queryTerms(query);
  if (!terms.length) throw new Error('La consulta debe incluir una palabra util de al menos 3 caracteres, o DB.');
  if (!Number.isInteger(limit) || limit < 3 || limit > 5) throw new Error('limit debe estar entre 3 y 5.');

  return records.map((record) => {
    const title = normalizeSearch(record.title);
    const relative = normalizeSearch(record.path);
    const headings = normalizeSearch(record.headings || '');
    const body = normalizeSearch(record.body || '');
    let score = phrase && title.includes(phrase) ? 20 : 0;
    const matchedTerms = [];
    for (const term of terms) {
      let matched = false;
      if (title.includes(term)) { score += 12; matched = true; }
      if (relative.includes(term)) { score += 8; matched = true; }
      if (headings.includes(term)) { score += 6; matched = true; }
      if (body.includes(term)) { score += 1; matched = true; }
      if (matched) matchedTerms.push(term);
    }
    return { ...record, score, matchedTerms, coverage: matchedTerms.length / terms.length };
  }).filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.path.localeCompare(b.path))
    .slice(0, limit);
}

export function collectLibrary(root = defaultRoot) {
  const base = path.join(root, 'docs', 'biblioteca');
  return walk(base).filter((file) => file.endsWith('.md')).map((file) => {
    const body = fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
    const headings = [...body.matchAll(/^#{1,3}\s+(.+)$/gmu)].map((match) => match[1]).join(' ');
    return {
      path: path.relative(root, file).split(path.sep).join('/'),
      title: body.match(/^#\s+(.+)$/mu)?.[1]?.trim() || path.basename(file),
      headings,
      body,
    };
  });
}

function parseArgs(argv) {
  const limitValue = argv.find((arg) => arg.startsWith('--limit='))?.slice(8);
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const positionalLimit = /^\d+$/u.test(positional[0] || '') ? Number(positional.shift()) : null;
  return { query: positional.join(' ').trim(), limit: limitValue ? Number(limitValue) : (positionalLimit || 5) };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const records = collectLibrary();
    const selected = rankLibrary(records, args.query, args.limit);
    const chars = selected.reduce((total, record) => total + record.body.length, 0);
    console.log('SPORTEX_LIBRARY_CONTEXT=PASS');
    console.log(`QUERY=${args.query}`);
    console.log(`CANDIDATES=${records.length}`);
    console.log(`MATCHES=${selected.length}`);
    console.log(`CONTEXT_CHARS=${chars}`);
    console.log(`ESTIMATED_TOKENS=${Math.ceil(chars / 4)}`);
    if (!selected.length) console.log('NO_FOCAL_MATCH=true');
    console.log('READ:');
    for (const record of selected) {
      console.log(`- ${record.path} | score=${record.score} | matched=${record.matchedTerms.join(',')}`);
    }
  } catch (error) {
    console.error('SPORTEX_LIBRARY_CONTEXT=FAIL');
    console.error(`- ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) main();
