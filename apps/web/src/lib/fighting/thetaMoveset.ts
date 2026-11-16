import type { FighterMove, FighterMoveset } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const HANDGUN: TechniqueCanonContract = {
  source:
    'Succession Contest — chapters 385 and 387: Theta draws a real handgun during Zetsu training',
  evidence: 'manga-shown',
  conditions: ['Theta must aim her physical handgun at the target.'],
  prohibitions: [
    'A bullet is not emitted aura; it neither drains aura nor forces Zetsu.',
    'Her personal Hatsu and natural Nen category remain unknown; the gun cannot be stolen as a Hatsu.',
  ],
  narrativeCost: 'Physical ammunition; the duel does not invent a magazine capacity or model.',
  narrativeEffect:
    'A travelling physical bullet. Shot timings and directional variants are duel adaptations.',
}

export function tuneThetaMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'theta') return moveset
  return {
    ...moveset,
    moves: moveset.moves.filter((move) => move.slot !== 'finisher').map(tuneShot),
  }
}

function tuneShot(move: FighterMove): FighterMove {
  if (move.category !== 'special') return move
  return {
    ...move,
    kind: 'ranged',
    auraCost: 0,
    canon: HANDGUN,
    tuning: { ...move.tuning, damage: 0, active: 1, knockback: 0, lunge: 0 },
  }
}
