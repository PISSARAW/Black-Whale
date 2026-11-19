import { hasIllumiNeedles } from './illumiEquipment'
import { historicalMatterExists, historicalPartExists } from './historicalCopyLifetime'
import { physicalBodyKey } from './fightBodyIdentity'
import type { FightSide, FightState } from './types'

export function sutureNeedleId(state: FightState, side: FightSide): string {
  return state[side].equipmentProps?.needles?.entityId ?? `loadout:${physicalBodyKey(state, side)}`
}
/** The retained Hatsu supplies the thread, never its actual sewing instrument. */
export function machiSutureNeedleReady(state: FightState, side: FightSide, id?: string): boolean {
  const actor = state[side]
  if (!hasIllumiNeedles(actor) || (id && sutureNeedleId(state, side) !== id)) return false
  const prop = actor.equipmentProps?.needles
  return prop?.detachedPart
    ? historicalPartExists(state, prop.copyId)
    : historicalMatterExists(state, prop?.copyId)
}
