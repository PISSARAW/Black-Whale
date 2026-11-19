import { performArsenalAction } from './arsenalExecution'
import { arsenalOptions } from './retrospectiveArsenal'
import { perceivedOpponentGap } from './opponentAwareness'
import type { FightState } from './types'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArsenalCommand } from './retrospectiveTypes'

/** Uses its own equipment and perceived distance; never reads an enemy reserve or forecast. */
export function fourCombatAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (state.frame % 120 !== 0) return null
  const command = ownSupplement(state)
  if (!command) return null
  const next = performArsenalAction({ state, side: 'opponent', command }, perform)
  return next === state ? null : next
}
function ownSupplement(state: FightState): ArsenalCommand | null {
  const actor = state.opponent,
    gap = perceivedOpponentGap(state)
  if (actor.paralyticPoison && !actor.paralyticPoison.contained) return { action: 'weapon-contain' }
  if (actor.conditionedNeedle) return { action: 'illumi-needle-remove' }
  if (!Number.isFinite(gap)) return null
  return nativeSupplement(state, gap)
}
function nativeSupplement(state: FightState, gap: number): ArsenalCommand | null {
  const actor = state.opponent
  if (actor.id === 'hisoka' && gap > 25 && !actor.gumHeartArmed && !actor.gumHeartSpent)
    return { action: 'gum-heart' }
  if (
    ['leorio', 'hanzo'].includes(actor.id) &&
    !actor.historicalWeapon &&
    !actor.historicalWeaponSpent
  )
    return { action: 'weapon-ready' }
  if (actor.id === 'franklin' && !actor.franklinAim)
    return { action: 'franklin-aim', target: 'sweep' }
  return evidenceCommand(state)
}
function evidenceCommand(state: FightState): ArsenalCommand | null {
  if (state.opponent.id !== 'shizuku') return null
  return (
    arsenalOptions(state, 'opponent').find((o) => o.command.action === 'blinky-evidence' && o.ready)
      ?.command ?? null
  )
}
