import { resolveControlledEntity } from '@black-whale/simulation-engine'
import type { WorldState } from '@black-whale/canon-engine'
import type { UnitCondition } from './conflict'
import type { StrategyHatsuCue } from './hatsuPresentation'

/**
 * Camilla's Cat's Name, the one passive Hatsu on the board: when the turn's
 * fighting eliminates her, she comes back and an opposing unit standing with
 * her is consumed in her place.
 *
 * Moved out of the store's `endTurn` as it was; the rule still picks the
 * killer by sorted id rather than by who struck (see docs/decoupage-notes.md).
 */
export interface CatsNameCheck {
  state: WorldState
  /** The turn's conflict outcome; mutated in place when the Hatsu triggers. */
  conflict: { conditions: Record<string, UnitCondition>; reports: string[] }
  /** Conditions before the turn's fighting. */
  previousConditions: Record<string, UnitCondition>
  hasCatsName: boolean
  /** Living units of every active faction other than Camilla's. */
  opposingEntityIds: readonly string[]
  report: string
  shortReport: string
}

export function triggerCatsName(check: CatsNameCheck): Omit<StrategyHatsuCue, 'seq'> | null {
  const { state, conflict } = check
  const camilla = resolveControlledEntity(state, 'prince-camilla')
  if (
    !camilla ||
    !check.hasCatsName ||
    check.previousConditions[camilla.id] === 'ELIMINATED' ||
    conflict.conditions[camilla.id] !== 'ELIMINATED'
  )
    return null
  const locationId = state.presences[camilla.id]?.locationId
  const killer = check.opposingEntityIds
    .filter((id) => state.presences[id]?.locationId === locationId)
    .sort()[0]
  if (!killer) return null
  conflict.conditions[camilla.id] = 'READY'
  conflict.conditions[killer] = 'ELIMINATED'
  conflict.reports.push(check.report)
  return {
    abilityId: 'cats-name',
    sourceCharacterId: 'prince-camilla',
    sourceLocationId: locationId ?? '',
    targetLocationId: locationId ?? '',
    report: check.shortReport,
  }
}
