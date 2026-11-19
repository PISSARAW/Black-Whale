import { mizaistomMoveset } from './mizaistomMoveset'
import { leorioMoveset } from './leorioMoveset'
import { buildMoveset, type MovesetSpec } from './movesetFactory'

const SPECS: readonly MovesetSpec[] = [
  {
    fighterId: 'shizuku',
    mechanic: [
      'L / ↓ L : aspire le type désigné devant le tuyau. ← L : rejette le dernier objet. → L : frappe. H : aspire le sang par les plaies ouvertes ; Y / 5 les bouche avec les mains. Aucun vol d’aura ni soin.',
      'L / ↓ L: suck the designated type in front of the nozzle. ← L: eject the last object. → L: club strike. H: draw blood through open wounds; Y / 5 covers them with the hands. No aura drain or healing.',
    ],
    finisherCondition: [
      'Plaies ouvertes non bouchées, cible devant le tuyau et à portée ; aucun seuil de PV.',
      'Uncovered open wounds, target in front of the nozzle and in range; no HP threshold.',
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
      'Frappe de Blinky|Blinky Strike',
      'Aspiration basse|Low Vacuum',
      'Rejet du dernier objet|Last Object Ejection',
      'Prise au manche|Handle Hold',
      'Aspiration du sang|Blood Suction',
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
    fighterId: 'hanzo',
    mechanic: [
      'Frappes de main ouverte, balayages et pas brefs au corps-à-corps ; direction + L reste physique et sans coût d’aura. L : projeter le double en laissant le corps endormi. Le double flotte (haut/bas), traverse l’adversaire et frappe ; toucher le corps ou l’interpeller à proximité (T/V) interrompt la projection. Revenir au corps puis L pour le réintégrer.',
      'Open-hand strikes, sweeps and brief close-range steps; direction + L remains physical with no aura cost. L: project a double, leaving the body asleep. The double floats (up/down), passes through the opponent and strikes; touching the body or calling to it nearby (T/V) ends projection. Return to the body and press L to rejoin it.',
    ],
    finisherCondition: [
      'Le double astral doit être actif ; l’étranglement exige le corps-à-corps.',
      'The astral double must be active; the choke requires close contact.',
    ],
    labels: [
      'Main ouverte|Open-hand Strike',
      'Tranchant de la main|Knife-hand Chop',
      'Coup au tendon|Tendon Strike',
      'Fauchage furtif|Stealth Sweep',
      'Paume aérienne|Aerial Palm',
      'Talon d’ombre|Shadow Heel',
      'Pas sans trace|Traceless Step',
      'Paume de contrôle|Control Palm',
      'Revers du ninja|Ninja Backhand',
      'Hanzo Skill 4|Hanzo Skill 4',
      'Estoc de lame dissimulée|Hidden Blade Thrust',
      'Balayage du ninja|Ninja Sweep',
      'Revers de lame|Blade Backslash',
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
  ...SPECS.slice(0, 2).map(buildMoveset),
  mizaistomMoveset(),
  leorioMoveset(),
  ...SPECS.slice(2).map(buildMoveset),
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
