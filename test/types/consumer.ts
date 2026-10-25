import { createMock, generate, serialize, isCPF, STATES, type Person, type Company, type StateCode } from '@almeida96/mockbr';

const people: Person[] = generate('person', 3, { seed: 'checkout', state: 'SP' });
const companies: Company[] = createMock({ seed: 42, cnpjType: 'numeric' }).many('company', 5);
const cpfs: string[] = generate('cpf');
const state: StateCode = STATES[0]!;
serialize(people, 'jsonl'); serialize(companies, 'csv'); serialize(cpfs);
isCPF(people[0]!.cpf); createMock({ state }).address();
// @ts-expect-error Unknown generator kinds must be rejected.
generate('invoice');
// @ts-expect-error State codes use the supported UF union.
createMock({ state: 'XX' });
// @ts-expect-error A company record does not contain a CPF.
companies[0]!.cpf;
