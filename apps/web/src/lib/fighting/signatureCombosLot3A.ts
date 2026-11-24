import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Furykov, Cluck, Beyond, Longhi and Musse (31–35, SIGNATURE_COMBOS.md).
 * Non-offensive and unrevealed Hatsu stay strictly faithful to canon: pure Nen fundamentals
 * for Furykov, non-offensive birds for Cluck, Ren martial pressure distinct from the
 * unavailable sacrificial curse for Beyond, no forced contract for Longhi, and Secret Window
 * marking (info only) plus real pistol for Musse.
 */
export const LOT3A_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'furykov:guard-reading',
    fighter: 'furykov',
    opponent: 'kurapika',
    title: ['Lecture du garde', 'Guard Reading'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, accélération arrière, Revers, Balayage, accélération avant, Projection. Fondamentaux martiaux et lecture du Nen uniquement : aucun Hatsu inventé.',
      'Low Strike, Straight, Advance, Hook, back accélération, Backhand, Sweep, forward accélération, Throw. Martial fundamentals and Nen reading only: no invented Hatsu.',
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
    id: 'cluck:messenger-flight',
    fighter: 'cluck',
    opponent: 'saiyu',
    title: ['Vol de messagers', 'Messenger Flight'],
    requirement: [
      'Coup bas, Direct, Crochet, Avancée, accélération arrière, Revers, Balayage, accélération avant, Projection. Ses oiseaux restent strictement non offensifs : aucune nuée d’attaque inventée.',
      'Low Strike, Straight, Hook, Advance, back accélération, Backhand, Sweep, forward accélération, Throw. Her birds remain strictly non-offensive: no invented attack flock.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { dash: 'back' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'beyond:ren-pressure',
    fighter: 'beyond',
    opponent: 'benjamin',
    title: ['Pression du Ren', 'Ren Pressure'],
    requirement: [
      'Coup bas, Direct, Avancée, Crochet, Frappe basse de Ren, accélération avant, Assaut de Ren, Coup d’épaule, Projection. Pression martiale sous Ren uniquement : la malédiction sacrificielle reste hors duel.',
      'Low Strike, Straight, Advance, Hook, Low Ren Blow, forward accélération, Ren Assault, Shoulder Strike, Throw. Ren martial pressure only: the sacrificial curse stays outside duel.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'downSpecial' },
      { dash: 'forward' },
      { move: 'forwardSpecial' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'longhi:moonlight-guard',
    fighter: 'longhi',
    opponent: 'kurapika',
    title: ['Clair de lune', 'Moonlight Guard'],
    requirement: [
      'Coup bas, Direct, Crochet, Avancée, accélération arrière, Revers, Balayage, accélération avant, Projection. Moonlight Act exige un contrat librement signé : aucun contrat forcé en combo.',
      'Low Strike, Straight, Hook, Advance, back accélération, Backhand, Sweep, forward accélération, Throw. Moonlight Act requires a freely signed contract: no forced contract in a combo.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { dash: 'back' },
      { move: 'backHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'musse:secret-window',
    fighter: 'musse',
    opponent: 'camilla',
    title: ['Fenêtre discrète', 'Discreet Window'],
    requirement: [
      'Préparation : Secret Window marque la cible au contact (information seulement, aucun bonus de dégâts). Combo : Coup bas, Direct, Avancée, Crochet, Balayage, accélération arrière, Tir de pistolet réel.',
      'Setup: Secret Window marks the target on contact (information only, no damage bonus). Combo: Low Strike, Straight, Advance, Hook, Sweep, back accélération, real pistol shot.',
    ],
    preparation: [{ move: 'neutralSpecial', hit: false }],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'back' },
      { ranged: true, hits: 1 },
    ],
  },
]
