import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateDataset, isCPF } from '../src/index.js';

test('datasets are deterministic, reference existing rows and reconcile totals', () => {
  const options = { seed: 'checkout-test', customers: 40, products: 12, orders: 500, state: 'BA' };
  const data = generateDataset(options);
  assert.deepEqual(data, generateDataset(options));
  assert.notDeepEqual(data, generateDataset({ ...options, seed: 'other' }));
  const customerIds = new Set(data.customers.map(c => c.id));
  const products = new Map(data.products.map(p => [p.id, p]));
  assert.equal(new Set(data.customers.map(c => c.cpf)).size, 40);
  assert.equal(new Set(data.customers.map(c => c.email)).size, 40);
  assert.ok(data.customers.every(c => isCPF(c.cpf) && c.address.state === 'BA'));
  for (const order of data.orders) {
    assert.ok(customerIds.has(order.customerId));
    assert.equal(new Set(order.items.map(i => i.productId)).size, order.items.length);
    assert.equal(order.totalCents, order.items.reduce((sum, i) => sum + i.quantity * products.get(i.productId).priceCents, 0));
    assert.ok(Number.isSafeInteger(order.totalCents));
  }
});
test('validates dimensions and allows intentionally empty datasets', () => {
  assert.deepEqual(generateDataset({ customers: 0, products: 0, orders: 0 }), { version: 1, customers: [], products: [], orders: [] });
  for (const options of [{ customers: 0 }, { products: 0 }, { orders: -1 }, { orders: 10001 }, { customers: 1.5 }, { extra: 1 }]) assert.throws(() => generateDataset(options));
});
test('dataset CLI emits a usable fixture and rejects lossy CSV serialization', () => {
  const cli = fileURLToPath(new URL('../bin/mockbr.js', import.meta.url));
  const data = JSON.parse(execFileSync(process.execPath, [cli, 'dataset', '--customers', '2', '--products', '3', '--count', '4']));
  assert.equal(data.customers.length, 2); assert.equal(data.orders.length, 4);
  const result = spawnSync(process.execPath, [cli, 'dataset', '--format', 'csv'], { encoding: 'utf8' });
  assert.equal(result.status, 2); assert.equal(result.stdout, '');
});
