import { createFighter } from '../fightState'
import { fightFormat } from '../formats'
import { setupIllumiNeedles } from '../illumiEquipment'
import { KAMEO_SPAWN } from './rounds'
import type { ArcadeFighter, FightSide, FightState, FighterId } from '../types'
import type { FightKameos, KameoPhase, KameoSlot } from './types'

export type KameoPicks = Partial<Record<FightSide, FighterId>>

const ON_STAGE: ReadonlySet<KameoPhase> = new Set(['entering', 'acting', 'leaving'])

/**
 * A fresh kameo body for one side, built like a leader at match creation: format health,
 * personal equipment and Illumi's needles. Training needle stocks belong to leaders only.
 */
export function createKameoFighter(state: FightState, side: FightSide, id: FighterId) {
  const body = createFighter({
    id,
    ...KAMEO_SPAWN[side],
    health: fightFormat(state.formatId).health,
  })
  const environment = { ...state.environment, needleStock: undefined }
  return setupIllumiNeedles({ ...state, environment, [side]: body })[side]
}

export function createKameoSlot(fighter: ArcadeFighter): KameoSlot {
  return { fighter, phase: 'reserve', call: null, cooldownFrames: 0, phaseFrames: 0 }
}

/**
 * Attaches kameos before the first frame. A kameo is a second, distinct character of
 * its own side; the opposing side may still pick the same character (mirror).
 */
export function withKameos(state: FightState, picks: KameoPicks): FightState {
  if (state.phase !== 'ready' || state.frame !== 0) throw Error('kameo-after-start')
  const kameos: FightKameos = { ...state.kameos }
  for (const side of ['player', 'opponent'] as const) {
    const id = picks[side]
    if (!id) continue
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
