import { performArsenalCommand } from './retrospectiveArsenal'
import { corpseOptions } from './illumiCorpses'
import type { FightState } from './types'

/** Only physically present corpses are candidates; no random subject is summoned. */
export function multiCombatAi(state: FightState): FightState | null {
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
