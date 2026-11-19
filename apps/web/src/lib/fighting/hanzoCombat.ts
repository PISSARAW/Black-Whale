import type { FighterMove, FighterMoveset, MoveTuning } from './movesetTypes'
import { hanzoBladeMove } from './hanzoBlade'
import type { MoveSlot } from './types'
import type { TechniqueCanonContract } from './techniqueContracts'

export const HANZO_COMBAT_REFERENCES = [
  'https://www.youtube.com/watch?v=SFitXNQIkEY',
  'https://www.youtube.com/watch?v=go3WhJykMjw',
] as const

const MARTIAL: TechniqueCanonContract = {
  source: `Hanzo vs Gon, Hunter Exam — ${HANZO_COMBAT_REFERENCES.join('; ')}`,
  evidence: 'gameplay-abstraction',
  conditions: ['Reach the opponent with the actual hand, forearm or leg.'],
  prohibitions: ['No teleportation, automatic rear attack, forced submission or invulnerability.'],
  narrativeCost: 'Physical commitment. Names, timings, ranges and combo routes are duel tuning.',
  narrativeEffect: 'Brief hand strikes, close control, low sweeps and a composed return to stance.',
}

const BLADE: TechniqueCanonContract = {
  ...MARTIAL,
  source: `Hunter Exam, chapter 34 — right forearm blade; ${HANZO_COMBAT_REFERENCES[1]}`,
  conditions: ['Carry the concealed right forearm blade and reach the target physically.'],
  narrativeEffect:
    'A fixed-length physical blade extends from the right sleeve for a thrust or retreating cut.',
}

const DIRECTIONAL: Partial<Record<MoveSlot, Partial<MoveTuning>>> = {
  forwardSpecial: {
    startup: 8,
    active: 3,
    recovery: 15,
    damage: 12,
    hitstun: 18,
    blockstun: 10,
    knockback: 3.2,
    reach: 11.2,
    lunge: 2,
    auraZone: 'hands',
  },
  downSpecial: {
    startup: 9,
    active: 3,
    recovery: 18,
    damage: 9,
    hitstun: 18,
    blockstun: 9,
    knockback: 3.6,
    reach: 9,
    lunge: 0.7,
    auraZone: 'feet',
  },
  backSpecial: {
    startup: 7,
    active: 3,
    recovery: 14,
    damage: 9,
    hitstun: 16,
    blockstun: 8,
    knockback: 2.8,
    reach: 10.5,
    lunge: -1.2,
    auraZone: 'hands',
  },
}

/** Keep the existing confirmed combo timings; directional palms and sweeps are physical too. */
export function tuneHanzoCombat(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'hanzo') return moveset
  return { ...moveset, moves: moveset.moves.map(tuneStrike) }
}

function tuneStrike(move: FighterMove): FighterMove {
  if (move.category === 'normal' || move.category === 'command') return { ...move, canon: MARTIAL }
  const tuning = DIRECTIONAL[move.slot]
  return tuning
    ? {
        ...move,
        auraCost: 0,
        canon: hanzoBladeMove(move.id) ? BLADE : MARTIAL,
        tuning: { ...move.tuning, ...tuning },
      }
    : move
}
