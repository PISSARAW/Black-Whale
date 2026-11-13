import { initialCombatState } from '../combat/reducer'
import type { CombatAction, CombatSetup, CombatState } from '../combat/types'
import { ARENA_FORMATS, formatOutcome } from './formats'
import type { ArenaReplayMatch } from './replay/types'

export type ArenaActionCounts = Partial<Record<CombatAction['type'], number>>

/** Creates the exact initial state used by both a live bout and its replay. */
export function initialArenaMatchState(setup: CombatSetup, match: ArenaReplayMatch): CombatState {
  const state = initialCombatState(setup)
  if (match.bossRule !== 'aura-tax') return state
  return {
    ...state,
    player: { ...state.player, aura: Math.max(0, state.player.aura - 20) },
  }
}

/**
 * Arena formats may end a still-running engine match, but may never erase a
 * terminal engine verdict (KO, ring-out or security intervention).
 */
export function applyArenaMatchRules(
  state: CombatState,
  match: ArenaReplayMatch,
  actions: ArenaActionCounts,
): CombatState {
  if (state.outcome !== 'playing' || match.legacyRules) return state
  const format = ARENA_FORMATS.find(({ id }) => id === match.formatId) ?? ARENA_FORMATS[0]
  const usedRequiredAction = !format.requiredAction || Boolean(actions[format.requiredAction])
  const outcome = formatOutcome(format, state, usedRequiredAction)
  return outcome === state.outcome ? state : { ...state, outcome }
}

export function countArenaAction(
  actions: ArenaActionCounts,
  action: CombatAction,
): ArenaActionCounts {
  if (action.type === 'TICK') return actions
  return { ...actions, [action.type]: (actions[action.type] ?? 0) + 1 }
}
