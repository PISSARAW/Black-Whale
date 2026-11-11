import { resolveControlledEntity } from '@black-whale/simulation-engine'
import type { WorldState } from '@black-whale/canon-engine'
import type { UnitCondition } from './conflict'
import type { StrategyHatsuCue } from './hatsuPresentation'

/**
 * Camilla's Cat's Name, the one passive Hatsu on the board: when the turn's
 * fighting eliminates her, she comes back and the recorded direct killer is
 * consumed in her place. Environmental or unattributed deaths do not invent a
 * target for the counterattack.
 */
export interface CatsNameCheck {
  state: WorldState
  /** The turn's conflict outcome; mutated in place when the Hatsu triggers. */
  conflict: {
    conditions: Record<string, UnitCondition>
    reports: string[]
    causedBy: Record<string, string>
  }
  /** Conditions before the turn's fighting. */
  previousConditions: Record<string, UnitCondition>
  hasCatsName: boolean
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
  const killer = conflict.causedBy[camilla.id]
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
