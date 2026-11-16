import type { Plugin } from 'vite'

/** Node SSR externalizes Three.js, so client subsystem groups have no server payload. */
export function clientChunks(): Plugin {
  return {
    name: 'client-chunks-only',
    apply: 'build',
    configResolved(config) {
      if (!config.build.ssr) return
      const output = config.build.rollupOptions.output
      for (const options of Array.isArray(output) ? output : [output]) {
        if (options) delete options.manualChunks
      }
    },
  }
}
