import { BEYOND_DUEL_MECHANIC } from './beyondCurse'
import type { FighterMoveset } from './movesetTypes'

/** Preserve the physical kit's tuning; neither a low-HP super nor an invented curse strike. */
export function tuneBeyondMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'beyond') return moveset
  const moves = moveset.moves.filter((move) => move.category !== 'finisher')
  const ids = new Set(moves.map((move) => move.id))
  return {
    ...moveset,
    mechanicFr: BEYOND_DUEL_MECHANIC.fr,
    mechanicEn: BEYOND_DUEL_MECHANIC.en,
    finisherConditionFr: '',
    finisherConditionEn: '',
    moves: moves.map((move) => ({
      ...move,
      cancelInto: move.cancelInto.filter((id) => ids.has(id)),
      canon: {
        ...move.canon,
        source: 'Black Whale duel interpretation — Beyond’s physical fighting style',
        evidence: 'gameplay-abstraction',
        prohibitions: [
          'No sacrificial curse, automatic retaliation, inherited Isaac Netero ability or low-health super.',
        ],
        narrativeEffect:
          'A physical strike. Its name, motion and combat tuning are duel adaptations, not an attested Hatsu.',
      },
    })),
    combos: moveset.combos
      .map((route) => route.filter((id) => ids.has(id)))
      .filter((route) => route.length >= 2),
  }
}
