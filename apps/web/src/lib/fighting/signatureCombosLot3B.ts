import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Padaille, Sayird, Terebellum, Voconte and Yokotani (36–40, SIGNATURE_COMBOS.md).
 * Canon fidelity: real conjured right-hand drill for Padaille, no human control for Sayird's
 * Little Eye, physical injury transfer carrier for Terebellum, no open-space teleport for
 * Voconte, and no office lawyers outside territory for Yokotani.
 */
export const LOT3B_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'padaille:cutting-tool',
    fighter: 'padaille',
    opponent: 'hinrigh',
    title: ['Outil tranchant', 'Cutting Tool'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, accélération avant, Perceuse matérialisée, Balayage, accélération avant, Projection. L’outil est réellement matérialisé sur la main droite pour 20 aura.',
      'Low Strike, Straight, Advance, Hook, forward accélération, Conjured Drill, Sweep, forward accélération, Throw. The tool is conjured onto his right hand for 20 aura.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { dash: 'forward' },
      { move: 'forwardSpecial' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'sayird:little-eye',
    fighter: 'sayird',
    opponent: 'bill',
    title: ['Petit œil', 'Little Eye'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, accélération arrière, Revers, Balayage, accélération avant, Projection. Little Eye ne manipule que de petits animaux, jamais un combattant humain.',
      'Low Strike, Straight, Advance, Hook, back accélération, Backhand, Sweep, forward accélération, Throw. Little Eye manipulates only small animals, never a human fighter.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { dash: 'back' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'terebellum:injury-transfer',
    fighter: 'terebellum',
    opponent: 'feitan',
    title: ['Transfert de blessure', 'Injury Transfer'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, Prise Sweet Home, accélération avant, Coup d’épaule, Projection. Sweet Home transfère uniquement une blessure réelle par contact manuel.',
      'Low Strike, Straight, Advance, Hook, Sweet Home Grasp, forward accélération, Shoulder Strike, Throw. Sweet Home transfers only a real injury through hand contact.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'neutralSpecial' },
      { dash: 'forward' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'voconte:service-door',
    fighter: 'voconte',
    opponent: 'luini',
    title: ['Porte de service', 'Service Door'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, accélération traversante, Revers, Balayage, accélération avant, Projection. Les portes spatiales restent liées à des lieux réels, sans téléportation gratuite.',
      'Low Strike, Straight, Advance, Hook, crossing accélération, Backhand, Sweep, forward accélération, Throw. Spatial doors remain tied to real sites, with no free teleportation.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { dash: 'through' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'yokotani:right-of-withdrawal',
    fighter: 'yokotani',
    opponent: 'hinrigh',
    title: ['Droit de retrait', 'Right of Withdrawal'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, accélération arrière, Revers, Balayage, accélération avant, Projection. Les avocats matérialisés n’interviennent que sur intrusion dans le bureau.',
      'Low Strike, Straight, Advance, Hook, back accélération, Backhand, Sweep, forward accélération, Throw. Conjured lawyers intervene only on intrusion into the office territory.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { dash: 'back' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
]
