import type { CombatRouteSetup } from './combatRouteSetup'
import type { RosterFighterId } from './rosterChoreography'
import type { MoveSlot } from './types'

type PilotFighter = 'kurapika' | 'hisoka' | 'franklin' | 'benjamin'
export type WakeupRosterFighter = Exclude<RosterFighterId, PilotFighter>

export interface WakeupSignature {
  slot: Extract<MoveSlot, 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'finisher'>
  requirement: readonly [string, string]
  setup?: CombatRouteSetup
}

type Finish = 'backHeavy' | 'forwardLight' | WakeupSignature

export const ROSTER_WAKEUP_PAIRS = [
  ['chrollo', 'machi'],
  ['tserriednich', 'theta'],
  ['feitan', 'phinks'],
  ['saiyu', 'beyond'],
  ['biscuit', 'hanzo'],
  ['illumi', 'kalluto'],
  ['bonolenov', 'shizuku'],
  ['hinrigh', 'zakuro'],
  ['mizaistom', 'gel'],
  ['leorio', 'melody'],
  ['rihan', 'furykov'],
  ['basho', 'longhi'],
  ['camilla', 'halkenburg'],
  ['lynch', 'luini'],
  ['bill', 'yokotani'],
  ['cluck', 'sayird'],
  ['musse', 'padaille'],
  ['terebellum', 'voconte'],
] as const satisfies readonly (readonly [WakeupRosterFighter, WakeupRosterFighter])[]

// Use a standing physical finish where a signature route cannot be confirmed
// from this opener or the character's ability belongs to a separate exchange.
export const WAKEUP_ROSTER_FINISHES = {
  chrollo: {
    slot: 'neutralSpecial',
    requirement: [
      'Pose la marque Soleil avec Sun and Moon ouvert et une main libre. La cible récupère debout.',
      'Apply the Sun mark with Sun and Moon open and a free hand. The defender recovers standing.',
    ],
  },
  tserriednich: 'forwardLight',
  feitan: {
    slot: 'forwardSpecial',
    requirement: [
      'Termine à l’estoc du parapluie. Pain Packer garde son déclenchement propre.',
      'Finish with the umbrella thrust. Pain Packer retains its own trigger.',
    ],
  },
  saiyu: {
    slot: 'forwardSpecial',
    requirement: [
      'Confirme Kikazaru. La privation de l’ouïe prépare l’échange suivant.',
      'Confirm Kikazaru. Hearing loss carries into the next exchange.',
    ],
  },
  theta: {
    slot: 'downSpecial',
    requirement: [
      'Tire aux jambes avec le pistolet disponible. La balle laisse la cible debout.',
      'Shoot at the legs with the available handgun. The shot leaves the defender standing.',
    ],
  },
  biscuit: {
    slot: 'finisher',
    setup: 'true-form',
    requirement: [
      'Biscuit révèle son corps naturel avant l’exercice. Le coup final exige cette forme et 55 points d’aura.',
      'Biscuit reveals her natural body before the drill. The finisher requires that form and 55 aura.',
    ],
  },
  phinks: {
    slot: 'finisher',
    setup: 'cyclotron',
    requirement: [
      'L’exercice commence après une rotation réelle de Cyclotron. Le poing final dépense la charge disponible.',
      'The drill begins after a real Cyclotron rotation. The finishing punch spends the available charge.',
    ],
  },
  machi: {
    slot: 'forwardSpecial',
    requirement: [
      'L’aiguille pose un fil de pistage. La cible reste debout après le contact.',
      'The needle sets a tracking thread. The defender remains standing after contact.',
    ],
  },
  illumi: 'backHeavy',
  kalluto: {
    slot: 'forwardSpecial',
    setup: 'paper',
    requirement: [
      'Un fragment est posé au torse avant l’exercice. Confirme la frappe de papier pendant que ce fragment est disponible.',
      'A fragment is placed on the torso before the drill. Confirm the paper strike while the fragment is available.',
    ],
  },
  bonolenov: {
    slot: 'forwardSpecial',
    setup: 'prologue',
    requirement: [
      'L’exercice prépare Prologue. Confirme la lance pendant que cette forme et l’aura sont disponibles.',
      'The drill prepares Prologue. Confirm the spear while the form and aura are available.',
    ],
  },
  shizuku: {
    slot: 'forwardSpecial',
    requirement: [
      'Termine avec la frappe de Blinky. L’aspiration du sang reste une action distincte.',
      'Finish with the Blinky strike. Blood suction remains a separate action.',
    ],
  },
  hinrigh: 'backHeavy',
  mizaistom: 'backHeavy',
  leorio: 'backHeavy',
  hanzo: {
    slot: 'downSpecial',
    requirement: [
      'Termine avec l’attaque du corps réel. La préparation du double reste une action exposée.',
      'Finish with the physical body’s attack. Preparing the double remains a vulnerable action.',
    ],
  },
  rihan: 'forwardLight',
  zakuro: 'forwardLight',
  melody: 'forwardLight',
  basho: 'backHeavy',
  camilla: 'backHeavy',
  halkenburg: 'backHeavy',
  gel: {
    slot: 'forwardSpecial',
    requirement: ['Termine avec la frappe du bras étendu.', 'Finish with the extended-arm strike.'],
  },
  lynch: 'backHeavy',
  luini: 'forwardLight',
  bill: 'backHeavy',
  furykov: 'backHeavy',
  cluck: 'forwardLight',
  beyond: {
    slot: 'forwardSpecial',
    requirement: [
      'Termine avec la frappe renforcée au Ren. La malédiction conserve sa préparation.',
      'Finish with the Ren-powered strike. The curse retains its own preparation.',
    ],
  },
  longhi: 'forwardLight',
  musse: 'forwardLight',
  padaille: {
    slot: 'neutralSpecial',
    requirement: [
      'Confirme le marteau avec la main droite disponible et l’aura nécessaire.',
      'Confirm the hammer with the right hand available and the required aura.',
    ],
  },
  sayird: 'forwardLight',
  terebellum: {
    slot: 'neutralSpecial',
    requirement: [
      'Termine avec la frappe physique de la main gauche. Sweet Home exige toujours une nouvelle blessure et un contact valide.',
      'Finish with the physical left-hand strike. Sweet Home still requires a new injury and valid contact.',
    ],
  },
  voconte: 'forwardLight',
  yokotani: 'backHeavy',
} satisfies Record<WakeupRosterFighter, Finish>
