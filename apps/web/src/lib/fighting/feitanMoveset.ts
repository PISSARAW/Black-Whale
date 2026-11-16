import type { FighterMove, FighterMoveset } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const ARMOUR: TechniqueCanonContract = {
  source: 'Chimera Ant — Feitan vs Zazan, Pain Packer / Rising Sun',
  evidence: 'manga-shown',
  conditions: ['Feitan must have suffered injuries before activating Pain Packer.'],
  prohibitions: ['The armour neither heals injuries nor grants immunity to physical attacks.'],
  narrativeCost:
    'Power comes from injuries already received; spending the charge is a duel adaptation.',
  narrativeEffect: 'Conjures the protective outfit that shields its wearer from the solar heat.',
}

const SUN: TechniqueCanonContract = {
  ...ARMOUR,
  conditions: ['Pain Packer must have committed injuries and its protective outfit must be worn.'],
  prohibitions: ['The heat does not distinguish friend from foe and cannot be physically parried.'],
  narrativeCost: 'Releases and consumes the committed pain in this duel adaptation.',
  narrativeEffect:
    'A stationary sun burns the surrounding area; greater injuries mean stronger heat.',
}

/** Duel timings, radii and injury spending are explicit gameplay adaptations. */
export function tuneFeitanMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'feitan') return moveset
  return { ...moveset, moves: moveset.moves.map(tuneMove) }
}

function tuneMove(move: FighterMove): FighterMove {
  if (move.slot !== 'neutralSpecial' && move.slot !== 'finisher') return move
  const armour = move.slot === 'neutralSpecial'
  return {
    ...move,
    auraCost: armour ? 6 : 40,
    canon: armour ? ARMOUR : SUN,
    tuning: {
      ...move.tuning,
      startup: armour ? 18 : 30,
      active: 1,
      recovery: armour ? 18 : 30,
      damage: 0,
      hitstun: 0,
      blockstun: 0,
      hitstop: 0,
      knockback: 0,
      lunge: 0,
    },
  }
}
