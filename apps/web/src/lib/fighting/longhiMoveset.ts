import type { FighterMove, FighterMoveset } from './movesetTypes'

/** The contract is the only attested technique; ordinary blows are explicitly arcade. */
export function tuneLonghiMoveset(base: FighterMoveset): FighterMoveset {
  if (base.fighterId !== 'longhi') return base
  const names = [
    'Direct|Straight',
    'Crochet|Hook',
    'Coup bas|Low Strike',
    'Balayage|Sweep',
    'Direct aérien|Air Straight',
    'Coup descendant|Descending Blow',
    'Direct en avançant|Advancing Straight',
    'Coup d’épaule|Shoulder Strike',
    'Revers|Backfist',
    'Moonlight Act · Proposer un pacte|Moonlight Act · Offer a Pact',
    '',
    '',
    '',
    'Projection|Throw',
  ]
  return {
    ...base,
    mechanicFr:
      'Moonlight Act : propose un contrat expliqué et signé librement par les deux parties. Aucune touche ne vaut signature. Le pacte de duel interdit les attaques pendant cinq secondes ; le destinataire gagne ensuite un usage du pouvoir. Rompre la clause impose Zetsu pour le reste du match.',
    mechanicEn:
      'Moonlight Act: offer disclosed terms for both parties to sign freely. A hit is never consent. The duel pact forbids attacks for five seconds, then grants the recipient one use of the ability. Breaching it imposes Zetsu for the rest of the match.',
    finisherConditionFr: '',
    finisherConditionEn: '',
    combos: [
      ['longhi:standingLight', 'longhi:standingHeavy'],
      ['longhi:lowLight', 'longhi:forwardLight', 'longhi:standingHeavy'],
      ['longhi:airLight', 'longhi:airHeavy'],
    ],
    moves: base.moves
      .map((move, index) => renameMove(move, names[index]))
      .filter((move) => move.category !== 'finisher')
      .filter((move) => move.category !== 'special' || move.slot === 'neutralSpecial'),
  }
}

function renameMove(move: FighterMove, name = ''): FighterMove {
  const [nameFr, nameEn] = name.split('|')
  const normal = {
    ...move,
    nameFr,
    nameEn,
    cancelInto: move.cancelInto.filter((id) => !id.includes('Special')),
  }
  if (move.slot !== 'neutralSpecial') return normal
  return {
    ...normal,
    auraCost: 0,
    tuning: { ...move.tuning, damage: 0, hitstun: 0, blockstun: 0, knockback: 0, lunge: 0 },
    canon: {
      source: 'Hunter × Hunter — chapter 401, Transparent Words: Moonlight Act',
      evidence: 'gameplay-abstraction',
      conditions: ['Explain every term before both parties sign voluntarily.'],
      prohibitions: ['No contract on hit, forced consent, hidden clause, or automatic execution.'],
      narrativeCost:
        'Both signatories are bound. The five-second truce is an explicit duel scenario.',
      narrativeEffect:
        'Fulfilment loans one use of Moonlight Act. Breach imposes Zetsu: one week in the manga, the remainder of the match here.',
    },
  }
}
