import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Halkenburg, Gel, Lynch, Luini and Bill (26–30, SIGNATURE_COMBOS.md).
 * Canon fidelity: no solo collective arrow for Halkenburg without supporters, no invented
 * venom for Gel, real spoken question + fist strike for Lynch, no open-space teleport for
 * Luini, and strictly non-offensive Erigeron for Bill.
 */
export const LOT2B_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'halkenburg:royal-unison',
    fighter: 'halkenburg',
    opponent: 'benjamin',
    title: ['Garde de l’unisson', 'Guard of Unison'],
    requirement: [
      'Coup bas, Direct, Pas princier, Crochet, accélération arrière, Revers, Balayage, accélération avant, Projection. En 1v1 sans partisans consentants, la flèche collective reste impossible.',
      'Low Strike, Straight, Princely Step, Hook, back accélération, Backhand, Sweep, forward accélération, Throw. In 1v1 without consenting supporters, the collective arrow remains unavailable.',
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
    id: 'gel:extended-jaw',
    fighter: 'gel',
    opponent: 'mizaistom',
    title: ['Mâchoire allongée', 'Extended Jaw'],
    requirement: [
      'Coup bas, Direct, Crochet, Avancée, Bras serpent bas, accélération avant, Bras serpent allongé, Coup d’épaule, Projection. Allonge du bras transformé uniquement, sans venin inventé.',
      'Low Strike, Straight, Hook, Advance, Low Snake Arm, forward accélération, Extended Snake Arm, Shoulder Strike, Throw. Transformed arm reach only, with no invented venom.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { move: 'downSpecial' },
      { dash: 'forward' },
      { move: 'forwardSpecial' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'lynch:body-and-soul',
    fighter: 'lynch',
    opponent: 'zakuro',
    title: ['Body and Soul', 'Body and Soul'],
    requirement: [
      'Poser la question à voix haute, accélération avant, Direct (déclenche la réponse intérieure), Avancée, Crochet, Balayage, accélération avant, Coup d’épaule, Projection. La voix intérieure exige une question audible suivie d’un vrai coup de poing.',
      'Ask the question aloud, forward accélération, Straight (triggers the inner voice answer), Advance, Hook, Sweep, forward accélération, Shoulder Strike, Throw. The inner voice requires an audible question followed by a real fist strike.',
    ],
    steps: [
      { move: 'neutralSpecial', hit: false },
      { dash: 'forward', free: true },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'luini:closed-passage',
    fighter: 'luini',
    opponent: 'hinrigh',
    title: ['Passage clos', 'Closed Passage'],
    requirement: [
      'Coup bas, Direct, Crochet, Avancée, accélération traversante vers l’angle mort, Revers de couteau, Balayage, accélération avant, Projection. En espace ouvert sans pièces closes, aucune téléportation gratuite.',
      'Low Strike, Straight, Hook, Advance, crossing accélération into the blind spot, Knife Backslash, Sweep, forward accélération, Throw. In open space without closed rooms, no free teleportation.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { dash: 'through' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'bill:close-guard',
    fighter: 'bill',
    opponent: 'kurapika',
    title: ['Garde rapprochée', 'Close Guard'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, accélération arrière, Revers de garde, Balayage, accélération avant, Projection. Erigeron reste strictement un Hatsu de soutien non offensif.',
      'Low Strike, Straight, Advance, Hook, back accélération, Guard Backhand, Sweep, forward accélération, Throw. Erigeron remains strictly a non-offensive support Hatsu.',
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
