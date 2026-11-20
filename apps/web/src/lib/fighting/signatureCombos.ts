import type { ArsenalCommand } from './retrospectiveTypes'
import type { CombatFighter } from './combatRoutes'
import type { FighterId, MoveSlot } from './types'

/**
 * Signature combos (SIGNATURE_COMBOS.md): one combo counter from the first hit to the last,
 * through real commands. Movements and Hatsu commands are steps of their own. The rules they
 * rely on are general: accélération (dashCancel.ts), combo capture (throwRules.ts), Emperor
 * Time during a capture (kurapikaActions.ts) and tension élastique (elasticHold.ts).
 */
export type SignatureStep =
  /** `hit: false` marks a technique that moves bodies without striking (recall, rebound). */
  | { move: MoveSlot; hit?: false }
  | { dash: 'back' | 'forward' }
  | { emperor: true }
  | { command: ArsenalCommand }

export interface SignatureCombo {
  id: string
  fighter: CombatFighter
  /** Reference opponent of the demonstration and the tests. */
  opponent: FighterId
  title: readonly [string, string]
  requirement: readonly [string, string]
  steps: readonly SignatureStep[]
}

const VERDICT_OPENING: readonly SignatureStep[] = [
  { move: 'lowLight' },
  { move: 'forwardLight' },
  { move: 'standingHeavy' },
  { dash: 'back' },
  { move: 'backHeavy' },
  { move: 'forwardSpecial' },
  { dash: 'forward' },
]

export const SIGNATURE_COMBOS: readonly SignatureCombo[] = [
  {
    id: 'kurapika:scarlet-verdict',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Verdict écarlate', 'Scarlet Verdict'],
    requirement: [
      'Direct bas, Pas et direct, Crochet au corps, accélération arrière, Contre en retrait, Fouet divinatoire, accélération avant, Capture divinatoire, Emperor Time pendant la capture, Judgment Chain. 59 aura au total.',
      'Low Straight, Step-in Straight, Body Hook, back accélération, Retreating Counter, Dowsing Whip, forward accélération, Dowsing Capture, Emperor Time during the capture, Judgment Chain. 59 aura in all.',
    ],
    steps: [...VERDICT_OPENING, { move: 'throw' }, { emperor: true }, { move: 'finisher' }],
  },
  {
    id: 'kurapika:scarlet-verdict-troupe',
    fighter: 'kurapika',
    opponent: 'chrollo',
    title: ['Verdict écarlate · Brigade', 'Scarlet Verdict · Troupe'],
    requirement: [
      'Contre un membre de la Brigade seulement : Chain Jail remplace la capture. Sur tout autre adversaire, Chain Jail reste soumise à son serment et tue Kurapika.',
      'Against a Troupe member only: Chain Jail replaces the capture. On any other opponent, Chain Jail stays bound by its vow and kills Kurapika.',
    ],
    steps: [
      ...VERDICT_OPENING,
      { move: 'neutralSpecial' },
      { emperor: true },
      { move: 'finisher' },
    ],
  },
  {
    id: 'hisoka:elastic-murder',
    fighter: 'hisoka',
    opponent: 'chrollo',
    title: ['Élastique meurtrier', 'Elastic Murder'],
    requirement: [
      'Entaille de carte, Attache Bungee Gum, accélération arrière pour tendre le lien, Carte basse, Rappel élastique, Vrille du clown, ancrage au plafond, Rebond de gomme vertical, Hache aérienne, Exécution élastique. Une barre d’aura pleine : le Rappel et le Rebond coûtent 5, l’Exécution 40, tant que la cible reste prise.',
      'Card Slash, Bungee Gum Attach, back accélération to stretch the link, Low Card Cut, Elastic Recall, Clown Corkscrew, ceiling anchor, vertical Gum Rebound, Aerial Axe, Elastic Execution. A full aura bar: Recall and Rebound cost 5 and the Execution 40 while the target stays caught.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'neutralSpecial' },
      { dash: 'back' },
      { move: 'lowLight' },
      { move: 'forwardSpecial', hit: false },
      { move: 'forwardHeavy' },
      { command: { action: 'gum-anchor', target: 'ceiling' } },
      { move: 'backSpecial', hit: false },
      { move: 'airHeavy' },
      { move: 'finisher' },
    ],
  },
]

export const signatureCombosFor = (fighter: FighterId) =>
  SIGNATURE_COMBOS.filter((combo) => combo.fighter === fighter)

export function signatureCombo(id: string): SignatureCombo {
  const combo = SIGNATURE_COMBOS.find((entry) => entry.id === id)
  if (!combo) throw Error('Unknown signature combo')
  return combo
}

/** Striking steps, in order: the moves that must each add one hit to the combo. */
export const signatureHits = (combo: SignatureCombo): MoveSlot[] =>
  combo.steps.flatMap((step) => ('move' in step && step.hit !== false ? [step.move] : []))
