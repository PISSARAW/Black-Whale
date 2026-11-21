import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Saiyu (sensory control) and Theta (fundamentals and a real handgun),
 * SIGNATURE_COMBOS.md. General rules only: crossing (signatureCrossing.ts), accélération
 * chains (`CancelGrammar.accelInto`), a super's own written chains (duelComboGrammar.ts),
 * a landed bullet confirming its shot (shotConfirm.ts) and the reduced price of later
 * techniques (comboHalfPrice.ts).
 */
export const SENSES_SIGNATURE_COMBOS: readonly SignatureCombo[] = [
  {
    id: 'saiyu:three-forbidden',
    fighter: 'saiyu',
    opponent: 'chrollo',
    title: ['Les trois interdits', 'The Three Forbidden'],
    requirement: [
      'Pointe du bâton, Pas du pèlerin, Mizaru, Balayage du singe, Kikazaru, accélération derrière la cible, Cercle du bâton, Iwazaru, Pilier écrasant, Frappe finale. Chaque singe touche séparément et scelle son propre sens ; aucun ne provoque de Zetsu. Après la première technique, chacune coûte un tiers de son aura tant que la cible reste prise.',
      'Staff Point, Pilgrim Step, Mizaru, Monkey Sweep, Kikazaru, accélération behind the target, Staff Circle, Iwazaru, Crushing Pillar, Final Strike. Each monkey lands on its own and seals its own sense; none forces Zetsu. After the first technique, each costs a third of its aura while the target stays held.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'neutralSpecial' },
      { move: 'lowHeavy' },
      { move: 'forwardSpecial' },
      { dash: 'through' },
      { move: 'backSpecial' },
      { move: 'downSpecial' },
      { move: 'forwardHeavy' },
      { move: 'finisher' },
    ],
  },
  {
    id: 'theta:shooting-lesson',
    fighter: 'theta',
    opponent: 'chrollo',
    title: ['Leçon de tir', 'Shooting Lesson'],
    requirement: [
      'Tir de couverture, accélération avant, Pique à la crosse, Crosse descendante, Fauchage de garde, accélération arrière, Tir bas, Pas de tir, Désarmement, Tir ajusté. Une balle qui touche confirme son tir. Aucun Hatsu personnel : seuls le pistolet réel et le corps à corps.',
      'Covering Shot, forward accélération, Pistol Jab, Downward Stock, Guard Sweep, back accélération, Low Shot, Shooting Step, Disarming Throw, Aimed Shot. A bullet that lands confirms its shot. No personal Hatsu: only the real handgun and close combat.',
    ],
    steps: [
      { move: 'backSpecial' },
      { dash: 'forward' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'back' },
      { move: 'downSpecial' },
      { move: 'forwardLight' },
      { move: 'throw' },
      { move: 'forwardSpecial' },
    ],
  },
]
