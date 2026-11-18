import { createFighter } from '../fightState'
import { fightFormat } from '../formats'
import { isKameoId } from './catalogue'
import { KAMEO_SPAWN } from './rounds'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import type { FightKameos, KameoId, KameoPhase, KameoSlot } from './types'

export type KameoPicks = Partial<Record<FightSide, KameoId>>

const ON_STAGE: ReadonlySet<KameoPhase> = new Set(['entering', 'acting', 'leaving'])

/** A fresh kameo body for one side, built like a leader: format health and equipment. */
export function createKameoFighter(state: FightState, side: FightSide, id: KameoId) {
  return createFighter({ id, ...KAMEO_SPAWN[side], health: fightFormat(state.formatId).health })
}

export function createKameoSlot(fighter: ArcadeFighter): KameoSlot {
  return { fighter, phase: 'reserve', call: null, cooldownFrames: 0, phaseFrames: 0 }
}

/**
 * Attaches kameos before the first frame. Only catalogue characters are kameos: ship
 * characters outside the playable forty. Both sides may pick the same one (mirror).
 */
export function withKameos(state: FightState, picks: KameoPicks): FightState {
  if (state.phase !== 'ready' || state.frame !== 0) throw Error('kameo-after-start')
  const kameos: FightKameos = { ...state.kameos }
  for (const side of ['player', 'opponent'] as const) {
    const id = picks[side]
    if (!id) continue
    if (!isKameoId(id)) throw Error('kameo-unknown')
    if (id === state[side].id) throw Error('kameo-is-leader')
    kameos[side] = createKameoSlot(createKameoFighter(state, side, id))
  }
  return Object.keys(kameos).length ? { ...state, kameos } : state
}

export function kameoSlot(state: FightState, side: FightSide): KameoSlot | undefined {
  return state.kameos?.[side]
}

/** On stage, the kameo is a real body: it can hit and be hit. */
export function kameoOnStage(slot: KameoSlot | undefined): slot is KameoSlot {
  return slot !== undefined && ON_STAGE.has(slot.phase)
}
