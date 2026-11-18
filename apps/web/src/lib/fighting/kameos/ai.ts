import { otherSide } from '../frameData'
import type { FightSide, FightState } from '../types'
import { kameoDefinition } from './catalogue'
import type { KameoDefinition, KameoRole } from './catalogue'
import type { KameoCallId, KameoId } from './types'

interface Situation {
  state: FightState
  side: FightSide
  gap: number
  definition: KameoDefinition
}

type Reading = (situation: Situation) => KameoCallId | undefined

/** Deterministic: each role is called when its effect would matter, never at random. */
const READINGS: Record<KameoRole, Reading> = {
  soin: ({ state, side }) =>
    state[side].health < state[side].maxHealth * 0.6 ? 'back' : undefined,
  defense: ({ state, side, gap }) =>
    state[otherSide(side)].attack && gap <= 14 ? 'neutral' : undefined,
  boost: ({ state, side, gap }) =>
    gap <= 14 && state[side].hatsuEffects.coinCharges < 3 ? 'neutral' : undefined,
  attaque: ({ gap, definition }) => (gap <= reach(definition) + 8 ? 'forward' : undefined),
  zone: ({ gap, definition }) => (gap <= reach(definition) ? 'neutral' : undefined),
  piege: ({ gap }) => (gap >= 10 && gap <= 30 ? 'forward' : undefined),
}

function reach(definition: KameoDefinition): number {
  return definition.delivery.kind === 'reach' ? definition.delivery.range : 0
}

/** The AI side's call this frame: only from a ready reserve, only when it would help. */
export function aiKameoCall(state: FightState, side: FightSide): KameoCallId | undefined {
  const slot = state.kameos?.[side]
  if (!slot || slot.phase !== 'reserve' || slot.cooldownFrames > 0) return undefined
  const definition = kameoDefinition(slot.fighter.id as KameoId)
  const gap = Math.abs(state[side].x - state[otherSide(side)].x)
  return READINGS[definition.role]({ state, side, gap, definition })
}
