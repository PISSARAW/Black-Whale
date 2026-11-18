import { performArsenalCommand } from './retrospectiveArsenal'
import { corpseOptions } from './illumiCorpses'
import { perceivedOpponentGap } from './opponentAwareness'
import type { FightState } from './types'

/** Uses physical equipment and present corpses, with the opponent's perceived distance. */
export function multiCombatAi(state: FightState): FightState | null {
  if (state.opponent.id === 'feitan') return feitanFeintAi(state)
  if (state.opponent.id !== 'illumi' || state.frame % 120 !== 0) return null
  const option = corpseOptions(state, 'opponent').find(
    (entry) =>
      entry.ready &&
      ['illumi-corpse', 'illumi-corpse-order'].includes(entry.command.action) &&
      !entry.command.target?.endsWith('|stay'),
  )
  if (!option) return null
  const next = performArsenalCommand(state, 'opponent', option.command)
  return next === state ? null : next
}

function feitanFeintAi(state: FightState): FightState | null {
  const gap = perceivedOpponentGap(state)
  if (state.frame % 180 > 10 || gap < 8 || gap > 18) return null
  const next = performArsenalCommand(state, 'opponent', { action: 'umbrella-feint' })
  return next === state ? null : next
}
