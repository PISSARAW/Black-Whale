// Serves one Clash demonstration page for live viewing, without SvelteKit.
// node apps/web/scripts/serve-fighting-demo.mjs [--demo=signature-combos] [--port=3210]
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const demo = arg('demo', 'signature-combos')
const port = Number(arg('port', '3210'))

const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  optimizeDeps: { entries: [`demos/fighting-${demo}/index.html`] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port, strictPort: true },
  css: { postcss: { plugins: [] } },
})
await server.listen()
console.log(`http://127.0.0.1:${port}/demos/fighting-${demo}/`)
