import type { Plugin } from 'vite'

const MAX_JAVASCRIPT_BYTES = 500_000
// The combat engine currently has one real, mutually recursive module graph.
// It must remain atomic: splitting it creates a temporal-dead-zone crash during
// hydration. All acyclic client chunks retain the original 500 kB ceiling.
const COMBAT_CYCLE_BYTES = 650_000

function budgetFor(name: string): number {
  return name.startsWith('clash-runtime-cycle-') ? COMBAT_CYCLE_BYTES : MAX_JAVASCRIPT_BYTES
}

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
          modules: Object.entries(item.modules)
            .map(([id, module]) => ({ id, bytes: module.renderedLength }))
            .sort((a, b) => b.bytes - a.bytes),
        }))
        .sort((a, b) => b.bytes - a.bytes)
      for (const chunk of chunks) {
        const limit = budgetFor(chunk.name)
        if (chunk.bytes > limit)
          this.error(
            `${chunk.file} (${chunk.name}) exceeds its ${Math.round(limit / 1_000)} kB JavaScript budget (${chunk.bytes} bytes)\n` +
              chunk.modules
                .slice(0, 12)
                .map((module) => `  ${module.bytes} ${module.id}`)
                .join('\n'),
          )
      }
      this.emitFile({
        type: 'asset',
        fileName: 'bundle-budget.json',
        source: JSON.stringify(
          {
            limit: MAX_JAVASCRIPT_BYTES,
            exceptions: { 'clash-runtime-cycle-*': COMBAT_CYCLE_BYTES },
            chunks,
          },
          null,
          2,
        ),
      })
    },
  }
}
