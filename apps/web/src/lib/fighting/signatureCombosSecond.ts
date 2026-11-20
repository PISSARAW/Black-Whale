import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of a Specialist and a Transmuter (SIGNATURE_COMBOS.md). Each holds one
 * deliberate break: the ten-second vision for Tserriednich, the riposte Feitan takes on
 * purpose. Both rely on general rules only: crossing (signatureCrossing.ts), accélération
 * chains (`CancelGrammar.accelInto`) and the hot-zone hold of Pain Packer (comboCapture.ts).
 */
export const SECOND_SIGNATURE_COMBOS: readonly SignatureCombo[] = [
  {
    id: 'tserriednich:ten-seconds-ahead',
    fighter: 'tserriednich',
    opponent: 'kurapika',
    title: ['Dix secondes d’avance', 'Ten Seconds Ahead'],
    requirement: [
      'Recul tactique, Zetsu yeux fermés, vision du futur, ouverture des yeux, accélération vers l’angle sûr, Tir aux jambes, Pas princier, Coup de crosse, Fauchage calculé, Angle mort. L’adversaire garde contre l’image prévue : seule une divergence choisie le prend à revers. Le futur n’esquive jamais à sa place.',
      'Tactical Retreat, Zetsu with closed eyes, future vision, open eyes, accélération to the safe angle, Leg Shot, Princely Step, Pistol Whip, Calculated Sweep, Blind Spot. The opponent guards against the predicted image: only a chosen divergence takes them from behind. The future never dodges for him.',
    ],
    steps: [
      { move: 'backHeavy' },
      { future: 'close' },
      { future: 'vision' },
      { future: 'open' },
      { dash: 'through' },
      { move: 'lowLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { move: 'forwardHeavy' },
    ],
  },
  {
    id: 'feitan:pain-into-speed',
    fighter: 'feitan',
    opponent: 'hisoka',
    title: ['Douleur en vitesse', 'Pain into Speed'],
    requirement: [
      'Entaille basse, Estoc en course basse, accélération traversante, Revers de retrait, Taille de sabre, Fauchage éclair, encaisser volontairement une riposte, Pain Packer, projection vers la zone chaude, Rising Sun. Le soleil ne brûle qu’à la mesure des blessures réellement reçues.',
      'Low Slash, Low Running Thrust, crossing accélération, Retreating Cut, Sword Cleave, Flash Sweep, take a riposte on purpose, Pain Packer, throw into the hot zone, Rising Sun. The sun burns only as much as the injuries actually received.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'forwardLight' },
      { dash: 'through' },
      { move: 'backHeavy' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { riposte: 'standingLight' },
      { move: 'neutralSpecial', hit: false },
      { move: 'throw' },
      { move: 'finisher', hit: false },
    ],
  },
]
