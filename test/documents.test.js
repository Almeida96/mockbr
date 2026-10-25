import test from 'node:test';
import assert from 'node:assert/strict';
import { cpfCheckDigits, cnpjCheckDigits, isCPF, isCNPJ, formatCPF, formatCNPJ, generate } from '../src/index.js';

test('CPF check digits and punctuation', () => {
  assert.equal(cpfCheckDigits('529982247'), '25');
  assert.equal(formatCPF('52998224725'), '529.982.247-25');
  assert.equal(formatCPF('529.982.247-25'), '529.982.247-25');
  assert.ok(isCPF('52998224725'));
  assert.ok(isCPF('529.982.247-25'));
});

test('CNPJ matches the Receita Federal alphanumeric example', () => {
  assert.equal(cnpjCheckDigits('12ABC34501DE'), '35');
  assert.ok(isCNPJ('12ABC34501DE35'));
  assert.equal(formatCNPJ('12ABC34501DE35'), '12.ABC.345/01DE-35');
  assert.equal(formatCNPJ('12.ABC.345/01DE-35'), '12.ABC.345/01DE-35');
});

test('numeric CNPJ uses the same check-digit algorithm', () => {
  assert.equal(cnpjCheckDigits('112223330001'), '81');
  assert.ok(isCNPJ('11.222.333/0001-81'));
});

test('validators reject malformed, repeated and mistyped input without throwing', () => {
  for (const value of [null, undefined, 52998224725, {}, [], '', '00000000000', '11111111111', '52998224724', ' 52998224725', '52998224725\n', '529-982-247-25']) assert.equal(isCPF(value), false);
  for (const value of [null, undefined, 11222333000181, {}, [], '', '00000000000000', '12abc34501DE35', '12ABC34501DE34', '12ABC34501DE35\n', '12ABC34501DEAA', '12.ABC.345-01DE-35']) assert.equal(isCNPJ(value), false);
});

test('check-digit functions reject wrong base lengths and alphabets', () => {
  for (const value of [null, 123456789, '123', '12345678A', '123456789\n']) assert.throws(() => cpfCheckDigits(value), TypeError);
  for (const value of [null, 123456789012, '123', '12abc34501DE', '12ABC34501D!', '12ABC34501DE\n']) assert.throws(() => cnpjCheckDigits(value), TypeError);
  assert.throws(() => formatCPF('52998224724'), TypeError);
  assert.throws(() => formatCNPJ('12ABC34501DE34'), TypeError);
});

// Calculate from right to left to cross-check the generator's weight tables.
function verifyDigits(value, kind) {
  for (let end = value.length - 2; end < value.length; end++) {
    let sum = 0;
    for (let i = end - 1, weight = 2; i >= 0; i--, weight++) {
      if (kind === 'cnpj' && weight === 10) weight = 2;
      sum += (value.charCodeAt(i) - 48) * weight;
    }
    const remainder = sum % 11;
    assert.equal(Number(value[end]), remainder < 2 ? 0 : 11 - remainder);
  }
}

test('generated documents pass an independent checksum calculation', () => {
  for (const value of generate('cpf', 2000, { seed: 'checksums' })) verifyDigits(value, 'cpf');
  for (const cnpjType of ['numeric', 'alphanumeric']) {
    for (const value of generate('cnpj', 2000, { seed: 'checksums', cnpjType })) {
      verifyDigits(value, 'cnpj');
      if (cnpjType === 'numeric') assert.match(value, /^\d{8}0001\d{2}$/);
      else assert.match(value.slice(0, 12), /[A-Z]/);
    }
  }
});
