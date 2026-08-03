import { defineConfig } from 'vitest/config'

/**
 * Where this package's suite is.
 *
 * Without it `vitest run` walks up to the repository's own config, whose
 * `include` is `scripts/**`, and the package answers "No test files found" —
 * the suite exists but nothing ever runs it.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
  },
})
