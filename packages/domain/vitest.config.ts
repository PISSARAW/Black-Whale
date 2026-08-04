import { defineConfig } from 'vitest/config'

/**
 * Where this package's suite is.
 *
 * The same omission `packages/contracts` and `packages/nen-engine` fixed, with
 * the same consequence: without it, `vitest run` here walks up to the
 * repository's own config, whose `include` is `scripts/**`, and the package
 * answers "No test files found" and exits 1 — so `turbo test` failed on a suite
 * it had never once run. This is the package whose empty run aborted
 * the root `pnpm test` early, masking every result that came after it.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts', 'src/**/*.test.ts'],
  },
})
