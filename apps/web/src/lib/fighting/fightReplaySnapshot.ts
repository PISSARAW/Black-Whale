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
function validateShape(value: unknown, template: unknown): void {
  if (template === null || template === undefined) return
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) throw Error('invalid-replay')
    return
  }
  if (!object(template)) {
    if (typeof value !== typeof template) throw Error('invalid-replay')
    return
  }
  if (!object(value)) throw Error('invalid-replay')
  for (const [key, field] of Object.entries(template)) validateShape(value[key], field)
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
