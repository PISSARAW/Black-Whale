import { parseReplay, serializeReplay } from './codec'
import type { ArenaReplay } from './types'

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
  return encoded ? decodeReplay(encoded) : null
}

function encodeReplay(replay: ArenaReplay): string {
  const bytes = new TextEncoder().encode(serializeReplay(replay))
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
  return parseReplay(
    new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))),
  )
}
