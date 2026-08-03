import { defineConfig } from 'vitest/config'

/**
 * Where this package's suite is.
 *
 * Without it, `vitest run` in this directory walks up to the repository's own
 * config, whose `include` is `scripts/**` — so `pnpm --filter contracts test`
 * answered "No test files found" and `canon-lint.spec.ts` had never actually
 * run in CI. A lint whose refusals are never exercised is a lint nobody knows
 * the state of, which is the one thing ADR-001 cannot afford.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
  },
})
