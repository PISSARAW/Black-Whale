import type { SignatureCombo } from './signatureCombos'

/**
 * Chrollo and Benjamin signature combos (SIGNATURE_COMBOS.md). Their resources come from a
 * preparation played before the combo: no stolen Hatsu, mark or card appears on its own.
 */
export const BOOK_AND_ARMY_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'chrollo:double-page',
    fighter: 'chrollo',
    opponent: 'hisoka',
    title: ['Double page', 'Double Page'],
    requirement: [
      'Préparation : Soleil posé par la page active, puis Double Face place Sun and Moon au signet et ferme le livre. Combo : Pique du voleur, Coup de pied d’arrêt, Contre du voleur, Fauchage silencieux, accélération, Paume rapide, page au signet : la Lune rejoint le Soleil et la marque détone. Aucun Hatsu volé pendant le combo.',
      'Preparation: Sun stamped by the active page, then Double Face bookmarks Sun and Moon and closes the book. Combo: Thief Jab, Stop Kick, Thief Counter, Silent Reap, accélération, Quick Palm, bookmarked page: Moon joins Sun and the marks detonate. No Hatsu is stolen during the combo.',
    ],
    preparation: [{ move: 'neutralSpecial' }, { move: 'downSpecial', hit: false }],
    steps: [
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'forwardLight' },
      { move: 'finisher' },
    ],
  },
  {
    id: 'benjamin:absolute-command',
    fighter: 'benjamin',
    opponent: 'franklin',
    title: ['Commandement absolu', 'Absolute Command'],
    requirement: [
      'Préparation : Secret Window marque la cible (information seulement, aucun bonus de dégâts), puis le Rectangle d’aura capture un projectile de Nen adverse. Combo : Direct militaire, Percée de garde, Marteau royal, Air Blow, accélération avant, Plaquage du premier prince, Rectangle d’aura, rafale de mitraillette, Jouer la carte. La rafale est une arme réelle : elle n’est jamais capturée.',
      'Preparation: Secret Window marks the target (information only, no damage bonus), then the Aura Rectangle captures an opposing Nen projectile. Combo: Military Straight, Guard Breaker, Royal Hammer, Air Blow, forward accélération, First Prince Takedown, Aura Rectangle, machine-gun burst, Play Card. The burst is a real weapon: it is never captured.',
    ],
    preparation: [
      { move: 'forwardSpecial', hit: false },
      { move: 'downSpecial', hit: false },
      { incoming: true },
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'neutralSpecial' },
      { dash: 'forward' },
      { move: 'throw' },
      { move: 'downSpecial', hit: false },
      { ranged: true, hits: 3 },
      { move: 'finisher' },
    ],
  },
]
