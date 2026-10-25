export type StateCode = 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';
export type CNPJType = 'numeric' | 'alphanumeric';
export type OutputFormat = 'json' | 'jsonl' | 'csv';
export interface MockOptions { seed?: string | number; state?: StateCode; formatted?: boolean; cnpjType?: CNPJType }
export interface Address { street: string; number: number; neighborhood: string; city: string; state: StateCode; postalCode: string; country: 'BR' }
export interface Person { name: string; cpf: string; email: string; phone: string; address: Address }
export interface Company { name: string; cnpj: string; email: string; phone: string; address: Address }
export interface RecordMap { person: Person; company: Company; cpf: string; cnpj: string; address: Address; phone: string }
export type Kind = keyof RecordMap;
export interface MockGenerator {
  person(): Person;
  company(): Company;
  cpf(): string;
  cnpj(): string;
  address(): Address;
  phone(): string;
  many<K extends Kind>(kind: K, count?: number): RecordMap[K][];
}
export const VERSION: string;
export const STATES: readonly StateCode[];
export const KINDS: readonly Kind[];
export function createMock(options?: MockOptions): MockGenerator;
export function generate<K extends Kind>(kind: K, count?: number, options?: MockOptions): RecordMap[K][];
export function isCPF(value: unknown): boolean;
export function isCNPJ(value: unknown): boolean;
export function formatCPF(value: string): string;
export function formatCNPJ(value: string): string;
export function cpfCheckDigits(base: string): string;
export function cnpjCheckDigits(base: string): string;
export function serialize(records: readonly RecordMap[Kind][], format?: OutputFormat): string;
