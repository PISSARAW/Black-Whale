import type { SignatureCombo } from './signatureCombos'

/**
 * Biscuit and Phinks signature combos (SIGNATURE_COMBOS.md): a transformation that lasts the
 * round, and a Ripper Cyclotron wound while moving, whose turns only the release consumes.
 */
export const BISCUIT_AND_PHINKS_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'biscuit:true-form-return',
    fighter: 'biscuit',
    opponent: 'phinks',
    title: ['Retour à la vraie forme', 'Return to True Form'],
    requirement: [
      'Direct Shingen, Pas du maître, Crochet de maître, Balayage de pierre, accélération avant, Projection Shingen, Vraie forme pendant la capture, Ken parfait, Poing de Ko, Impact total. La vraie forme reste pour la manche : puissance, portée et inertie. Ken parfait 28, Poing de Ko 20, Impact total 40 quand il conclut la chaîne de capture.',
      'Shingen Straight, Master Step, Master Hook, Stone Sweep, forward accélération, Shingen Throw, True Form during the capture, Perfect Ken, Ko Fist, Full Impact. True Form lasts the round: power, reach and inertia. Perfect Ken 28, Ko Fist 20, Full Impact 40 when it concludes the capture chain.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
      { trueForm: true },
      { move: 'backSpecial' },
      { move: 'downSpecial' },
      { move: 'finisher' },
    ],
  },
  {
    id: 'phinks:ten-turns-one-fist',
    fighter: 'phinks',
    opponent: 'biscuit',
    title: ['Dix tours, un poing', 'Ten Turns, One Fist'],
    requirement: [
      'Démarrer Ripper Cyclotron, accélération arrière en tournant, esquive basse en tournant (bas + avant, avant), saut croisé, atterrissage derrière la cible, Direct de météore, Crochet de la Brigade, Épaule blindée, terminer le dernier tour, libérer Ripper Cyclotron. Les coups intermédiaires ne reçoivent aucun bonus : seule la libération consomme les tours complets.',
      'Start Ripper Cyclotron, back dash while turning, low dodge while turning (down + forward, forward), cross-up jump, land behind the target, Meteor Straight, Troupe Hook, Armored Shoulder, finish the last turn, release Ripper Cyclotron. The blows in between gain nothing: only the release consumes the full turns.',
    ],
    steps: [
      { wind: true },
      { dash: 'back', free: true },
      { dash: 'forward', free: true, low: true },
      { jump: 'forward' },
      { land: true },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardHeavy' },
      { turn: true },
      { move: 'finisher' },
    ],
  },
]
