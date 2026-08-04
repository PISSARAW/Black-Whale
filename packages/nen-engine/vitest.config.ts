import { defineConfig } from 'vitest/config'

/**
 * Where this package's suite is.
 *
 * The same omission `packages/contracts` fixed, with the same consequence:
 * without it, `vitest run` here walks up to the repository's own config, whose
 * `include` is `scripts/**`, and the whole engine suite answers "No test files
 * found" — and exits 1, so `turbo test` was failing on a package whose tests it
 * had never run. Nen's rules are the ones every surface reads; they cannot be
 * the ones nobody checks.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
  },
})
