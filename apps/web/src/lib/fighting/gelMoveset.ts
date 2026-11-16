import type { FighterMoveset } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const SNAKE_ARM: TechniqueCanonContract = {
  source:
    'Gel’s shown arm transformation; its formal name, category and full rules are unrevealed.',
  evidence: 'gameplay-abstraction',
  conditions: [
    'Reach the opponent with the transformed arm; ordinary guard and interruption apply.',
  ],
  prohibitions: [
    'No confirmed venom, aura drain, lethal dose, shedding, special protection or automatic restraint.',
    'Directional strikes are variants of the same arm, not additional confirmed Hatsu.',
  ],
  narrativeCost:
    'Aura costs, reach, damage and timing are duel tuning, not established manga rules.',
  narrativeEffect:
    'A close-combat arm transformation with extended reach and no added status effect.',
}

export function tuneGelMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'gel') return moveset
  return {
    ...moveset,
    moves: moveset.moves
      .filter((move) => move.slot !== 'finisher')
      .map((move) => (move.category === 'special' ? { ...move, canon: SNAKE_ARM } : move)),
  }
}
