import type { FighterMove, FighterMoveset, MoveTuning } from './movesetTypes'
import type { ArcadeFighter, MoveSlot } from './types'
import type { TechniqueCanonContract } from './techniqueContracts'

export const FEITAN_COMBAT_REFERENCE = 'https://www.youtube.com/watch?v=T3RY6RsKHFE'
export const FEITAN_OPENING_REFERENCE = 'https://www.youtube.com/watch?v=WzdasEZq1sA'

const BLADE: TechniqueCanonContract = {
  source: `Feitan vs Zazan — ${FEITAN_OPENING_REFERENCE}, 0:40–2:30; ${FEITAN_COMBAT_REFERENCE}, 0:10–1:50`,
  evidence: 'gameplay-abstraction',
  conditions: ['Reach the opponent with the carried umbrella or sword.'],
  prohibitions: [
    'No teleportation, automatic back hit, invulnerability or guaranteed penetration.',
  ],
  narrativeCost:
    'Physical commitment. Timings, damage, names and combo routes are duel adaptations.',
  narrativeEffect: 'Low approaches, brief thrusts and cuts, followed by a return to guard.',
}

/** The clip informs the gesture; these frame and range values are arcade tuning. */
const STRIKES: Partial<Record<MoveSlot, Partial<MoveTuning>>> = {
  standingLight: {
    startup: 3,
    active: 2,
    recovery: 7,
    reach: 8.1,
    lunge: 0.8,
    hitstop: 2,
    auraZone: 'hands',
  },
  standingHeavy: { startup: 7, active: 3, recovery: 12, reach: 10.1, lunge: 1.1, hitstop: 4 },
  lowLight: { startup: 4, active: 2, recovery: 8, reach: 8.1, hitstop: 2, auraZone: 'hands' },
  lowHeavy: { startup: 8, active: 3, recovery: 15, reach: 11.1, hitstop: 5, auraZone: 'hands' },
  airLight: { startup: 3, active: 3, recovery: 7, reach: 8.1, hitstop: 2, auraZone: 'hands' },
  airHeavy: { startup: 6, active: 4, recovery: 13, reach: 10.1, hitstop: 6, auraZone: 'hands' },
  forwardLight: {
    startup: 5,
    active: 2,
    recovery: 9,
    reach: 10.1,
    lunge: 2.2,
    hitstop: 2,
    targetZone: 'torso',
  },
  forwardHeavy: {
    startup: 11,
    active: 4,
    recovery: 17,
    reach: 13.1,
    lunge: 2.6,
    hitstop: 6,
    auraZone: 'hands',
  },
  backHeavy: { startup: 8, active: 3, recovery: 12, reach: 9.1, lunge: -1.1, hitstop: 4 },
  forwardSpecial: { startup: 8, active: 3, recovery: 15, reach: 13, lunge: 3.2, hitstop: 5 },
  downSpecial: {
    startup: 9,
    active: 3,
    recovery: 16,
    reach: 11,
    lunge: 1.5,
    hitstop: 5,
    auraZone: 'hands',
  },
  backSpecial: { startup: 8, active: 3, recovery: 14, reach: 10, lunge: -1.8, hitstop: 4 },
}

export function tuneFeitanPhysicalMove(move: FighterMove): FighterMove {
  const tuning = STRIKES[move.slot]
  if (!tuning) return move
  return { ...move, auraCost: 0, canon: BLADE, tuning: { ...move.tuning, ...tuning } }
}

export function tuneFeitanPhysicalMoveset(moveset: FighterMoveset): FighterMoveset {
  return moveset.fighterId === 'feitan'
    ? { ...moveset, moves: moveset.moves.map(tuneFeitanPhysicalMove) }
    : moveset
}

/** A sword cut needs the carried weapon, including in Zetsu or after a Nen seal. */
export function feitanBladeResources(fighter: ArcadeFighter, move: FighterMove): boolean | null {
  if (
    fighter.id !== 'feitan' ||
    !['forwardSpecial', 'downSpecial', 'backSpecial'].includes(move.slot)
  )
    return null
  return !fighter.weaponsConfiscated
}
