import test from 'node:test';
import assert from 'node:assert/strict';
import { createMock, generate, STATES, KINDS, isCPF, isCNPJ } from '../src/index.js';

test('a seed reproduces every record kind', () => {
  for (const kind of KINDS) assert.deepEqual(generate(kind, 12, { seed: 'repeat' }), generate(kind, 12, { seed: 'repeat' }));
  assert.notDeepEqual(generate('person', 4, { seed: 'a' }), generate('person', 4, { seed: 'b' }));
});

test('numeric seeds and their string representation share a stream', () => {
  assert.deepEqual(generate('person', 2, { seed: 42 }), generate('person', 2, { seed: '42' }));
});

test('generators advance independently and many follows individual calls', () => {
  const a = createMock({ seed: 'stream' }), b = createMock({ seed: 'stream' });
  assert.deepEqual(a.many('person', 3), [b.person(), b.person(), b.person()]);
  createMock({ seed: 'other' }).many('company', 20);
  assert.equal(a.cpf(), b.cpf());
});

test('empty batches and invalid requests do not consume the stream', () => {
  const a = createMock(), b = createMock();
  assert.deepEqual(a.many('cpf', 0), []);
  assert.throws(() => a.many('__proto__', 1), TypeError);
  assert.throws(() => a.many('cpf', -1), RangeError);
  assert.equal(a.cpf(), b.cpf());
});

test('formatting changes punctuation without changing the underlying data', () => {
  const raw = generate('person', 10, { seed: 'format', state: 'SP' });
  const pretty = generate('person', 10, { seed: 'format', state: 'SP', formatted: true });
  for (let i = 0; i < raw.length; i++) {
    assert.equal(pretty[i].cpf.replace(/\D/g, ''), raw[i].cpf);
    assert.equal(pretty[i].phone.replace(/[^\d+]/g, ''), raw[i].phone);
    assert.equal(pretty[i].address.postalCode.replace('-', ''), raw[i].address.postalCode);
    assert.equal(pretty[i].name, raw[i].name);
    assert.equal(pretty[i].email, raw[i].email);
  }
});

test('every state produces a capital and the matching mobile area code', () => {
  const codes = ['68','82','96','92','71','85','61','27','62','98','65','67','31','91','83','41','81','86','21','84','51','69','95','48','11','79','63'];
  assert.equal(STATES.length, 27);
  for (const [index, state] of STATES.entries()) {
    const person = createMock({ state }).person();
    assert.equal(person.address.state, state);
    assert.equal(person.address.country, 'BR');
    assert.match(person.address.city, /\S/);
    assert.ok(person.phone.startsWith(`+55${codes[index]}9`));
    assert.match(person.address.postalCode, /^\d{8}$/);
  }
  assert.equal(createMock({ state: 'SP' }).address().city, 'São Paulo');
  assert.equal(createMock({ state: 'DF' }).address().city, 'Brasília');
});

test('person and company records use test email domains and valid document checksums', () => {
  for (const person of generate('person', 100, { formatted: true })) {
    assert.ok(isCPF(person.cpf));
    assert.match(person.email, /^[a-z0-9.]+@example\.test$/);
    assert.match(person.phone, /^\+55 \(\d{2}\) 9\d{4}-\d{4}$/);
    assert.match(person.address.postalCode, /^\d{5}-\d{3}$/);
  }
  for (const company of generate('company', 100, { formatted: true })) {
    assert.ok(isCNPJ(company.cnpj));
    assert.match(company.name, / Exemplo Ltda\.$/);
    assert.match(company.email, /@example\.test$/);
  }
});

test('records do not share mutable address objects', () => {
  const rows = generate('person', 2);
  const before = structuredClone(rows[1]);
  rows[0].address.city = 'Changed';
  assert.deepEqual(rows[1], before);
  assert.ok(Object.isFrozen(STATES));
  assert.ok(Object.isFrozen(KINDS));
  assert.ok(Object.isFrozen(createMock()));
});

test('options reject invalid seeds, states, types and unknown keys', () => {
  for (const seed of ['', 'a'.repeat(129), NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, null, {}, true]) assert.throws(() => createMock({ seed }));
  for (const state of ['sp', 'XX', '', null]) assert.throws(() => createMock({ state }));
  for (const options of [null, [], false, { seeds: 'x' }, { formatted: 'yes' }, { cnpjType: 'legacy' }]) assert.throws(() => createMock(options));
  assert.doesNotThrow(() => createMock({ seed: 'a'.repeat(128) }));
});

test('batch count boundaries and kinds are checked', () => {
  for (const count of [-1, 10001, NaN, Infinity, 1.2, '3', null]) assert.throws(() => generate('cpf', count), RangeError);
  for (const kind of ['people', 'constructor', '__proto__', null]) assert.throws(() => generate(kind), TypeError);
  assert.equal(generate('cpf', 10000).length, 10000);
  assert.equal(generate('cpf').length, 1);
});
