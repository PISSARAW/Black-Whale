import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { createRequire } from 'node:module'
import { dataChunks } from './build-tools/dataChunks'
import { manualChunks } from './build-tools/manualChunks'
import { clientChunks } from './build-tools/clientChunks'
import { bundleBudget } from './build-tools/bundleBudget'
import { clashSocket } from './build-tools/clashSocket'

const require = createRequire(import.meta.url)
const threeSource = require.resolve('three/src/Three.js')

export default defineConfig(({ isSsrBuild }) => ({
  test: {
    // Keep complete combat matrices within the memory budget of development machines.
    maxWorkers: 3,
    minWorkers: 1,
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
        onlyExplicitManualChunks: true,
      },
    },
  },
  resolve: { alias: [{ find: /^three$/, replacement: threeSource }] },
  // html-to-image publishes extensionless ESM imports. Bundle it for SSR so
  // Node never has to resolve those browser-oriented specifiers itself.
  ssr: { noExternal: ['html-to-image'] },
  plugins: [...dataChunks(), sveltekit(), clientChunks(), bundleBudget(), clashSocket()],
}))
