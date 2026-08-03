import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // Only this app's own source. Without it the report is mostly SvelteKit's
      // runtime, which nobody here can change and which drowns the number that
      // matters.
      include: ['src/**/*.{ts,svelte}'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/app.d.ts', 'src/**/*.gen.ts'],
      reporter: ['text-summary', 'json-summary', 'lcov'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * The ship's blueprint gets a chunk of its own.
         *
         * It is 1.1 MB of canon read by ten routes, so Rollup already gave the
         * set a shared chunk — but it put the geometry *code* in there with it.
         * A one-line change to `blueprint.ts` therefore invalidated 900 kB of
         * data in every returning visitor's cache, for a release that changed
         * nothing about the ship.
         *
         * Split apart, the data chunk's hash only moves when `data/` moves,
         * which is what makes the `immutable` in its URL worth anything: the
         * blueprint is downloaded once and then not again until the canon
         * itself changes. ADR-001 chantier 4.
         */
        manualChunks(id: string) {
          if (id.includes('data/ship/blueprint.json')) return 'ship-blueprint'
          return undefined
        },
      },
    },
  },
  plugins: [sveltekit()],
})
