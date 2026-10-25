import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, serialize } from '../src/index.js';

test('JSON and JSON Lines round-trip generated records', () => {
  const records = generate('person', 3);
  assert.deepEqual(JSON.parse(serialize(records)), records);
  assert.deepEqual(serialize(records, 'jsonl').trimEnd().split('\n').map(line => JSON.parse(line)), records);
  assert.ok(serialize(records).endsWith('\n'));
});

test('empty output has a defined representation for each format', () => {
  assert.equal(serialize([], 'json'), '[]\n');
  assert.equal(serialize([], 'jsonl'), '');
  assert.equal(serialize([], 'csv'), '');
});

test('CSV flattens nested fields and keeps the union of columns', () => {
  assert.equal(serialize([{ name: 'João', address: { state: 'SP' } }, { phone: '+5511999990000', name: 'Ana' }], 'csv'),
    '"name","address.state","phone"\r\n"João","SP",""\r\n"Ana","","+5511999990000"\r\n');
});

test('CSV quotes commas, quotes and newlines without changing values', () => {
  assert.equal(serialize(['one,two', 'a"b', 'a\nb', '0000123', '+5511999990000'], 'csv'), '"value"\r\n"one,two"\r\n"a""b"\r\n"a\nb"\r\n"0000123"\r\n"+5511999990000"\r\n');
});

test('CSV handles null, boolean and numeric fields', () => {
  assert.equal(serialize([{ a: null, b: false, c: 0 }], 'csv'), '"a","b","c"\r\n"","false","0"\r\n');
});

test('serialization rejects unsupported formats and ambiguous CSV shapes', () => {
  assert.throws(() => serialize({}), TypeError);
  assert.throws(() => serialize([], 'xml'), TypeError);
  for (const row of [{ 'a.b': 1 }, { a: [] }, { a: undefined }, new Date()]) assert.throws(() => serialize([row], 'csv'), TypeError);
});
