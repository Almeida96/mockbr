function digit(base, weights) {
  const sum = [...base].reduce((total, char, index) => total + (char.charCodeAt(0) - 48) * weights[index], 0);
  const remainder = sum % 11;
  return String(remainder < 2 ? 0 : 11 - remainder);
}

export function cpfCheckDigits(base) {
  if (typeof base !== 'string' || base.length !== 9 || !/^[0-9]+$/.test(base)) throw new TypeError('CPF base must contain exactly 9 digits.');
  const first = digit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first + digit(base + first, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
}

export function cnpjCheckDigits(base) {
  if (typeof base !== 'string' || base.length !== 12 || !/^[0-9A-Z]+$/.test(base)) throw new TypeError('CNPJ base must contain exactly 12 uppercase letters or digits.');
  const first = digit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first + digit(base + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
}

function rawCPF(value) {
  if (typeof value !== 'string') return null;
  if (value.length === 11 && /^[0-9]+$/.test(value)) return value;
  if (value.length === 14 && /^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/.test(value)) return value.replace(/[.-]/g, '');
  return null;
}

function rawCNPJ(value) {
  if (typeof value !== 'string') return null;
  if (value.length === 14 && /^[0-9A-Z]{12}[0-9]{2}$/.test(value)) return value;
  if (value.length === 18 && /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-[0-9]{2}$/.test(value)) return value.replace(/[./-]/g, '');
  return null;
}

export function isCPF(value) {
  const raw = rawCPF(value);
  return raw !== null && !/^(.)\1+$/.test(raw) && cpfCheckDigits(raw.slice(0, 9)) === raw.slice(9);
}

export function isCNPJ(value) {
  const raw = rawCNPJ(value);
  return raw !== null && !/^(.)\1+$/.test(raw) && cnpjCheckDigits(raw.slice(0, 12)) === raw.slice(12);
}

export function formatCPF(value) {
  if (!isCPF(value)) throw new TypeError('CPF has an invalid format or checksum.');
  return rawCPF(value).replace(/^(...)(...)(...)(..)$/, '$1.$2.$3-$4');
}

export function formatCNPJ(value) {
  if (!isCNPJ(value)) throw new TypeError('CNPJ has an invalid format or checksum.');
  return rawCNPJ(value).replace(/^(..)(...)(...)(....)(..)$/, '$1.$2.$3/$4-$5');
}
