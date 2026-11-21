import { SECOND_SIGNATURE_COMBOS } from './signatureCombosSecond'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { CombatFighter } from './combatRoutes'
import type { FighterId, MoveSlot } from './types'
import type { SignatureMotionStep } from './signatureMotionSteps'
import { BOOK_AND_ARMY_SIGNATURES } from './signatureCombosBookArmy'
import { BISCUIT_AND_PHINKS_SIGNATURES } from './signatureCombosBiscuitPhinks'

/**
 * Signature combos (SIGNATURE_COMBOS.md): one combo counter from the first hit to the last,
 * through real commands. Movements and Hatsu commands are steps of their own. The rules they
 * rely on are general: accélération (dashCancel.ts), combo capture (throwRules.ts), Emperor
 * Time during a capture (kurapikaActions.ts) and tension élastique (elasticHold.ts).
 */
export type SignatureStep =
  /** `hit: false` marks a technique that moves bodies without striking (recall, rebound). */
  | { move: MoveSlot; hit?: false }
  /**
   * `through` crosses the other body (signatureCrossing.ts); `free`: a dash from neutral, not
   * an accélération; `low`: Phinks's low dodge (down held).
   */
  | { dash: 'back' | 'forward' | 'through'; free?: true; low?: true }
  | { emperor: true }
  | { command: ArsenalCommand }
  /** Parallel Future: close the eyes in Zetsu, wait for the vision, open them to diverge. */
  | { future: 'close' | 'vision' | 'open' }
  /** The opponent strikes back with this move; the step ends once the player is hurt. */
  | { riposte: MoveSlot }
  /** The fighter's ranged attack; `hits` is the number of projectiles that must land. */
  | { ranged: true; hits: number }
  /** Biscuit reveals her natural body: a state for the round, not a strike (biscuitForm.ts). */
  | { trueForm: true }
  | SignatureMotionStep

/** Preparation also lets the opponent fire its ranged attack (a projectile to capture). */
export type SignaturePreparationStep = SignatureStep | { incoming: true }

export interface SignatureCombo {
  id: string
  fighter: CombatFighter
  /** Reference opponent of the demonstration and the tests. */
  opponent: FighterId
  title: readonly [string, string]
  requirement: readonly [string, string]
  /** Played and settled before the combo: marks, pages and cards are never spontaneous. */
  preparation?: readonly SignaturePreparationStep[]
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

const FIRST_SIGNATURE_COMBOS: readonly SignatureCombo[] = [
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
  ...BOOK_AND_ARMY_SIGNATURES,
  ...BISCUIT_AND_PHINKS_SIGNATURES,
]

export const SIGNATURE_COMBOS: readonly SignatureCombo[] = [
  ...FIRST_SIGNATURE_COMBOS,
  ...SECOND_SIGNATURE_COMBOS,
]

export const signatureCombosFor = (fighter: FighterId) =>
  SIGNATURE_COMBOS.filter((combo) => combo.fighter === fighter)

export function signatureCombo(id: string): SignatureCombo {
  const combo = SIGNATURE_COMBOS.find((entry) => entry.id === id)
  if (!combo) throw Error('Unknown signature combo')
  return combo
}

/** Striking steps, in order: each move, or each projectile of a ranged step, adds one hit. */
export const signatureHits = (combo: SignatureCombo): (MoveSlot | 'ranged')[] =>
  combo.steps.flatMap((step) => {
    if ('ranged' in step) return Array<'ranged'>(step.hits).fill('ranged')
    return 'move' in step && step.hit !== false ? [step.move] : []
  })

/**
 * Expected combo counter of each striking step. A riposte, or closing the eyes for a
 * vision, is a deliberate break: the next strike opens a new combo.
 */
export function signatureComboCounts(combo: SignatureCombo): number[] {
  let count = 0
  return combo.steps.flatMap((step) => {
    if ('riposte' in step || ('future' in step && step.future === 'close')) count = 0
    const hits = 'ranged' in step ? step.hits : Number('move' in step && step.hit !== false)
    return Array.from({ length: hits }, () => ++count)
  })
}
