import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dataChunks } from '../../build-tools/dataChunks'
import { bundleBudget } from '../../build-tools/bundleBudget'

const root = fileURLToPath(new URL('../..', import.meta.url))
const require = createRequire(import.meta.url)
export default defineConfig({
  root,
  publicDir: false,
  cacheDir: '/tmp/black-whale-faces-vite-cache',
  plugins: [
    ...dataChunks(),
    svelte({ configFile: false, compilerOptions: { dev: false } }),
    bundleBudget(),
  ],
  resolve: {
    alias: [
      { find: '$lib', replacement: `${root}/src/lib` },
      { find: /^three$/, replacement: require.resolve('three/src/Three.js') },
    ],
  },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-face-readability/index.html'] },
  build: {
    outDir: '/tmp/black-whale-faces-production',
    emptyOutDir: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: `${root}/ui-tests/fighting-face-readability/index.html`,
      output: { preserveModules: true, preserveModulesRoot: root },
    },
  },
  server: { host: '127.0.0.1', port: 3011 },
  preview: { host: '127.0.0.1', port: 3012 },
})
