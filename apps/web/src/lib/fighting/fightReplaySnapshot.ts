import { FIGHTING_ROSTER } from './roster'
import type { FighterId } from './types'
import { decodeReplay, encodeReplay } from './clashReplayCodec'
import { createFightState } from './fightState'
import type { FightState } from './types'
import type { ReplaySetup } from './fightReplayTypes'

export const encodeFightSnapshot = (state: FightState) => encodeReplay(state)
function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
export function decodeFightSnapshot(text: string, setup: ReplaySetup): FightState {
  const value = decodeReplay(text)
  if (!object(value) || !object(value.player) || !object(value.opponent))
    throw Error('invalid-replay')
  validateIdentity(value, setup)
  validateShape(
    value,
    createFightState(physicalBodyId(value.player), physicalBodyId(value.opponent), setup),
  )
  return value as unknown as FightState
}
function validateIdentity(value: Record<string, unknown>, setup: ReplaySetup) {
  const player = value.player as Record<string, unknown>
  const opponent = value.opponent as Record<string, unknown>
  const origins = object(value.halkSoulOrigins) ? value.halkSoulOrigins : {}
  if (
    !replayBodyMatches(player, setup.player, origins.player) ||
    !replayBodyMatches(opponent, setup.opponent, origins.opponent) ||
    value.mode !== setup.mode ||
    value.formatId !== setup.formatId
  )
    throw Error('invalid-replay')
  validateSeed(value.rng)
}
function validateSeed(seed: unknown) {
  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw Error('invalid-replay')
}
const BOOK_SLOTS = new Set<unknown>([undefined, null, 0, 1, 2, 3, 'stolen'])

function validateBookSlot(value: unknown, path: string): boolean {
  if (!/^(player|opponent)\.chrolloBook\.(openSlot|bookmarkSlot)$/.test(path)) return false
  if (!BOOK_SLOTS.has(value)) throw Error('invalid-replay')
  return true
}

function validateShape(value: unknown, template: unknown, path = ''): void {
  if (validateBookSlot(value, path)) return
  if (template === null || template === undefined || missingPossession(value, path)) return
  if (Array.isArray(template) || !object(template)) {
    validateLeaf(value, template)
    return
  }
  if (!object(value)) throw Error('invalid-replay')
  for (const [key, field] of Object.entries(template))
    validateShape(value[key], field, [path, key].filter(Boolean).join('.'))
}
function validateLeaf(value: unknown, template: unknown): void {
  const valid = Array.isArray(template) ? Array.isArray(value) : typeof value === typeof template
  if (!valid) throw Error('invalid-replay')
}
function missingPossession(value: unknown, path: string): boolean {
  return value === undefined && optionalPossession(path)
}

/** Physical possessions and consumed historical premises may be absent from a later snapshot. */
function optionalPossession(path: string): boolean {
  if (path === 'preparedAsphyxia') return true
  return /^(player|opponent)\.(writingKit|paperKit|blackVoiceGear(?:\.phone)?|gumResuscitationProgram|asphyxiaCertificate)$/.test(
    path,
  )
}

function replayBodyMatches(body: Record<string, unknown>, id: string, origin: unknown): boolean {
  if ((body.halkenburgOrigin ?? body.id) === id) return true
  return origin === id && object(body.halkSoul) && typeof body.halkSoul.key === 'string'
}
function physicalBodyId(body: Record<string, unknown>): FighterId {
  const found = FIGHTING_ROSTER.find((fighter) => fighter.id === body.id)
  if (!found) throw Error('invalid-replay')
  return found.id
}
