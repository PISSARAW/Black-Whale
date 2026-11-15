import type { NenTechniqueState } from '@black-whale/nen-engine'

export type FighterId = 'kurapika' | 'hisoka' | 'chrollo' | 'morena' | 'benjamin' | 'tserriednich'

export type FighterPose =
  'idle' | 'walk' | 'jump' | 'guard' | 'light' | 'heavy' | 'special' | 'hit' | 'ko'

export type AttackKind = 'light' | 'heavy' | 'special'
export type AttackPhase = 'startup' | 'active' | 'recovery'
export type FightSide = 'player' | 'opponent'
export type FightPhase = 'ready' | 'fighting' | 'finished'
export type FightNenZone = 'head' | 'torso' | 'hands' | 'feet'

export interface FighterDefinition {
  id: FighterId
  /** Catalogue identity consumed by the shared TourScene character rig. */
  modelId: string
  modelRole: 'fighter' | 'hunter' | 'morena'
  name: string
  titleFr: string
  titleEn: string
  specialFr: string
  specialEn: string
  colour: string
  accent: string
  power: number
  speed: number
  reach: number
  specialRange: number
}

export interface ArcadeFighter {
  id: FighterId
  x: number
  y: number
  velocityY: number
  health: number
  aura: number
  nen: NenTechniqueState<FightNenZone>
  facing: -1 | 1
  pose: FighterPose
  hitStun: number
  blockStun: number
  blocking: boolean
  guardFrames: number
  ryuWindow: number
  auraExhausted: boolean
  attack: {
    kind: AttackKind
    frame: number
    impacted: boolean
    auraCharged: boolean
  } | null
  bufferedAttack: { kind: AttackKind; auraCharged: boolean } | null
}

export interface FightInput {
  left: boolean
  right: boolean
  jump: boolean
  down: boolean
  guard: boolean
  aura: boolean
}

export interface FightImpact {
  sequence: number
  attacker: FightSide
  kind: AttackKind
  damage: number
  blocked: boolean
  parried: boolean
  critical: boolean
  points: number
  zone: FightNenZone
  position: { x: number; y: number }
}

export interface FightState {
  player: ArcadeFighter
  opponent: ArcadeFighter
  phase: FightPhase
  frame: number
  time: number
  remainingFrames: number
  frameAccumulator: number
  hitstop: number
  rng: number
  winner: FightSide | 'draw' | null
  score: Record<FightSide, number>
  impact: FightImpact | null
}

export const EMPTY_INPUT: FightInput = {
  left: false,
  right: false,
  jump: false,
  down: false,
  guard: false,
  aura: false,
}
