import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, serialize, VERSION } from '../src/index.js';

const cliPath = fileURLToPath(new URL('../bin/mockbr.js', import.meta.url));
const cli = (...args) => spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' });

test('CLI help and version succeed without data output', () => {
  assert.match(cli('--help').stdout, /Usage: mockbr/);
  assert.equal(cli('--version').stdout, `${VERSION}\n`);
  assert.equal(cli('--help').status, 0);
});

test('CLI defaults to five records and reproduces the library output', () => {
  const result = cli('person', '--seed', 'checkout', '--state=BA', '--formatted');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, serialize(generate('person', 5, { seed: 'checkout', state: 'BA', formatted: true })));
});

test('CLI exports numeric companies as JSON Lines and CPF as CSV', () => {
  const result = cli('company', '--count=2', '--cnpj-type=numeric', '--format=jsonl');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, serialize(generate('company', 2, { cnpjType: 'numeric' }), 'jsonl'));
  assert.equal(cli('cpf', '--count=1', '--format=csv').stdout, serialize(generate('cpf'), 'csv'));
});

test('CLI accepts zero records and seeds starting with a dash via equals', () => {
  assert.equal(cli('cpf', '--count=0').stdout, '[]\n');
  assert.equal(cli('cpf', '--seed=--test', '--count=1').stdout, serialize(generate('cpf', 1, { seed: '--test' })));
});

test('CLI invalid input exits with code 2 and leaves stdout empty', () => {
  const cases = [[], ['person', '--oops'], ['person', '--count'], ['person', '--count', '--formatted'], ['person', '--count=2', '--count=3'], ['person', '--count=-1'], ['person', '--count=10001'], ['person', '--count=1.2'], ['person', '--state=XX'], ['person', '--formatted=false'], ['person', '--force'], ['person', '--format=xml'], ['__proto__'], ['person', '--seed=']];
  for (const args of cases) {
    const result = cli(...args);
    assert.equal(result.status, 2, args.join(' '));
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^mockbr: /);
  }
});

test('CLI output files require an explicit force flag to overwrite', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mockbr-test-'));
  try {
    const path = join(dir, 'fixture with spaces.json');
    assert.equal(cli('cpf', '--out', path).status, 0);
    const first = readFileSync(path, 'utf8');
    assert.equal(cli('person', '--out', path).status, 2);
    assert.equal(readFileSync(path, 'utf8'), first);
    assert.equal(cli('person', '--out', path, '--force').status, 0);
    assert.equal(readFileSync(path, 'utf8'), serialize(generate('person', 5)));
    const invalid = join(dir, 'invalid.json');
    assert.equal(cli('person', '--format=xml', '--out', invalid).status, 2);
    assert.equal(existsSync(invalid), false);
  } finally {
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep));
    assert.ok(dir.includes('mockbr-test-'));
    rmSync(dir, { recursive: true, force: true });
  }
});
