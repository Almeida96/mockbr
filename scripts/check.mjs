import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { VERSION } from '../src/index.js';

for (const folder of ['src', 'bin', 'demo', 'scripts', 'test']) {
  for (const file of await readdir(folder)) if (/\.m?js$/.test(file)) execFileSync(process.execPath, ['--check', `${folder}/${file}`], { stdio: 'inherit' });
}
assert.equal(VERSION, JSON.parse(await readFile('package.json', 'utf8')).version);
const html = await readFile('demo/index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size);
for (const [, id] of (await readFile('demo/app.js', 'utf8')).matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), `Missing UI element: ${id}`);
console.log('Syntax, version, and UI references checked.');
