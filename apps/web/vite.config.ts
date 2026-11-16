import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { createRequire } from 'node:module'
import { dataChunks } from './build-tools/dataChunks'
import { manualChunks } from './build-tools/manualChunks'
import { clientChunks } from './build-tools/clientChunks'
import { bundleBudget } from './build-tools/bundleBudget'

const require = createRequire(import.meta.url)
const threeSource = require.resolve('three/src/Three.js')

export default defineConfig(({ isSsrBuild }) => ({
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
        manualChunks: isSsrBuild ? undefined : manualChunks,
      },
    },
  },
  resolve: { alias: [{ find: /^three$/, replacement: threeSource }] },
  plugins: [...dataChunks(), sveltekit(), clientChunks(), bundleBudget()],
}))
