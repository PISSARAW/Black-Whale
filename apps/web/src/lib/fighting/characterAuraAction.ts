import { performCrossGameAction } from './crossGameAction'
import { performMachiAction } from './machiAction'
import { performCyclotronAction } from './phinksAction'
import { performPredatorAction } from './predatorAction'
import { performBashoAction } from './bashoAction'
import { performMoonlightAction } from './moonlightAction'
import { performParallelFutureAction } from './parallelFutureAbility'
import { performKurapikaAction } from './kurapikaActions'
import { performChrolloBookAction } from './chrolloBookAction'
import { hisokaTechniqueAllowed } from './hisokaTechnique'
import { performLeorioAction } from './leorioAttack'
import { performBiscuitFormAction } from './biscuitFormAction'
import { performLsdfAction } from './lsdfAction'
import { performProjectionAction } from './hanzoProjectionAction'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** Preserve character command ordering before the shared attack path. */
export function characterAuraAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const attempts = [
    () => performCrossGameAction(options),
    () => performMachiAction(options, perform),
    () => performPredatorAction(options),
    () => performParallelFutureAction(options),
    () => performCyclotronAction(options),
    () => performKurapikaAction(options, perform),
    () => performChrolloBookAction(options),
    () =>
      options.kind === 'special' &&
      !hisokaTechniqueAllowed(options.state, options.side, options.moveId)
        ? options.state
        : null,
    () => performBiscuitFormAction(options),
    () => performLeorioAction(options, perform),
    () => performBashoAction(options),
    () => performMoonlightAction(options),
    () => performLsdfAction(options),
    () => performProjectionAction(options),
  ]
  for (const attempt of attempts) {
    const next = attempt()
    if (next) return next
  }
  return null
}
