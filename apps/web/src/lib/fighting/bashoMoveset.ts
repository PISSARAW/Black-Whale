import type { FighterMove, FighterMoveset } from './movesetTypes'
import { BASHO_WRITING_COST } from './bashoPoem'

const NAMES: Record<string, string> = {
  standingLight: 'Direct|Straight',
  standingHeavy: 'Crochet|Hook',
  lowLight: 'Coup de pied bas|Low kick',
  lowHeavy: 'Balayage|Sweep',
  airLight: 'Direct aérien|Air straight',
  airHeavy: 'Coup de pied aérien|Air kick',
  forwardLight: 'Direct en avançant|Advancing straight',
  forwardHeavy: 'Coup d’épaule|Shoulder strike',
  backHeavy: 'Revers du poing|Backfist',
  throw: 'Projection|Throw',
  neutralSpecial: 'Great Hiker · Écrire le poème|Great Hiker · Write the poem',
}

export function tuneBashoMoveset(base: FighterMoveset): FighterMoveset {
  if (base.fighterId !== 'basho') return base
  const moves = base.moves
    .filter((move) => move.category !== 'finisher')
    .filter((move) => move.category !== 'special' || move.slot === 'neutralSpecial')
    .map(tuneMove)
  return {
    ...base,
    moves,
    finisherConditionFr: '',
    finisherConditionEn: '',
    mechanicFr:
      'Great Hiker : écrire le haïku attesté du chapitre 68. Seuls les coups de poing qui touchent enflamment la cible. Aucun bonus général. Écriture interrompue par un coup, un déplacement ou la garde. Durées, coût et brûlure sont des réglages de duel.',
    mechanicEn:
      'Great Hiker: write the attested chapter 68 haiku. Only connecting fist strikes ignite the target. No general boost. Being hit, moving or guarding interrupts writing. Duration, cost and burning damage are duel tuning.',
    combos: [
      ['basho:standingLight', 'basho:standingHeavy'],
      ['basho:lowLight', 'basho:forwardLight', 'basho:standingHeavy'],
      ['basho:airLight', 'basho:airHeavy'],
    ],
  }
}

function tuneMove(move: FighterMove): FighterMove {
  const [nameFr, nameEn] = NAMES[move.slot].split('|')
  const normal = {
    ...move,
    nameFr,
    nameEn,
    cancelInto: move.cancelInto.filter((id) => !id.includes('Special')),
  }
  if (move.slot !== 'neutralSpecial') return normal
  return {
    ...normal,
    auraCost: BASHO_WRITING_COST,
    tuning: { ...move.tuning, damage: 0, hitstun: 0, blockstun: 0, knockback: 0, lunge: 0 },
    canon: {
      source: 'Hunter × Hunter — chapter 68, Great Hiker',
      evidence: 'gameplay-abstraction',
      conditions: ['Write the disclosed poem on paper, then land the fist strike named in it.'],
      prohibitions: [
        'No general damage multiplier, arbitrary spell, earth manipulation or offensive finisher.',
      ],
      narrativeCost:
        'Poem quality influences power in canon. This duel supports one attested composition; no automatic literary score is claimed.',
      narrativeEffect:
        'A fist contact ignites its target. The 1-second writing time, 25 aura and 1.5-second burn are arcade tuning, not canonical numbers.',
    },
  }
}
