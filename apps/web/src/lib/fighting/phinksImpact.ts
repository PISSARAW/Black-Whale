import { phinksAttackSnapshot, phinksChargedHit } from './phinksAnimation'
import { cyclotronNenActive } from './phinksCyclotron'
import type { PhinksChargedHit } from './phinksAnimation'
import type { FightSide, FightState } from './types'

export interface RecordedCyclotronHit extends PhinksChargedHit {
  serial: number
  round: number
  frame: number
  concealed: boolean
}
declare module './types' {
  interface FightState {
    /** Last actual charged contact per body; presentation evidence, with no combat effect. */
    cyclotronContacts?: Partial<Record<FightSide, RecordedCyclotronHit>>
  }
}
/** Record the resolved result before a trade or a later projectile replaces the generic impact. */
export function recordCyclotronContact(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  if (!cyclotronNenActive(before[side])) return after
  const hit = phinksChargedHit(after, {
    impact: before.impact?.sequence,
    actors: [phinksAttackSnapshot(before.player), phinksAttackSnapshot(before.opponent)],
  })
  if (!hit || hit.owner !== side) return after
  const serial = (before.cyclotronContacts?.[side]?.serial ?? 0) + 1
  const record = {
    ...hit,
    id: `${side}:cyclotron-contact:${before.roundNumber}:${serial}`,
    serial,
    round: before.roundNumber,
    frame: before.frame,
    concealed: Boolean(after.impact?.concealed),
  }
  return { ...after, cyclotronContacts: { ...after.cyclotronContacts, [side]: record } }
}
/** Both outgoing contacts survive a simultaneous exchange, including erased attack objects. */
export function mergeCyclotronContacts(first: FightState, second: FightState) {
  if (!first.cyclotronContacts && !second.cyclotronContacts) return {}
  const cyclotronContacts: FightState['cyclotronContacts'] = {}
  for (const side of ['player', 'opponent'] as const) {
    const a = first.cyclotronContacts?.[side],
      b = second.cyclotronContacts?.[side]
    const newest = a && (!b || a.serial > b.serial) ? a : b
    if (newest) cyclotronContacts[side] = newest
  }
  return { cyclotronContacts }
}
