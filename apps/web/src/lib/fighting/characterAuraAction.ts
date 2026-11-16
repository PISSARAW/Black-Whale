import { performVoconteDoorAction } from './voconteDoorAction'
import { performIllumiAction } from './illumiAction'
import { performMaryAction } from './bloodyMaryAction'
import { performBattleCantabileAction } from './battleCantabileAction'
import { performBiohazardAction } from './biohazardAction'
import { performLynchAction } from './lynchAction'
import { performMachiAction } from './machiAction'
import { performCrossGameAction } from './crossGameAction'
import { performPredatorAction } from './predatorAction'
import { performCyclotronAction } from './phinksAction'
import { performParallelFutureAction } from './parallelFutureAbility'
import { performKurapikaAction } from './kurapikaActions'
import { performChrolloBookAction } from './chrolloBookAction'
import { performBashoAction } from './bashoAction'
import { performMoonlightAction } from './moonlightAction'
import { performLeorioAction } from './leorioAttack'
import { performBiscuitFormAction } from './biscuitFormAction'
import { performLsdfAction } from './lsdfAction'
import { performProjectionAction } from './hanzoProjectionAction'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** Keep the existing order of character commands before the common attack path. */
export function characterAuraAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const attempts = [
    () => performVoconteDoorAction(options),
    () => performIllumiAction(options),
    () => performMaryAction(options),
    () => performBattleCantabileAction(options),
    () => performBiohazardAction(options),
    () => performLynchAction(options),
    () => performMachiAction(options, perform),
    () => performCrossGameAction(options),
    () => performPredatorAction(options),
    () => performParallelFutureAction(options),
    () => performCyclotronAction(options),
    () => performKurapikaAction(options, perform),
    () => performChrolloBookAction(options),
    () => performBashoAction(options),
    () => performMoonlightAction(options),
    () => performLeorioAction(options, perform),
    () => formOrJudicialAction(options),
    () => performProjectionAction(options),
  ]
  for (const attempt of attempts) {
    const next = attempt()
    if (next) return next
  }
  return null
}

function formOrJudicialAction(options: AuraAttackOptions): FightState | null {
  const form = performBiscuitFormAction(options)
  return performLsdfAction(options) ?? form
}
