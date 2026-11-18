import { outsideDuelAbility } from './outsideDuelAbility'
import { performArsenalAction } from './arsenalExecution'
import { performArsenalCommand } from './retrospectiveArsenal'
import { dolphinArsenalOptions } from './dolphinArsenal'
import { dolphinIsBusy } from './kurapikaDolphin'
import { moveById } from './movesets'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** A recipient orders its own actual loan; no donor resources or conditions are manufactured. */
export function dolphinLoanAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (!state.opponent.dolphinLoan) return null
  return (
    prosthesisLoanAi(state) ??
    cookieLoanAi(state) ??
    loanAttackAi(state, perform) ??
    preparedLoanAi(state, perform) ??
    finishLoanAi(state, perform)
  )
}

function prosthesisLoanAi(state: FightState): FightState | null {
  if (!state.opponent.bodyDamage) return null
  if (state.opponent.gumProstheses && Math.abs(state.opponent.x - state.player.x) <= 12) return null
  const action = state.opponent.gumProstheses ? 'gum-spring-step' : 'gum-prosthesis'
  const next = performArsenalCommand(state, 'opponent', { action, loan: true })
  return next === state ? null : next
}
function cookieLoanAi(state: FightState): FightState | null {
  const held = state.opponent.dolphinLoan!.held
  if (held.source !== 'biscuit' || held.used || state.opponent.aura >= 60) return null
  const treated = performArsenalCommand(state, 'opponent', { action: 'cookie-massage', loan: true })
  return treated === state ? null : treated
}
function loanAttackAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const gap = Math.abs(state.player.x - state.opponent.x)
  for (const option of dolphinArsenalOptions(state, 'opponent')) {
    const move = moveById(option.command.target)
    if (!option.ready || !move || !loanMoveInRange(state, move.id, gap)) continue
    const next = performArsenalAction({ state, side: 'opponent', command: option.command }, perform)
    if (next !== state) return next
  }
  return null
}
function preparedLoanAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const held = state.opponent.dolphinLoan!.held
  const prepared = outsideDuelAbility(held.moveId)
  if (held.used || !prepared || prepared.activation === 'post-mortem') return null
  const next = performArsenalAction(
    { state, side: 'opponent', command: { action: 'dolphin-use' } },
    perform,
  )
  return next === state ? null : next
}
function finishLoanAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const held = state.opponent.dolphinLoan!.held
  if (!held.used || dolphinIsBusy(state, 'opponent', held)) return null
  const ended = performArsenalAction(
    { state, side: 'opponent', command: { action: 'dolphin-use' } },
    perform,
  )
  return ended === state ? null : ended
}

function loanMoveInRange(state: FightState, moveId: string, gap: number): boolean {
  const move = moveById(moveId)!
  if (move.tuning.damage === 0 || move.tuning.reach === 0) return true
  if (/^(franklin|kalluto|leorio):/.test(moveId)) return true
  if (state.opponent.y > 0) return false
  return gap <= move.tuning.reach + Math.max(0, move.tuning.lunge) + 2
}
