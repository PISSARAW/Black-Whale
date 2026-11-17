import type { Plugin } from 'vite'

const MAX_JAVASCRIPT_BYTES = 500_000

/** Enforce the existing Vite client budget in CI and leave a measurable build artifact. */
export function bundleBudget(): Plugin {
  let client = false
  return {
    name: 'client-javascript-budget',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      client = !config.build.ssr
    },
    generateBundle(_options, bundle) {
      if (!client) return
      const chunks = Object.values(bundle)
        .filter((item) => item.type === 'chunk')
        .map((item) => ({
          file: item.fileName,
          name: item.name,
          bytes: Buffer.byteLength(item.code),
        }))
        .sort((a, b) => b.bytes - a.bytes)
      for (const chunk of chunks) {
        if (chunk.bytes > MAX_JAVASCRIPT_BYTES)
          this.error(
            `${chunk.name} (${chunk.file}) exceeds the unchanged 500 kB JavaScript budget (${chunk.bytes} bytes)`,
          )
      }
      this.emitFile({
        type: 'asset',
        fileName: 'bundle-budget.json',
        source: JSON.stringify({ limit: MAX_JAVASCRIPT_BYTES, chunks }, null, 2),
      })
    },
  }
}
