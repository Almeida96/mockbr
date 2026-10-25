import { seededRandom } from './random.js';
import { cpfCheckDigits, cnpjCheckDigits, formatCPF, formatCNPJ } from './documents.js';
import { locations, firstNames, lastNames, companyWords, companyActivities } from './data.js';

export { cpfCheckDigits, cnpjCheckDigits, formatCPF, formatCNPJ, isCPF, isCNPJ } from './documents.js';
export { serialize } from './serialize.js';
export const STATES = Object.freeze(locations.map(([state]) => state));
export const KINDS = Object.freeze(['person', 'company', 'cpf', 'cnpj', 'address', 'phone']);
export const VERSION = '0.1.0';

export function createMock(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  for (const key of Object.keys(options)) if (!['seed', 'state', 'formatted', 'cnpjType'].includes(key)) throw new TypeError(`Unknown option: ${key}`);
  const { seed = 'mockbr', state, formatted = false, cnpjType = 'alphanumeric' } = options;
  if (state !== undefined && !STATES.includes(state)) throw new TypeError('State must be a two-letter uppercase Brazilian state code.');
  if (typeof formatted !== 'boolean') throw new TypeError('Formatted must be a boolean.');
  if (!['numeric', 'alphanumeric'].includes(cnpjType)) throw new TypeError('CNPJ type must be numeric or alphanumeric.');
  const random = seededRandom(seed);
  const pick = values => values[random(values.length)];
  const digits = length => Array.from({ length }, () => random(10)).join('');
  const location = () => state ? locations.find(item => item[0] === state) : pick(locations);
  const slug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
  function cpf() {
    let base;
    do { base = digits(9); } while (/^(.)\1+$/.test(base));
    const value = base + cpfCheckDigits(base);
    return formatted ? formatCPF(value) : value;
  }
  function cnpj() {
    let base;
    if (cnpjType === 'numeric') {
      do { base = digits(8) + '0001'; } while (base.startsWith('00000000'));
    } else {
      base = Array.from({ length: 12 }, () => pick('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')).join('');
      if (!/[A-Z]/.test(base)) base = pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ') + base.slice(1);
    }
    const value = base + cnpjCheckDigits(base);
    return formatted ? formatCNPJ(value) : value;
  }
  function addressFor(place) {
    const postalCode = digits(8);
    return {
      street: pick(['Rua de Exemplo', 'Avenida de Teste', 'Travessa Modelo']),
      number: random(999) + 1,
      neighborhood: 'Bairro de Teste',
      city: place[1], state: place[0],
      postalCode: formatted ? postalCode.replace(/^(.....)(...)$/, '$1-$2') : postalCode,
      country: 'BR',
    };
  }
  function phoneFor(place) {
    const local = '9' + digits(8);
    return formatted ? `+55 (${place[2]}) ${local.slice(0, 5)}-${local.slice(5)}` : `+55${place[2]}${local}`;
  }
  function person() {
    const place = location();
    const first = pick(firstNames), last = `${pick(lastNames)} ${pick(lastNames)}`;
    const name = `${first} ${last}`;
    return { name, cpf: cpf(), email: `${slug(name)}.${digits(4)}@example.test`, phone: phoneFor(place), address: addressFor(place) };
  }
  function company() {
    const place = location();
    const name = `${pick(companyWords)} ${pick(companyActivities)} Exemplo Ltda.`;
    return { name, cnpj: cnpj(), email: `contato.${slug(name)}.${digits(4)}@example.test`, phone: phoneFor(place), address: addressFor(place) };
  }
  const api = { cpf, cnpj, person, company, address: () => addressFor(location()), phone: () => phoneFor(location()) };
  function many(kind, count = 1) {
    if (!KINDS.includes(kind)) throw new TypeError(`Kind must be one of: ${KINDS.join(', ')}.`);
    if (!Number.isInteger(count) || count < 0 || count > 10000) throw new RangeError('Count must be an integer from 0 to 10,000.');
    return Array.from({ length: count }, () => api[kind]());
  }
  return Object.freeze({ ...api, many });
}

export function generate(kind, count = 1, options = {}) {
  return createMock(options).many(kind, count);
}
