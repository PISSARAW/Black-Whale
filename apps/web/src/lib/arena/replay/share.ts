import { parseReplay, serializeReplay } from './codec'
import type { ArenaReplay } from './types'
import { buildCombatTerrain } from '../terrain'

export const MAX_REPLAY_URL_BYTES = 100_000

export function replayShareUrl(replay: ArenaReplay, currentUrl: string): string {
  const url = new URL(currentUrl)
  url.hash = `replay=${encodeReplay(replay)}`
  if (new TextEncoder().encode(url.href).length > MAX_REPLAY_URL_BYTES) {
    throw new Error('Arena replay URL exceeds 100 KB')
  }
  return url.href
}

export function replayFromUrl(value: string): ArenaReplay | null {
  const encoded = new URL(value).hash.match(/^#replay=([A-Za-z0-9_-]+)$/)?.[1]
  if (!encoded) return null
  try {
    return decodeReplay(encoded)
  } catch {
    return null
  }
}

function encodeReplay(replay: ArenaReplay): string {
  const compact = serializeReplay({
    ...replay,
    setup: { ...replay.setup, terrain: { id: replay.setup.terrain.id } },
  } as ArenaReplay)
  const bytes = new TextEncoder().encode(compact)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decodeReplay(encoded: string): ArenaReplay {
  const padded = encoded
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(encoded.length / 4) * 4, '=')
  const binary = atob(padded)
  const compact = JSON.parse(
    new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))),
  ) as ArenaReplay
  const terrain = buildCombatTerrain(compact.setup.terrain.id)
  compact.setup.terrain = { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls }
  return parseReplay(serializeReplay(compact))
}
