import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('../..', import.meta.url))
export default defineConfig({
  root,
  publicDir: false,
  resolve: { alias: { $lib: fileURLToPath(new URL('../../src/lib', import.meta.url)) } },
  optimizeDeps: {
    entries: ['demos/hisoka-glb-nen/index.html', 'demos/hisoka-glb-nen/hybrid.html'],
  },
  server: { host: '127.0.0.1', port: 4319, strictPort: true },
})
