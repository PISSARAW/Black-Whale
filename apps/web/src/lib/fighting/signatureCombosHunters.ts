import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Hinrigh, Mizaistom, Leorio and Hanzo (SIGNATURE_COMBOS.md).
 * Each relies strictly on canonical conditions: real transformed handcuffs and finite knives
 * for Hinrigh, opponent disobedience after Cross Game's yellow card for Mizaistom, a
 * non-tracking floor-transmitted punch for Leorio, and an exposed sleeping body for Hanzo.
 */
export const HUNTERS_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'hinrigh:urban-menagerie',
    fighter: 'hinrigh',
    opponent: 'feitan',
    title: ['Ménagerie urbaine', 'Urban Menagerie'],
    requirement: [
      'Transformer les menottes en pigeon jusqu’à la capture au contact, accélération avant, Coup bas discret, Pigeon de métal, Crosse animale, Fauchage de la famille, accélération avant, Biohazard urbain, recul et couteau réel de conclusion. Les animaux restent les objets transformés ; les couteaux sont finis.',
      'Transform the handcuffs into a pigeon until contact capture, forward accélération, Discrete Low, Metal Pigeon, Animal Stock, Family Sweep, forward accélération, Urban Biohazard, retreat and real finishing knife. Animals stay transformed objects; knives are finite.',
    ],
    steps: [
      { biohazard: 'capture' },
      { dash: 'forward', free: true },
      { move: 'lowLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
      { dash: 'back' },
      { ranged: true, hits: 1 },
    ],
  },
  {
    id: 'mizaistom:interrupted-hearing',
    fighter: 'mizaistom',
    opponent: 'saiyu',
    title: ['Audience interrompue', 'Interrupted Hearing'],
    requirement: [
      'Direct, Coup de paume, accélération arrière, carton jaune et ordre d’arrêt, désobéissance adverse déclenchant Restraint, accélération avant, Contrôle d’identité, accélération avant, Audience close, Balayage à la libération. Si l’adversaire obéit, la route s’arrête : le carton ne garantit pas un combo.',
      'Straight, Palm Strike, back accélération, yellow card and halt order, opponent disobedience triggering Restraint, forward accélération, Identity Check, forward accélération, Hearing Closed, Sweep on release. If the opponent obeys, the route stops: the card never guarantees a combo.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { dash: 'back' },
      { move: 'neutralSpecial', hit: false },
      { disobey: 'standingLight' },
      { dash: 'forward', free: true },
      { move: 'forwardLight' },
      { dash: 'forward' },
      { move: 'throw' },
      { move: 'lowHeavy' },
    ],
  },
  {
    id: 'leorio:under-the-floor',
    fighter: 'leorio',
    opponent: 'hisoka',
    title: ['Sous le plancher', 'Under the Floor'],
    requirement: [
      'Direct, Direct d’urgence, Crochet, Balayage, accélération arrière, frappe du sol et Poing à distance sous la cible, accélération avant, Diagnostic bas, Salle d’opération. Le poing apparaît au point choisi au moment de la frappe et ne suit pas l’adversaire.',
      'Straight, Emergency Straight, Hook, Sweep, back accélération, floor strike and Remote Punch beneath the target, forward accélération, Low Diagnosis, Operating Room. The fist emerges at the point chosen on floor strike and never tracks the opponent.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'back' },
      { move: 'neutralSpecial' },
      { dash: 'forward' },
      { move: 'forwardHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'hanzo:empty-body',
    fighter: 'hanzo',
    opponent: 'kurapika',
    title: ['Corps vide', 'Empty Body'],
    requirement: [
      'Recul libre, Projection du double astral, traversée de la cible, Paume aérienne astrale, descente derrière elle, Main ouverte, Tranchant de la main, Pas du plafond, Double astral · Étranglement. Le corps endormi demeure exposé et toucher celui-ci interrompt la séquence.',
      'Free back dash, Astral Double projection, crossing through the target, Aerial Palm, descent behind them, Open-hand Strike, Knife-hand Chop, Ceiling Step, Astral Double · Choke. The sleeping body stays exposed and touching it interrupts the sequence.',
    ],
    steps: [
      { dash: 'back', free: true },
      { astral: 'project' },
      { astral: 'cross' },
      { move: 'airLight' },
      { astral: 'descend' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { move: 'finisher' },
    ],
  },
]
