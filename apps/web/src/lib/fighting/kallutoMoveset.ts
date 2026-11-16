import { PAPER_COSTS } from './kallutoPaper'
import type { FighterMoveset } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const PAPER_CANON: TechniqueCanonContract = {
  source:
    'Chimera Ant arc: paper fragments, Dance of the Serpent’s Bite and paper-doll eavesdropping.',
  evidence: 'gameplay-abstraction',
  conditions: [
    'A physical fragment must embed in the chosen zone before a stream can converge there.',
    'A matching paper doll and a fragment attached to its subject relay words near that subject.',
  ],
  prohibitions: [
    'No explosive marks, hit-count threshold, mind reading, aura drain or automatic execution.',
  ],
  narrativeCost:
    'Zone coordinates, projectile damage/speed, startup, aura costs and voice radius tune the duel.',
  narrativeEffect:
    'Manipulate paper into a cutting stream targeting embedded fragments; eavesdrop through a doll.',
}

export function tuneKallutoMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'kalluto') return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) => {
      if (move.kind !== 'special') return move
      const follows = move.slot === 'forwardSpecial' || move.slot === 'finisher'
      return {
        ...move,
        canon: PAPER_CANON,
        auraCost: follows
          ? PAPER_COSTS.serpent
          : move.slot === 'backSpecial'
            ? PAPER_COSTS.doll
            : PAPER_COSTS.plant,
        tuning: {
          ...move.tuning,
          damage: 0,
          lunge: 0,
          knockback: 0,
          hitstun: 0,
          hitstop: 0,
          active: 1,
          startup: 14,
          recovery: 18,
        },
      }
    }),
  }
}
