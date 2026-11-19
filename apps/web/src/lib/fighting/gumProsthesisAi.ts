import { arsenalOptions } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import type { ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** Selects only an application which the actual owner can currently execute. */
export function prosthesisSkinAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  if (!actor.gumProstheses || actor.textureSurprise || Math.abs(actor.x - state.player.x) <= 12)
    return null
  const options = arsenalOptions(state, 'opponent')
  const option =
    actor.textureTarget !== 'gum-prostheses'
      ? options.find(
          (entry) =>
            entry.ready &&
            entry.command.action === 'texture-target' &&
            entry.command.target === 'gum-prostheses',
        )
      : options.find(isTextureApplication)
  if (!option) return null
  const next = performArsenalAction({ state, side: 'opponent', command: option.command }, perform)
  return next === state ? null : next
}

function isTextureApplication(option: ArsenalOption): boolean {
  if (!option.ready) return false
  if (option.command.action === 'texture-apply') return true
  return (
    option.command.target === 'hisoka:downSpecial' &&
    ['copied-move', 'dolphin-move'].includes(option.command.action)
  )
}
