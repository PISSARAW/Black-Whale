import { createNenTechniqueState, type NenTechniqueState } from '@black-whale/nen-engine'
import type { FighterState } from '$lib/combat/types'
import type { DuelistState } from '$lib/hunt/duel/state'
import type { NenState as HuntNenState } from '$lib/hunt/nen/states'
import type { AdvancedNenState } from '$lib/hunt/nen/advanced'

export type TourNenZone = 'head' | 'torso' | 'hands' | 'feet'
export type TourNenState = NenTechniqueState<TourNenZone>

const zone = (value: 'head' | 'torso' | 'arms' | 'legs'): TourNenZone =>
  value === 'arms' ? 'hands' : value === 'legs' ? 'feet' : value

/** Projects Arena's authoritative combat state into the common audiovisual state. */
export function arenaNen(fighter: FighterState): TourNenState {
  const state = createNenTechniqueState<TourNenZone>()
  state.mode = fighter.mode
  state.in = fighter.in
  state.gyo = fighter.gyo
  state.ken = fighter.ken
  state.ko = fighter.ko ? zone(fighter.ko.zone) : null
  const attack = Math.max(0, Math.min(1, fighter.attackShare))
  state.ryu = state.ko ? { [state.ko]: 1 } : { hands: attack, [zone(fighter.guard)]: 1 - attack }
  return state
}

/** Projects Hunt's duel without changing its costs, timers or resolution. */
export function huntDuelNen(duelist: DuelistState): TourNenState {
  const state = createNenTechniqueState<TourNenZone>()
  state.mode = duelist.zetsu || duelist.broken ? 'zetsu' : duelist.ken ? 'ren' : 'ten'
  state.in = duelist.in
  state.gyo = duelist.gyo
  state.ken = duelist.ken
  state.ko = duelist.ko ? zone(duelist.ko) : null
  const attack = Math.max(0, Math.min(1, duelist.attack))
  state.ryu = state.ko ? { [state.ko]: 1 } : { hands: attack, [zone(duelist.guard)]: 1 - attack }
  return state
}

export function explorationNen(mode: HuntNenState, advanced?: AdvancedNenState): TourNenState {
  const state = createNenTechniqueState<TourNenZone>()
  state.mode = advanced?.ren ? 'ren' : mode
  state.shu = advanced?.shuItem ? [advanced.shuItem] : []
  return state
}
