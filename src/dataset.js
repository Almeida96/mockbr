import { createMock } from './index.js';
import { seededRandom } from './random.js';

/** A repeatable shop fixture with foreign keys and integer money amounts. */
export function generateDataset(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  for (const key of Object.keys(options)) if (!['seed', 'state', 'formatted', 'customers', 'products', 'orders'].includes(key)) throw new TypeError(`Unknown dataset option: ${key}`);
  const { seed = 'mockbr', state, formatted = false, customers = 20, products = 10, orders = 50 } = options;
  for (const [name, value] of Object.entries({ customers, products, orders })) {
    if (!Number.isInteger(value) || value < 0 || value > 10000) throw new RangeError(`${name} must be an integer from 0 to 10,000.`);
  }
  if (orders && (!customers || !products)) throw new RangeError('Orders require at least one customer and one product.');
  const mock = createMock({ seed, state, formatted });
  const random = seededRandom(seed);
  const usedCPF = new Set();
  const people = Array.from({ length: customers }, (_, index) => {
    const person = mock.person();
    let attempts = 0;
    while (usedCPF.has(person.cpf)) {
      if (++attempts > 100) throw new Error('Could not generate a unique customer CPF.');
      person.cpf = mock.cpf();
    }
    usedCPF.add(person.cpf);
    const id = `customer-${String(index + 1).padStart(5, '0')}`;
    return { id, ...person, email: `${id}@example.test` };
  });
  const catalog = Array.from({ length: products }, (_, index) => ({
    id: `product-${String(index + 1).padStart(5, '0')}`,
    name: `Test product ${index + 1}`,
    priceCents: 100 + random(99901), currency: 'BRL',
  }));
  const purchases = Array.from({ length: orders }, (_, index) => {
    const chosen = new Set();
    const itemCount = 1 + random(Math.min(5, products));
    while (chosen.size < itemCount) chosen.add(random(products));
    const items = [...chosen].map(i => ({ productId: catalog[i].id, quantity: 1 + random(5), unitPriceCents: catalog[i].priceCents }));
    return {
      id: `order-${String(index + 1).padStart(5, '0')}`,
      customerId: people[random(customers)].id,
      createdAt: new Date(Date.UTC(2025, 0, 1) + random(365 * 24 * 60) * 60000).toISOString(),
      status: ['pending', 'paid', 'shipped', 'cancelled'][random(4)],
      currency: 'BRL', items,
      totalCents: items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0),
    };
  });
  return { version: 1, customers: people, products: catalog, orders: purchases };
}
