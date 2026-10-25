# Contributing

Install dependencies with `pnpm install --frozen-lockfile`. Run `pnpm check`, `pnpm test`, and `pnpm build` before submitting a change. For package changes, also run `pnpm pack --out mockbr-0.1.0.tgz` and `pnpm pack:check`.

Keep runtime modules compatible with Node.js 22 and current browsers. Add a regression test when fixing a bug. Changes to word lists, random draws, or record fields can change seeded output; call those out in the changelog.

Use small synthetic fixtures in examples and bug reports. A report about document validation should include the expected check-digit calculation or a public technical reference.
