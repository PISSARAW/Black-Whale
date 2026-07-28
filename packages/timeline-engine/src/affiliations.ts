import { compareEventOrder, type OrderedEvent } from '@black-whale/domain'

/**
 * Which factions a character belongs to *at a given moment*.
 *
 * Allegiances on the Black Whale are not stable: guards defect, princes lose
 * their retinue. A membership row therefore only counts when the selected
 * event falls inside its [fromEvent, untilEvent) window — half-open, so a
 * membership that ends at the very event being viewed is already over.
 */

/** A membership row as this helper reads it. */
export interface AffiliationMembershipRow {
  characterId: string
  faction: { type: string }
  fromEvent: OrderedEvent
  untilEvent?: OrderedEvent | null
}

/** Faction types per character id, for the memberships active at `event`. */
export function activeFactionTypesAt(
  memberships: AffiliationMembershipRow[],
  event: OrderedEvent | null | undefined,
): Map<string, string[]> {
  const byCharacter = new Map<string, string[]>()
  if (!event) return byCharacter

  for (const membership of memberships) {
    const hasStarted = compareEventOrder(membership.fromEvent, event) <= 0
    const hasEnded = membership.untilEvent
      ? compareEventOrder(event, membership.untilEvent) >= 0
      : false
    if (!hasStarted || hasEnded) continue

    const types = byCharacter.get(membership.characterId) || []
    types.push(membership.faction.type)
    byCharacter.set(membership.characterId, types)
  }

  return byCharacter
}
