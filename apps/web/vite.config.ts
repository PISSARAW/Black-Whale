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
  plugins: [sveltekit()],
})
