import type { HuntTerrainId } from './arena'
import type { HuntHatsuId } from './hatsu'
import type { HunterProfileId } from './hunter/profiles'
import type { HuntAction } from './state'

export const HUNT_REPLAY_VERSION = 3 as const

export interface RecordedHuntAction {
  at: number
  action: HuntAction
}
export interface HuntReplayV3 {
  schemaVersion: typeof HUNT_REPLAY_VERSION
  contractId: string
  seed: number
  terrain: HuntTerrainId
  hatsu: HuntHatsuId
  hunter: HunterProfileId
  actions: RecordedHuntAction[]
  checksum: string
}

type ReplayBody = Omit<HuntReplayV3, 'checksum'>

export function createReplay(body: ReplayBody): HuntReplayV3 {
  return { ...body, actions: body.actions.map(cloneAction), checksum: checksum(body) }
}

export function appendReplayAction(
  replay: HuntReplayV3,
  at: number,
  action: HuntAction,
): HuntReplayV3 {
  return createReplay({ ...withoutChecksum(replay), actions: [...replay.actions, { at, action }] })
}

export function encodeReplay(replay: HuntReplayV3): string {
  return toBase64Url(JSON.stringify(replay))
}

export function decodeReplay(encoded: string): HuntReplayV3 | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as HuntReplayV3
    if (parsed.schemaVersion !== HUNT_REPLAY_VERSION || !Array.isArray(parsed.actions)) return null
    const body = withoutChecksum(parsed)
    return checksum(body) === parsed.checksum ? parsed : null
  } catch {
    return null
  }
}

function withoutChecksum(replay: HuntReplayV3): ReplayBody {
  const { checksum: _checksum, ...body } = replay
  return body
}

function cloneAction(entry: RecordedHuntAction): RecordedHuntAction {
  return { at: entry.at, action: structuredClone(entry.action) }
}

function checksum(body: ReplayBody): string {
  const text = JSON.stringify(body)
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}
