import type { Plugin } from 'vite'

const SOCKET_PATH = '/fighting/pvp/socket/'
const MODULE = '/src/lib/server/clashRollbackSocket.ts'

/**
 * Development only: lets the Clash rollback socket answer upgrades on Vite's own HTTP server.
 * In production `server.js` does the same around the adapter-node build. Vite's HMR socket
 * shares the server; it only takes upgrades that offer the `vite-hmr` protocol.
 */
export function clashSocket(): Plugin {
  return {
    name: 'clash-rollback-socket',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (!request.url?.startsWith(SOCKET_PATH)) return
        server
          .ssrLoadModule(MODULE)
          .then((module) => module.handleClashUpgrade(request, socket, head))
          .catch(() => socket.destroy())
      })
    },
  }
}
