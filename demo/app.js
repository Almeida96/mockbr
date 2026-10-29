import { generate, generateDataset, serialize, STATES, isCPF, isCNPJ } from './src/index.js';

const $ = id => document.getElementById(id);
const names = { person: 'people', company: 'companies', cpf: 'cpfs', cnpj: 'cnpjs', address: 'addresses', phone: 'phones', dataset: 'shop-fixture' };
let records = [], current = null, format = 'json', output = '', dirty = false;
for (const state of STATES) $('state').add(new Option(state, state));

function announce(message) { $('status').textContent = message; }
function setDirty() {
  dirty = true; $('copy').disabled = true; $('download').disabled = true;
  $('cnpj-type').disabled = !['company', 'cnpj'].includes($('kind').value);
  $('dataset-fields').hidden = $('kind').value !== 'dataset';
  for (const id of ['customers', 'products']) $(id).disabled = $('kind').value !== 'dataset';
  $('count-label').textContent = $('kind').value === 'dataset' ? 'Orders' : 'Records';
  announce('Settings changed. Generate data to update the output.');
}
$('generator').addEventListener('input', setDirty);
$('generator').addEventListener('change', setDirty);
$('new-seed').addEventListener('click', () => {
  $('seed').value = [...crypto.getRandomValues(new Uint8Array(6))].map(value => value.toString(16).padStart(2, '0')).join('');
  setDirty();
});

function render() {
  const dataset = current.kind === 'dataset';
  if (dataset) format = 'json';
  output = dataset ? JSON.stringify(records, null, 2) + '\n' : serialize(records, format);
  $('output').textContent = output;
  $('output-name').textContent = `${names[current.kind]}.${format}`;
  $('output-size').textContent = `${new TextEncoder().encode(output).length.toLocaleString('en-US')} bytes`;
  $('record-summary').textContent = dataset ? `${records.customers.length} customers · ${records.products.length} products · ${records.orders.length} orders` : `${records.length} ${records.length === 1 ? 'record' : 'records'} · seed: ${current.seed}`;
  const documents = current.kind === 'person' ? records.map(record => record.cpf) : current.kind === 'company' ? records.map(record => record.cnpj) : records;
  const validator = ['person', 'cpf'].includes(current.kind) ? isCPF : ['company', 'cnpj'].includes(current.kind) ? isCNPJ : null;
  $('checksum-summary').textContent = dataset ? 'Linked records · BRL cents' : validator ? `${documents.filter(validator).length}/${documents.length} checksums valid` : 'Generated placeholders';
  for (const button of document.querySelectorAll('[data-format]')) { button.setAttribute('aria-pressed', String(button.dataset.format === format)); button.disabled = dataset && button.dataset.format !== 'json'; }
  const args = ['mockbr', current.kind, '--count', String(dataset ? records.orders.length : records.length), `--seed=${quoteArg(current.seed)}`];
  if (dataset) args.push('--customers', String(records.customers.length), '--products', String(records.products.length));
  if (current.state) args.push('--state', current.state);
  if (['company', 'cnpj'].includes(current.kind)) args.push('--cnpj-type', current.cnpjType);
  if (current.formatted) args.push('--formatted');
  args.push('--format', format);
  $('command').textContent = args.join(' ');
  $('copy').textContent = 'Copy';
}

function quoteArg(value) {
  return /^[A-Za-z0-9_.-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\"'\"'")}'`;
}

$('generator').addEventListener('submit', event => {
  event.preventDefault();
  const count = Number($('count').value);
  try {
    if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Choose 1 to 1,000 records in the browser demo.');
    const options = { seed: $('seed').value, state: $('state').value || undefined, formatted: $('formatted').checked, cnpjType: $('cnpj-type').value };
    const next = $('kind').value === 'dataset' ? generateDataset({ seed: options.seed, state: options.state, formatted: options.formatted, customers: Number($('customers').value), products: Number($('products').value), orders: count }) : generate($('kind').value, count, options);
    records = next; current = { kind: $('kind').value, ...options }; dirty = false;
    $('error').hidden = true; $('copy').disabled = false; $('download').disabled = false;
    render(); announce(current.kind === 'dataset' ? 'Generated a shop fixture with linked customers, products, and orders.' : `Generated ${count} ${count === 1 ? 'record' : 'records'}.`);
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; }
});
for (const button of document.querySelectorAll('[data-format]')) button.addEventListener('click', () => {
  format = button.dataset.format;
  if (current) render();
  if (!dirty) announce(`Output format: ${format.toUpperCase()}.`);
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(output); $('copy').textContent = 'Copied'; announce('Output copied.'); }
  catch { announce('Clipboard unavailable. Select the output and copy it directly.'); $('output').focus(); }
});
$('download').addEventListener('click', () => {
  const type = { json: 'application/json', jsonl: 'application/x-ndjson', csv: 'text/csv' }[format];
  const url = URL.createObjectURL(new Blob([output], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a'); link.href = url; link.download = `${names[current.kind]}.${format}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(`Downloaded ${link.download}.`);
});
$('generator').requestSubmit();
