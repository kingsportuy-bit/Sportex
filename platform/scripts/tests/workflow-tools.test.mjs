import test from 'node:test';
import assert from 'node:assert/strict';
import { rankLibrary } from '../library-context.mjs';
import { rankErrors } from '../error-search.mjs';

const library = [
  { path: 'docs/biblioteca/superficies/whatsapp/README.md', title: 'Superficie WhatsApp', headings: 'Estado Reglas', body: 'mensajes evolution' },
  { path: 'docs/biblioteca/superficies/db/README.md', title: 'Superficie base de datos', headings: 'Persistencia Estado', body: 'migraciones RLS' },
  { path: 'docs/biblioteca/modulos/procesos/README.md', title: 'Modulo procesos', headings: 'Transiciones', body: 'pedidos' },
];

test('Biblioteca usa OR, ranking determinista y top acotado', () => {
  const result = rankLibrary(library, 'whatsapp db', 3);
  assert.equal(result.length, 2);
  assert.equal(result[0].path, 'docs/biblioteca/superficies/whatsapp/README.md');
  assert(result[0].matchedTerms.includes('whatsapp'));
  assert(result[1].matchedTerms.includes('db'));
});

test('Biblioteca rechaza query vacia y limites fuera de 3-5', () => {
  assert.throws(() => rankLibrary(library, '', 3), /palabra util/u);
  assert.throws(() => rankLibrary(library, 'whatsapp', 8), /entre 3 y 5/u);
});

const errors = [
  { id: 'SPX-ERR-001', title: 'Guidance mutaba contexto', path: 'docs/errors/a.md', searchText: 'sintoma workflow stale solucion guidance read-only' },
  { id: 'SPX-ERR-002', title: 'Gate VPS', path: 'docs/errors/b.md', searchText: 'docker capacidad cpu' },
];

test('errores Ranked recupera coincidencias parciales OR', () => {
  const result = rankErrors(errors, 'guidance workflow inexistente', 'ranked');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'SPX-ERR-001');
  assert.deepEqual(result[0].matchedTerms, ['guidance', 'workflow']);
});

test('errores All preserva la semantica anterior', () => {
  assert.equal(rankErrors(errors, 'guidance workflow', 'all').length, 1);
  assert.equal(rankErrors(errors, 'guidance docker', 'all').length, 0);
});
