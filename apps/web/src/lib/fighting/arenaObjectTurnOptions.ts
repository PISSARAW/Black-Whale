import { performArenaObjectTurn } from './arenaObjectTurn'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function arenaObjectTurnOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return (state.battlefield?.entities ?? [])
    .filter((e) => e.kind === 'crate' && e.arena && e.present && e.health > 0)
    .map((entry) => {
      const command = { action: 'arena-turn-object' as const, target: entry.id }
      return {
        command,
        ready: performArenaObjectTurn(state, side, command) !== state,
        labelFr: `Retourner la caisse (${Math.round(entry.x)})`,
        labelEn: `Turn the crate (${Math.round(entry.x)})`,
        conditionFr:
          'Geste physique à portée, main libre. Les marques restent sur la même face du support.',
        conditionEn:
          'Physical handling within reach, with a free hand. Marks remain on the same material face.',
      }
    })
}
