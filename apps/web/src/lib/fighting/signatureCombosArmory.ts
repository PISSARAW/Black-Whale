import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Franklin (emission) and Machi (transmutation), SIGNATURE_COMBOS.md.
 * General rules only: a volley that lands confirms its attack (shotConfirm.ts) and fires in
 * full before it cancels (ComboMove.windowStart), a volley holds a body on the ground
 * (groundedPin.ts), the reduced price of later techniques (comboHalfPrice.ts), the elbow's
 * wound (machiWound.ts), the Troupe Bind (machiTroupeBind.ts) and a bound body staying in
 * its combo (fighterPhysics.ts, combatDamage.ts).
 */
export const ARMORY_SIGNATURE_COMBOS: readonly SignatureCombo[] = [
  {
    id: 'franklin:suppressive-fire',
    fighter: 'franklin',
    opponent: 'chrollo',
    title: ['Feu de suppression', 'Suppressive Fire'],
    requirement: [
      'Tir rasant, accélération derrière la salve, Direct blindé, Marteau de la Brigade, Double bélier, recul court, Double Machine Gun, Salve croisée, Rideau de balles, Rafale prolongée. Chaque salve tire en entier avant de s’annuler et maintient au sol le corps qu’elle atteint. Franklin reste interruptible : un coup reçu arrête ses tirs. Après la première technique, chacune coûte un tiers de son aura tant que la cible reste prise.',
      'Grazing Shot, accélération behind the volley, Armoured Straight, Troupe Hammer, Double Ram, short recoil, Double Machine Gun, Crossed Volley, Bullet Curtain, Extended Barrage. Each volley fires in full before it cancels and holds the body it reaches on the ground. Franklin stays interruptible: a hit stops his shots. After the first technique, each costs a third of its aura while the target stays held.',
    ],
    steps: [
      { move: 'downSpecial', hits: 10 },
      { dash: 'forward' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardHeavy' },
      { dash: 'back' },
      { move: 'neutralSpecial', hits: 20 },
      { move: 'forwardSpecial', hits: 10 },
      { move: 'backSpecial', hits: 20 },
      { move: 'finisher', hits: 40 },
    ],
  },
  {
    id: 'machi:short-thread',
    fighter: 'machi',
    opponent: 'chrollo',
    title: ['Fil court', 'Short Thread'],
    requirement: [
      'Préparation : l’Aiguille de pistage marque la cible. Combo : accélération avant, Pique de fil, Coude de la couturière (qui ouvre une plaie), Ligature au contact, pas de côté en gardant le fil court, Balayage cousu, Ligature de la Brigade, Tension finale. La ligature disparaît si Machi lâche le fil ou dépasse sa portée.',
      'Setup: the Tracking Needle marks the target. Combo: forward accélération, Thread Jab, Seamstress Elbow (which opens a wound), Contact Bind, a side step that keeps the thread short, Stitched Sweep, Troupe Bind, Final Tension. The bind drops if Machi lets go of the thread or exceeds its reach.',
    ],
    preparation: [{ move: 'forwardSpecial', hit: false }],
    steps: [
      { dash: 'forward', free: true },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'downSpecial' },
      { dash: 'back' },
      { move: 'lowHeavy' },
      { move: 'throw' },
      { move: 'finisher' },
    ],
  },
]
