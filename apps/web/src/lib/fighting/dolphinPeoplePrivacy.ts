import type { FightBattlefield } from './preparationTypes'
import type { FightSide } from './types'

/** Operates only on the referee's already-cloned private view. */
export function concealDolphinPeople(
  scene: { battlefield?: FightBattlefield },
  side: FightSide,
): void {
  for (const entry of scene.battlefield?.entities ?? []) {
    const person = entry.person
    if (!person || person.control.side === side) continue
    const loan = person.loan?.lender.owner === side ? person.loan : undefined
    entry.person = { ...person, littleEyeScreen: undefined, loan }
  }
}
