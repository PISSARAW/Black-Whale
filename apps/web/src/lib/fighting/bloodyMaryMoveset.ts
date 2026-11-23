import { maryCommandReady, type MaryCommand } from './bloodyMary'
import type { FighterMove, FighterMoveset } from './movesetTypes'
import type { FightSide, FightState } from './types'

const SPECIALS: Record<string, { command: MaryCommand; name: string; cost: number }> = {
  neutralSpecial: {
    command: 'bind',
    name: 'Bloody Mary · Prise sanguine|Bloody Mary · Blood capture',
    cost: 12,
  },
  forwardSpecial: {
    command: 'slam',
    name: 'Bloody Mary · Projection au sol|Bloody Mary · Ground slam',
    cost: 0,
  },
  downSpecial: {
    command: 'scout',
    name: 'Bloody Mary · Gouttes-yeux|Bloody Mary · Eyed scouts',
    cost: 8,
  },
  backSpecial: {
    command: 'recall',
    name: 'Bloody Mary · Rappeler le sang|Bloody Mary · Recall blood',
    cost: 0,
  },
}
const NORMALS: Record<string, string> = {
  standingLight: 'Direct|Straight',
  standingHeavy: 'Crochet|Hook',
  lowLight: 'Coup bas|Low strike',
  lowHeavy: 'Balayage|Sweep',
  airLight: 'Direct aérien|Air straight',
  airHeavy: 'Aiguille sanguine|Blood Needle',
  forwardLight: 'Gouttes éclaireuses|Scouting Drops',
  forwardHeavy: 'Fil rouge|Red Thread',
  backHeavy: 'Reflux|Backflow',
  throw: 'Bloody Mary|Bloody Mary',
}

export function tuneZakuroMoveset(base: FighterMoveset): FighterMoveset {
  if (base.fighterId !== 'zakuro') return base
  return {
    ...base,
    mechanicFr:
      'Bloody Mary : votre propre sang et une perfusion réelle. Une blessure existante suffit pour déployer le sang ; la prise doit atteindre la cible avant la projection. Les gouttes-yeux explorent le sol et les parois réelles sans attaquer. Le rappel arrête le saignement sans soigner. Réserve et poches limitées.',
    mechanicEn:
      'Bloody Mary: your own blood and real infusion equipment. An existing wound is enough to deploy blood; capture must physically reach the target before a slam. Eyed droplets scout floors and real walls without attacking. Recall stops bleeding without healing. Limited blood and bags.',
    finisherConditionFr: '',
    finisherConditionEn: '',
    moves: base.moves.filter((move) => move.category !== 'finisher').map(tuneMove),
    combos: [
      ['zakuro:standingLight', 'zakuro:standingHeavy'],
      ['zakuro:lowLight', 'zakuro:forwardLight', 'zakuro:standingHeavy'],
      ['zakuro:airLight', 'zakuro:airHeavy'],
    ],
  }
}

function tuneMove(move: FighterMove): FighterMove {
  const special = SPECIALS[move.slot]
  const [nameFr, nameEn] = (special?.name ?? NORMALS[move.slot]).split('|')
  const tuned = {
    ...move,
    nameFr,
    nameEn,
    cancelInto: move.cancelInto.filter((id) => !id.includes('Special')),
  }
  if (!special) return tuned
  return {
    ...tuned,
    auraCost: special.cost,
    tuning: { ...move.tuning, damage: 0, hitstun: 0, blockstun: 0, knockback: 0, lunge: 0 },
    canon: {
      source: 'Hunter × Hunter — chapters 390–391, Bloody Mary',
      evidence: 'gameplay-abstraction',
      conditions: [
        'Manipulate only the user’s shed blood, with an open wound and actual infusion equipment.',
      ],
      prohibitions: [
        'No enemy-blood control, free blood creation, automatic stun, shield or exsanguination.',
      ],
      narrativeCost:
        'Blood and finite carried supply. Numerical units, reach, resistance and timers are disclosed duel tuning.',
      narrativeEffect:
        'A travelling blood mass captures physically before a ground slam; autonomous eyed drops scout for approximately thirty minutes without dealing damage.',
    },
  }
}

export function zakuroMoveReady(
  state: FightState,
  side: FightSide,
  move: FighterMove,
): boolean | null {
  if (!move.id.startsWith('zakuro:') || move.category !== 'special') return null
  const command = SPECIALS[move.slot]?.command
  return command ? maryCommandReady(state, side, command) : false
}
