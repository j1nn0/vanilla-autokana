import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Public surface is intentionally limited to bind() and the AutoKana class (ADR-0003);
// kana utilities stay internal modules.
const expectedExports = ['AutoKana', 'bind'];

const esm = await import('../dist/autokana.es.js');
assert.deepEqual(Object.keys(esm).sort(), expectedExports);

const require = createRequire(import.meta.url);
const cjs = require('../dist/autokana.cjs');
assert.deepEqual(Object.keys(cjs).sort(), expectedExports);

await access('dist/index.d.cts');
