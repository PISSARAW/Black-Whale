import { initialCombatState } from '../combat/reducer'
import type { CombatAction, CombatSetup, CombatState } from '../combat/types'
import { ARENA_FORMATS, formatOutcome } from './formats'
import type { ArenaReplayMatch } from './replay/types'
import { fightingHatsuRoute } from '../combat/fightingHatsu'
import { isBlinkyUtilityMove } from '../combat/fightingBlinky'
import { initialArenaSkillHunterBook, isSkillHunterMove } from '../combat/fightingSkillHunter'

export type ArenaActionCounts = Partial<Record<CombatAction['type'], number>>

/** Creates the exact initial state used by both a live bout and its replay. */
export function initialArenaMatchState(setup: CombatSetup, match: ArenaReplayMatch): CombatState {
  const base = initialCombatState(setup)
  const roster = {
    ...base,
    player:
      match.fighterId === 'chrollo'
        ? { ...base.player, skillHunterBook: initialArenaSkillHunterBook() }
        : base.player,
    opponent:
      match.opponentFighterId === 'chrollo'
        ? { ...base.opponent, skillHunterBook: initialArenaSkillHunterBook() }
        : base.opponent,
  }
  const state = match.nenRules ? { ...roster, nenRules: match.nenRules } : roster
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
  const type =
    action.type === 'FIGHTING_MOVE'
      ? fightingHatsuRoute(action.fighterId, action.slot) ||
        isBlinkyUtilityMove(action) ||
        isSkillHunterMove(action)
        ? 'HATSU'
        : 'STRIKE'
      : action.type
  return { ...actions, [type]: (actions[type] ?? 0) + 1 }
}
