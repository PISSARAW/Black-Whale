import { leorioMoveset } from './leorioMoveset'
import { buildMoveset, type MovesetSpec } from './movesetFactory'

const SPECS: readonly MovesetSpec[] = [
  {
    fighterId: 'shizuku',
    mechanic: [
      'Blinky : aspire les objets lancés contre Shizuku, jamais un être vivant ni une construction de Nen.',
      'Blinky: swallows objects thrown at Shizuku, never a living being or a Nen construct.',
    ],
    finisherCondition: [
      'L’adversaire doit être à 50 PV ou moins.',
      'The opponent must have 50 HP or less.',
    ],
    labels: [
      'Coup de Blinky|Blinky Jab',
      'Marteau aspirant|Vacuum Hammer',
      'Tuyau rasant|Low Nozzle',
      'Balayage ménager|Cleaning Sweep',
      'Blinky volant|Flying Blinky',
      'Chute aspirante|Vacuum Drop',
      'Pas de nettoyage|Cleaning Step',
      'Coup de réservoir|Tank Strike',
      'Retour de manche|Handle Return',
      'Aspiration d’objets|Object Suction',
      'Blinky Cyclone|Blinky Cyclone',
      'Aspiration basse|Low Vacuum',
      'Rejet d’objets|Object Ejection',
      'Prise au manche|Handle Hold',
      'Blinky · Grand ménage|Blinky · Deep Clean',
    ],
    speed: 0.98,
    power: 1,
    reach: 2.1,
    combos: [
      ['standingLight', 'standingHeavy', 'neutralSpecial'],
      ['lowLight', 'forwardLight', 'downSpecial'],
      ['airHeavy', 'forwardSpecial'],
    ],
  },
  {
    fighterId: 'hinrigh',
    mechanic: [
      'Biohazard : les objets transformés en animaux maintiennent pression et contrôle.',
      'Biohazard: objects transformed into animals sustain pressure and control.',
    ],
    finisherCondition: ['Biohazard doit être actif.', 'Biohazard must be active.'],
    labels: [
      'Direct du mafieux|Mafia Straight',
      'Crosse animale|Animal Stock',
      'Coup bas discret|Discrete Low',
      'Fauchage de la famille|Family Sweep',
      'Pique du pigeon|Pigeon Dive',
      'Talon du serpent|Serpent Heel',
      'Pas de la Xi-Yu|Xi-Yu Step',
      'Charge du garde|Guard Rush',
      'Revers du couteau|Knife Backfist',
      'Biohazard|Biohazard',
      'Pigeons menottes|Handcuff Pigeons',
      'Serpent de câble|Cable Serpent',
      'Mur de créatures|Creature Wall',
      'Capture de la Xi-Yu|Xi-Yu Capture',
      'Biohazard · Ménagerie|Biohazard · Menagerie',
    ],
    speed: 0.92,
    power: 1.02,
    reach: 1.5,
    combos: [
      ['standingLight', 'forwardLight', 'forwardSpecial'],
      ['lowLight', 'standingHeavy', 'neutralSpecial'],
      ['airLight', 'airHeavy', 'downSpecial'],
    ],
  },
  {
    fighterId: 'mizaistom',
    mechanic: [
      'Cross Game : les cartes colorées imposent arrêt, avertissement puis contrainte.',
      'Cross Game: colored cards impose stop, warning, then restraint.',
    ],
    finisherCondition: [
      'La cible doit être immobilisée par Cross Game.',
      'The target must be restrained by Cross Game.',
    ],
    labels: [
      'Direct du Bœuf|Ox Straight',
      'Marteau du Zodiac|Zodiac Hammer',
      'Carte basse|Low Card',
      'Balayage judiciaire|Judicial Sweep',
      'Mandat aérien|Aerial Warrant',
      'Sentence descendante|Descending Sentence',
      'Interposition|Interposition',
      'Charge du Bœuf|Ox Charge',
      'Carte de recul|Retreat Card',
      'Carte bleue|Blue Card',
      'Carte jaune|Yellow Card',
      'Carte rouge|Red Card',
      'Zone de Cross Game|Cross Game Zone',
      'Arrestation|Arrest',
      'Cross Game · Verdict|Cross Game · Verdict',
    ],
    speed: 1,
    power: 1.04,
    reach: 1.2,
    combos: [
      ['standingLight', 'backHeavy', 'neutralSpecial'],
      ['lowLight', 'forwardHeavy', 'downSpecial'],
      ['airHeavy', 'forwardSpecial'],
    ],
  },
  {
    fighterId: 'hanzo',
    mechanic: [
      'L : projeter le double en laissant le corps endormi. Le double flotte (haut/bas), traverse l’adversaire et frappe ; toucher le corps ou l’interpeller à proximité (T/V) interrompt la projection. Revenir au corps puis L pour le réintégrer.',
      'L: project a double, leaving the body asleep. The double floats (up/down), passes through the opponent and strikes; touching the body or calling to it nearby (T/V) ends projection. Return to the body and press L to rejoin it.',
    ],
    finisherCondition: [
      'Le double astral doit être actif ; l’étranglement exige le corps-à-corps.',
      'The astral double must be active; the choke requires close contact.',
    ],
    labels: [
      'Pique du ninja|Ninja Jab',
      'Paume secrète|Secret Palm',
      'Coup au tendon|Tendon Strike',
      'Fauchage furtif|Stealth Sweep',
      'Paume aérienne|Aerial Palm',
      'Talon d’ombre|Shadow Heel',
      'Pas sans trace|Traceless Step',
      'Paume assassine|Assassin Palm',
      'Revers du ninja|Ninja Backhand',
      'Hanzo Skill 4|Hanzo Skill 4',
      'Paume du ninja|Ninja Palm',
      'Balayage du ninja|Ninja Sweep',
      'Contre du ninja|Ninja Counter',
      'Clé du ninja|Ninja Lock',
      'Double astral · Étranglement|Astral Double · Choke',
    ],
    speed: 0.8,
    power: 1.02,
    reach: 1.3,
    combos: [
      ['standingLight', 'forwardLight', 'forwardSpecial'],
      ['lowLight', 'backHeavy', 'downSpecial'],
      ['airLight', 'airHeavy', 'backSpecial'],
    ],
  },
]

export const WAVE_TWO_MOVESETS_B = [
  ...SPECS.slice(0, 3).map(buildMoveset),
  leorioMoveset(),
  ...SPECS.slice(3).map(buildMoveset),
].map((moveset) => {
  if (moveset.fighterId !== 'hanzo') return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) => {
      if (move.slot === 'neutralSpecial')
        return { ...move, tuning: { ...move.tuning, damage: 0, reach: 0, lunge: 0 } }
      if (move.slot === 'finisher')
        return { ...move, tuning: { ...move.tuning, reach: 4, lunge: 0, knockback: 1 } }
      if (move.category === 'special')
        return { ...move, tuning: { ...move.tuning, reach: Math.min(9, move.tuning.reach) } }
      return move
    }),
  }
})
