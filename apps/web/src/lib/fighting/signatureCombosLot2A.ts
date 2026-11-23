import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Rihan, Zakuro, Melody, Basho and Camilla (21–25, SIGNATURE_COMBOS.md).
 * Every route strictly honors canon: live manifestation analysis for Predator, real wound &
 * non-healing blood recall for Bloody Mary, non-damaging flute stopped before striking for
 * Melody, uninterrupted haiku writing for Basho, and real opponent-caused death for Cat's Name.
 */
export const LOT2A_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'rihan:perfect-analysis',
    fighter: 'rihan',
    opponent: 'hanzo',
    title: ['Analyse parfaite', 'Perfect Analysis'],
    requirement: [
      'Accélération arrière, manifestation de Nen observable, analyse complète par Predator, avancée mesurée, Balayage, accélération avant, Projection, Prédation ciblée. Ne fonctionne que contre une manifestation de Nen observable et entièrement comprise.',
      'Back accélération, observable Nen manifestation, complete Predator analysis, measured advance, Sweep, forward accélération, Throw, targeted Predation. Works only against a live, fully understood Nen manifestation.',
    ],
    steps: [
      { dash: 'back', free: true },
      { predator: 'watch' },
      { opponentSpecial: true },
      { predator: 'analyze' },
      { predator: 'launch' },
      { dash: 'forward', free: true },
      { move: 'forwardLight' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'zakuro:scarlet-hound',
    fighter: 'zakuro',
    opponent: 'hinrigh',
    title: ['Limier écarlate', 'Scarlet Hound'],
    requirement: [
      'Préparation : ouvrir une blessure réelle pour déployer Bloody Mary. Combo : Gouttes-yeux, accélération avant, Direct, Crochet, Avancée, Balayage, accélération avant, Coup d’épaule, Projection, rappel du sang. Le rappel arrête le saignement sans jamais soigner Zakuro.',
      'Setup: open a real wound to deploy Bloody Mary. Combo: Eye-drops, forward accélération, Straight, Hook, Advance, Sweep, forward accélération, Shoulder Strike, Throw, blood recall. Recalling blood stops bleeding without ever healing Zakuro.',
    ],
    preparation: [{ mary: 'bleed' }],
    steps: [
      { mary: 'scout' },
      { dash: 'forward', free: true },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
      { mary: 'recall' },
    ],
  },
  {
    id: 'melody:detuned-heartbeat',
    fighter: 'melody',
    opponent: 'kurapika',
    title: ['Battement désaccordé', 'Detuned Heartbeat'],
    requirement: [
      'Revers défensif, accélération arrière, jouer la Musique envoûtante jusqu’à l’apaisement (zéro dégât), arrêter la flûte, revenir à portée, Coup bas, Balayage, accélération avant, Projection. Melody doit arrêter de jouer avant d’attaquer.',
      'Defensive Backfist, back accélération, play Enchanting Music until entranced (zero damage), stop the flute, return to striking range, Low Strike, Sweep, forward accélération, Throw. Melody must stop playing before attacking.',
    ],
    steps: [
      { move: 'backHeavy' },
      { dash: 'back' },
      { melody: 'play' },
      { melody: 'stop' },
      { approach: true },
      { move: 'lowLight' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
    ],
  },
  {
    id: 'basho:burning-fist',
    fighter: 'basho',
    opponent: 'hisoka',
    title: ['Le poing qui brûle', 'The Burning Fist'],
    requirement: [
      'Recul défensif, écrire le haïku attesté pour enflammer le poing, accélération avant, Coup de pied bas, Direct en avançant, Crochet, Balayage, accélération avant, Coup d’épaule, Projection. L’écriture est longue, interruptible et consomme une vraie feuille.',
      'Defensive retreat, write the attested haiku to ignite the fist, forward accélération, Low Kick, Advancing Straight, Hook, Sweep, forward accélération, Shoulder Strike, Throw. Writing is long, interruptible and spends a real paper sheet.',
    ],
    steps: [
      { dash: 'back', free: true },
      { basho: 'write' },
      { dash: 'forward', free: true },
      { dash: 'forward', free: true },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'camilla:second-life',
    fighter: 'camilla',
    opponent: 'benjamin',
    title: ['Deuxième vie', 'Second Life'],
    requirement: [
      'Gifle royale, Revers princier, Fauchage insolent, accélération arrière, Tir de pistolet, mort réelle causée par l’adversaire, Cat’s Name capture le meurtrier, absorbe sa vie et ressuscite Camilla. Aucun déclenchement volontaire tant qu’elle est vivante.',
      'Royal Slap, Princely Backhand, Insolent Sweep, back accélération, Pistol Shot, real death caused by the opponent, Cat’s Name captures the killer, absorbs their life and revives Camilla. Never triggered voluntarily while alive.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'back' },
      { ranged: true, hits: 1 },
      { fatalRiposte: 'standingHeavy' },
    ],
  },
]
