import { battleAppearance } from './battleCantabileRules'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

/** An opaque physical body reference, independent of disguise, copied Hatsu or active relay. */
export function physicalBodyKey(state: FightState, side: FightSide): string {
  return `${side}:${state.teamMatch?.seats[side].active ?? 0}`
}
export function visibleBodyAppearance(actor: ArcadeFighter): FighterId {
  return battleAppearance({ ...actor, id: actor.nenOwner ?? actor.id })
}
