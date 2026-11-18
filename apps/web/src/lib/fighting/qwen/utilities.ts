import { arsenalOptions } from '../retrospectiveArsenal'
import type { ArsenalCommand } from '../retrospectiveTypes'
import type { FightState, FightSide } from '../types'
import type { TacticalPlan, UtilityObservation } from './protocol'

export function utilityKey(command: ArsenalCommand): `utility:${string}` {
  return `utility:${command.action}:${JSON.stringify(command.target ?? null)}`
}
/** Only choices already offered by native panels; no free-form commands or invented targets. */
export function availableUtilities(state: FightState, side: FightSide): UtilityObservation[] {
  return arsenalOptions(state, side)
    .filter((option) => option.ready && option.command.action !== 'support-consent')
    .map((option) => ({ command: option.command, key: utilityKey(option.command) }))
}
export function observeUtilities(state: FightState, side: FightSide): UtilityObservation[] {
  const available = availableUtilities(state, side)
  if (!available.length) return []
  const start = Math.floor(state.frame / 180) % available.length
  return [...available.slice(start), ...available.slice(0, start)].slice(0, 8)
}
export function plannedUtility(state: FightState, side: FightSide, plan: TacticalPlan) {
  if (!plan.move.startsWith('utility:')) return null
  return availableUtilities(state, side).find((option) => option.key === plan.move)?.command ?? null
}
