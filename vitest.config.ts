import { defineConfig } from 'vitest/config'

/**
 * The root suite holds what belongs to no package: checks on the repository
 * itself. `turbo test` runs each workspace's own suite and never looks here, so
 * `pnpm test:ratchet` runs this one, and the CI runs both.
 */
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.ts'],
  },
})
