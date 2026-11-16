import { buildMoveset, type MovesetSpec } from './movesetFactory'
import type { FighterMove, FighterMoveset } from './movesetTypes'

const SPECS: readonly MovesetSpec[] = [
  {
    fighterId: 'yokotani',
    mechanic: [
      'LSDF : uniquement dans la planque Heil-Ly avec Morena présente. L : se présenter à un intrus en infraction et invoquer les gardes invulnérables, qui l’expulsent sans dégâts. Yokotani reste vulnérable.',
      'LSDF: only in the Heil-Ly hideout with Morena present. L: introduce yourself to an unlawful intruder and summon invulnerable guards to expel them without damage. Yokotani remains vulnerable.',
    ],
    finisherCondition: [
      'L’expulsion est exécutée automatiquement par les gardes.',
      'The guards carry out the expulsion automatically.',
    ],
    labels: [
      'Direct|Straight',
      'Crochet|Hook',
      'Coup au corps|Body Blow',
      'Balayage|Sweep',
      'Direct aérien|Air Straight',
      'Coup descendant|Descending Blow',
      'Direct en avançant|Advancing Straight',
      'Coup d’épaule|Shoulder Strike',
      'Revers|Backfist',
      'LSDF · Se présenter|LSDF · Introduction',
      'LSDF · Se présenter|LSDF · Introduction',
      'LSDF · Se présenter|LSDF · Introduction',
      'LSDF · Se présenter|LSDF · Introduction',
      'Projection|Throw',
      'LSDF · Se présenter|LSDF · Introduction',
    ],
    speed: 1.02,
    power: 1.02,
    reach: 2.2,
    combos: [
      ['standingLight', 'backHeavy', 'neutralSpecial'],
      ['lowLight', 'forwardHeavy'],
      ['airLight', 'airHeavy'],
    ],
  },
]

export const ROSTER_FINAL_MOVESETS = SPECS.map((spec) => judicialMoveset(buildMoveset(spec)))

function judicialMoveset(base: FighterMoveset): FighterMoveset {
  return {
    ...base,
    moves: base.moves
      .filter((move) => move.category !== 'finisher')
      .filter((move) => move.category !== 'special' || move.slot === 'neutralSpecial')
      .map(judicialMove),
  }
}

function judicialMove(move: FighterMove): FighterMove {
  if (move.slot !== 'neutralSpecial') return move
  return {
    ...move,
    cancelInto: [],
    tuning: {
      ...move.tuning,
      damage: 0,
      hitstun: 0,
      blockstun: 0,
      hitstop: 0,
      knockback: 0,
      lunge: 0,
      reach: 0,
    },
    canon: {
      source: 'Hunter × Hunter — chapter 399',
      evidence: 'manga-shown',
      conditions: [
        'Inside the Heil-Ly hideout with Morena present.',
        'The user introduces himself to an unlawful intruder.',
      ],
      prohibitions: [
        'Guards cannot injure defendants or grant their user invulnerability.',
        'LSDF has no jurisdiction outside the occupied hideout.',
      ],
      narrativeCost:
        'Hideout jurisdiction and introduction; aura cost and travel speed are duel abstractions.',
      narrativeEffect:
        'Invulnerable numbered guards escalate with further offenses and escort the intruder out.',
    },
  }
}
