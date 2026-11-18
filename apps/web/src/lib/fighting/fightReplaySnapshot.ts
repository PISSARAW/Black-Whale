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
  validateShape(value, createFightState(setup.player, setup.opponent, setup))
  return value as unknown as FightState
}
function validateIdentity(value: Record<string, unknown>, setup: ReplaySetup) {
  const player = value.player as Record<string, unknown>
  const opponent = value.opponent as Record<string, unknown>
  if (
    !replayBodyMatches(player, setup.player) ||
    !replayBodyMatches(opponent, setup.opponent) ||
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

function replayBodyMatches(body: Record<string, unknown>, id: string): boolean {
  return (body.halkenburgOrigin ?? body.id) === id
}
