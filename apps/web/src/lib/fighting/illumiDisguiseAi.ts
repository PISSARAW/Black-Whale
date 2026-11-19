import { hasIllumiNeedles } from './illumiEquipment'
import { equippedDolphin } from './dolphinBorrowing'
import { chrolloHasActivePage } from './chrolloBook'
import { arsenalOptions } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import type { ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightState } from './types'

/** Without carried needles the AI chooses the attested unpinned application, never free equipment. */
export function illumiDisguiseAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  if (!faceAiSource(actor)) return null
  if (!unpinnedOpening(actor, state.player.x)) return null
  const options = arsenalOptions(state, 'opponent')
  const option =
    actor.illumiDisguisePlan !== 'unpinned-hisoka'
      ? options.find(
          (entry) =>
            entry.ready &&
            entry.command.action === 'illumi-face-mode' &&
            entry.command.target === 'unpinned-hisoka',
        )
      : options.find(isFaceApplication)
  if (!option) return null
  const next = performArsenalAction({ state, side: 'opponent', command: option.command }, perform)
  return next === state ? null : next
}

function unpinnedOpening(actor: ArcadeFighter, otherX: number): boolean {
  return (
    !hasIllumiNeedles(actor) &&
    !actor.illumi?.disguised &&
    !actor.illumi?.preparation &&
    Math.abs(actor.x - otherX) > 12
  )
}

function faceAiSource(actor: ArcadeFighter): boolean {
  if (actor.id === 'illumi') return true
  if (actor.id === 'chrollo' && chrolloHasActivePage(actor, 'illumi')) return true
  const held = equippedDolphin(actor)
  return Boolean(held?.loaded && !held.returned && held.source === 'illumi')
}

function isFaceApplication(option: ArsenalOption): boolean {
  if (!option.ready) return false
  if (option.command.action === 'illumi-face-apply') return true
  return (
    option.command.target === 'illumi:backSpecial' &&
    ['copied-move', 'dolphin-move'].includes(option.command.action)
  )
}
