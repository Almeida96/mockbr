function flatten(value, prefix = '', output = new Map()) {
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError('CSV records must use plain objects without arrays.');
    for (const [key, nested] of Object.entries(value)) {
      if (key.includes('.')) throw new TypeError('CSV field names cannot contain dots.');
      flatten(nested, prefix ? `${prefix}.${key}` : key, output);
    }
  } else {
    if (!['string', 'number', 'boolean'].includes(typeof value) && value !== null) throw new TypeError('CSV values must be strings, numbers, booleans, or null.');
    output.set(prefix || 'value', value === null ? '' : String(value));
  }
  return output;
}

export function serialize(records, format = 'json') {
  if (!Array.isArray(records)) throw new TypeError('Records must be an array.');
  if (format === 'json') return JSON.stringify(records, null, 2) + '\n';
  if (format === 'jsonl') return records.length ? records.map(record => JSON.stringify(record)).join('\n') + '\n' : '';
  if (format !== 'csv') throw new TypeError('Format must be json, jsonl, or csv.');
  if (!records.length) return '';
  const rows = records.map(record => flatten(record));
  const columns = [...new Set(rows.flatMap(row => [...row.keys()]))];
  const quote = value => `"${value.replaceAll('"', '""')}"`;
  return [columns, ...rows.map(row => columns.map(column => row.get(column) ?? ''))]
    .map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
}
