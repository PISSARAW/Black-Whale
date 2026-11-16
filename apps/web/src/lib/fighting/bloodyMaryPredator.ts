import { maryBusy } from './bloodyMary'
import { releaseMary } from './bloodyMaryCapture'
import type { PredatorPrey } from './predatorPrey'
import type { FightSide, FightState } from './types'

/** Existing Predator duel adapter now observes the deployed blood, never a stun counter. */
export const maryPredatorPrey: PredatorPrey = {
  id: 'bloody-mary',
  source: 'zakuro',
  nameFr: 'Bloody Mary',
  nameEn: 'Bloody Mary',
  live: (state, side) => maryBusy(state[side]),
  point: (state, side) =>
    state[side].bloodyMary?.tendril ?? state[side].bloodyMary?.drops[0] ?? state[side],
  consume: consumeMaryPrey,
}

function consumeMaryPrey(state: FightState, side: FightSide): FightState {
  const target = side === 'player' ? 'opponent' : 'player'
  const released = state[target].maryCapture?.owner === side ? releaseMary(state, target) : state
  const blood = released[side].bloodyMary
  if (!blood) return released
  const consumed = blood.tendril
    ? { ...blood, tendril: undefined }
    : { ...blood, drops: blood.drops.slice(1) }
  return { ...released, [side]: { ...released[side], bloodyMary: consumed } }
}
