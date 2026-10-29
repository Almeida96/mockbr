#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { generate, generateDataset, serialize, VERSION } from '../src/index.js';

const help = `Usage: mockbr <kind> [options]

Kinds: person, company, cpf, cnpj, address, phone, dataset

  --count <n>             Number of records, 0–10000 (default: 5)
  --customers <n>         Dataset customers (default: 20)
  --products <n>          Dataset products (default: 10)
                         For dataset, --count sets orders; JSON output only
  --seed <text>           Repeatable seed (default: mockbr)
  --state <UF>            Brazilian state, for example SP or BA
  --cnpj-type <type>      alphanumeric or numeric (default: alphanumeric)
  --formatted            Add document, phone, and postal-code punctuation
  --format <format>      json, jsonl, or csv (default: json)
  --out <path>           Write to a file instead of stdout
  --force                Replace an existing output file
  --help                 Show this help
  --version              Print the version

Examples:
  mockbr person --count 20 --seed checkout --state SP
  mockbr company --cnpj-type numeric --format jsonl --out companies.jsonl
  mockbr cpf --formatted --format csv

Generated data is for fixtures. Checksum validation is not a registry lookup.
`;

function parse(args) {
  const kind = args.shift();
  if (!kind || kind.startsWith('-')) throw new Error('Choose a record kind. Run mockbr --help for usage.');
  const flags = Object.create(null);
  const values = new Set(['count', 'seed', 'state', 'cnpj-type', 'format', 'out', 'customers', 'products']);
  for (let i = 0; i < args.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(args[i]);
    if (!match || (!values.has(match[1]) && !['formatted', 'force'].includes(match[1]))) throw new Error(`Unknown option: ${args[i]}`);
    const [, name, inline] = match;
    if (name in flags) throw new Error(`Option repeated: --${name}`);
    if (values.has(name)) {
      const value = inline ?? args[++i];
      if (!value || (inline === undefined && value.startsWith('--'))) throw new Error(`Missing value for --${name}.`);
      flags[name] = value;
    } else {
      if (inline !== undefined) throw new Error(`--${name} does not take a value.`);
      flags[name] = true;
    }
  }
  if (flags.count !== undefined && !/^(0|[1-9][0-9]*)$/.test(flags.count)) throw new Error('Count must be an integer from 0 to 10,000.');
  if (flags.force && !flags.out) throw new Error('--force requires --out.');
  for (const name of ['customers', 'products']) {
    if (flags[name] !== undefined && (kind !== 'dataset' || !/^(0|[1-9][0-9]*)$/.test(flags[name]))) throw new Error(`--${name} requires a dataset and an integer from 0 to 10,000.`);
  }
  if (kind === 'dataset' && ((flags.format && flags.format !== 'json') || flags['cnpj-type'])) throw new Error('Datasets use JSON and do not use --cnpj-type.');
  return { kind, flags };
}

process.stdout.on('error', error => { if (error.code === 'EPIPE') process.exit(0); else { process.stderr.write(`${error.message}\n`); process.exit(1); } });

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) process.stdout.write(help);
  else if (args.length === 1 && args[0] === '--version') process.stdout.write(`${VERSION}\n`);
  else {
    const { kind, flags } = parse(args);
    const records = kind === 'dataset' ? generateDataset({ seed: flags.seed ?? 'mockbr', state: flags.state, formatted: Boolean(flags.formatted), customers: flags.customers === undefined ? 20 : Number(flags.customers), products: flags.products === undefined ? 10 : Number(flags.products), orders: flags.count === undefined ? 50 : Number(flags.count) }) : generate(kind, flags.count === undefined ? 5 : Number(flags.count), {
      seed: flags.seed ?? 'mockbr', state: flags.state,
      formatted: Boolean(flags.formatted), cnpjType: flags['cnpj-type'] ?? 'alphanumeric',
    });
    const output = kind === 'dataset' ? JSON.stringify(records, null, 2) + '\n' : serialize(records, flags.format ?? 'json');
    if (flags.out) {
      try { writeFileSync(flags.out, output, { encoding: 'utf8', flag: flags.force ? 'w' : 'wx' }); }
      catch (error) {
        if (error.code === 'EEXIST') throw new Error('Output file already exists. Choose another path or use --force.');
        throw new Error(`Could not write the output file: ${error.message}`);
      }
    } else process.stdout.write(output);
  }
} catch (error) { process.stderr.write(`mockbr: ${error.message}\n`); process.exitCode = 2; }
