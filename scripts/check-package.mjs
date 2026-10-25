import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, sep } from 'node:path';

const archive = resolve('mockbr-0.1.0.tgz');
const temp = mkdtempSync(join(tmpdir(), 'mockbr-package-'));
function run(command, args, cwd = temp) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || String(result.error));
  return result.stdout;
}
try {
  const entries = run('tar', ['-tzf', archive]).trim().split(/\r?\n/);
  for (const entry of entries) {
    assert.ok(entry.startsWith('package/') && !entry.includes('..'), entry);
    assert.doesNotMatch(entry, /node_modules|\.github|\/test\/|\/demo\//);
  }
  run('tar', ['-xzf', archive, '-C', temp]);
  const root = join(temp, 'package');
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.name, '@almeida96/mockbr');
  assert.equal(pkg.dependencies, undefined);
  assert.match(readFileSync(join(root, 'bin/mockbr.js'), 'utf8'), /^#!\/usr\/bin\/env node\n/);
  if (process.platform !== 'win32') assert.ok(statSync(join(root, 'bin/mockbr.js')).mode & 0o111);
  writeFileSync(join(root, 'smoke.mjs'), `import assert from 'node:assert/strict';
import { generate, isCNPJ, serialize } from '@almeida96/mockbr';
const rows = generate('company', 3, { seed: 'package' });
assert.ok(rows.every(row => isCNPJ(row.cnpj)));
assert.equal(JSON.parse(serialize(rows)).length, 3);
`);
  run(process.execPath, ['smoke.mjs'], root);
  const output = run(process.execPath, ['bin/mockbr.js', 'cpf', '--count=2'], root);
  assert.equal(JSON.parse(output).length, 2);
  console.log(`Package verified: ${entries.length} entries, public imports and CLI work without dependencies.`);
} finally {
  assert.ok(resolve(temp).startsWith(resolve(tmpdir()) + sep) && temp.includes('mockbr-package-'));
  rmSync(temp, { recursive: true, force: true });
}
