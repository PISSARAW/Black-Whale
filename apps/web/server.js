// Production entry (Dockerfile.web): the adapter-node build, plus WebSocket upgrades for the
// Clash rollback relay. SvelteKit has no upgrade hook, so `hooks.server.ts` imports
// `$lib/server/clashRollbackSocket`, which publishes its handler on globalThis. Importing the
// build initialises SvelteKit (hooks included) before it starts listening.
import { server } from './build/index.js'

server.server.on('upgrade', (request, socket, head) => {
  const upgrade = globalThis.__clashRollbackUpgrade
  if (!upgrade || !upgrade(request, socket, head)) socket.destroy()
})
