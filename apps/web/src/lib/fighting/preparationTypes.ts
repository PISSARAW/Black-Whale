import type { FightSide, FighterId } from './types'

export type PreparationResource =
  | 'animals'
  | 'birds'
  | 'plants'
  | 'objects'
  | 'flutes'
  | 'needles'
  | 'rooms'
  | 'devices'
  | 'writing'
  | 'spirits'
  | 'people'
  | 'musse-history'
  | 'paper'
export type FightEquipment = 'flute' | 'book' | 'needles' | 'blood-infusion'
export interface FightPreparation {
  mode: 'duel' | 'scenario'
  resources: PreparationResource[]
  /** Explicit scenario premise: these allies already bear the feather and share this side's will. */
  cohorts: FightSide[]
}

export type PreparedEntityKind =
  | 'person'
  | 'black-voice'
  | 'weak-spirit'
  | 'device'
  | 'puppet'
  | 'morena'
  | 'supporter'
  | 'animal'
  | 'bird'
  | 'seed'
  | 'crate'
  | 'flute'
  | 'needles'
  | 'room'
  | 'destination'
  | 'delivery'
export interface PreparedEntity {
  device?: import('./deviceTypes').PhysicalDevice
  copy?: import('./chrolloHistoricalTypes').HistoricalCopy
  arena?: import('./arenaTypes').ArenaObject
  id: string
  kind: PreparedEntityKind
  owner: FightSide | 'neutral'
  x: number
  y: number
  present: boolean
  material: 'real' | 'nen'
  health: number
  consenting?: boolean
  feather?: boolean
  sleepingFrames?: number
  sealed?: boolean
  singleDoor?: boolean
  invalidated?: boolean
  visitedBy?: FightSide[]
  linkedTo?: string
  growth?: number
  delivered?: boolean
  controller?: { side: FightSide; source: FighterId; member?: number; person?: string }
}

export interface FightBattlefield {
  entities: PreparedEntity[]
  interactionHeld: Record<FightSide, boolean>
  completed: Record<FightSide, number>
  /** Anchors belong to the actual user; copying a Hatsu never copies this map. */
  luiniAnchors?: Partial<Record<FightSide, string>>
}

export type HatsuRequirement =
  | 'needles'
  | 'flute'
  | 'book'
  | 'free-hands'
  | 'cohort-charge'
  | 'small-animal'
  | 'bird'
  | 'living-target'
  | 'cohort'
  | 'morena'
  | 'hideout'
  | 'intruder'
  | 'sealed-room'
  | 'room-interior'
  | 'luini-anchor'
  | 'visited-destination'
export interface PreparationCheck {
  source: FighterId | null
  requirements: { id: HatsuRequirement; satisfied: boolean }[]
  ready: boolean
}
