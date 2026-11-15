import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { FightFormatId } from './formats'

export type FighterId =
  | 'kurapika'
  | 'hisoka'
  | 'chrollo'
  | 'morena'
  | 'benjamin'
  | 'tserriednich'
  | 'feitan'
  | 'saiyu'
  | 'theta'
  | 'biscuit'
  | 'marayam'
  | 'phinks'
  | 'franklin'
  | 'machi'
  | 'illumi'
  | 'kalluto'
  | 'bonolenov'

export type FighterPose =
  'idle' | 'walk' | 'jump' | 'guard' | 'light' | 'heavy' | 'special' | 'ranged' | 'hit' | 'ko'

export type AttackKind = 'light' | 'heavy' | 'special' | 'ranged'
export type AttackVariant = 'standing' | 'low' | 'air' | 'throw'
export type AttackPhase = 'startup' | 'active' | 'recovery'
export type FightSide = 'player' | 'opponent'
export type FightPhase = 'ready' | 'fighting' | 'finished'
export type FightNenZone = 'head' | 'torso' | 'hands' | 'feet'
export type FightFinishReason = 'hits' | 'knockout' | 'time' | null

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
  crouching?: boolean
  throwTechFrames?: number
  blocking: boolean
  guardFrames: number
  ryuWindow: number
  auraExhausted: boolean
  hatsuChargeFrames: number
  hatsuEffects: FighterHatsuEffects
  attack: {
    variant?: AttackVariant
    confirmedHit?: boolean
    kind: AttackKind
    frame: number
    impacted: boolean
    auraCharged: boolean
    concealed: boolean
    hatsuSource: FighterId | null
    projectileSpawned: boolean
  } | null
  bufferedAttack: {
    variant?: AttackVariant
    confirmedHit?: boolean
    kind: AttackKind
    auraCharged: boolean
    concealed: boolean
    hatsuSource: FighterId | null
  } | null
}

export interface FighterHatsuEffects {
  forcedZetsuFrames: number
  contagionFrames: number
  contagionStacks: number
  futureSight: number
  batonCharges: number
  senseSeals: number
  sunMoonMarks: number
  manipulatedFrames: number
  transformationFrames: number
  isolationFrames: number
  cyclotronTurns: number
  stitchedFrames: number
  needleFrames: number
  serpentMarks: number
  cantabileFrames: number
  lastHatsuReceived: FighterId | null
}

export interface FightInput {
  left: boolean
  right: boolean
  jump: boolean
  down: boolean
  guard: boolean
  aura: boolean
  hatsu: boolean
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
  concealed: boolean
  avoided: boolean
  projectileId: number | null
  position: { x: number; y: number }
}

export type ProjectileShape =
  'card' | 'chain' | 'page' | 'seed' | 'orb' | 'eye' | 'bullet' | 'stone'

export interface FightProjectile {
  id: number
  owner: FightSide
  fighterId: FighterId
  x: number
  y: number
  velocityX: number
  width: number
  height: number
  damage: number
  hitstun: number
  blockstun: number
  hitstop: number
  knockback: number
  targetZone: FightNenZone
  shape: ProjectileShape
  colour: string
  age: number
  lifetime: number
}

export interface BungeeGumAttachment {
  owner: FightSide
  target: FightSide
  hidden: boolean
}

export interface FightState {
  formatId: FightFormatId
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
  finishReason: FightFinishReason
  score: Record<FightSide, number>
  bungeeGum: BungeeGumAttachment | null
  projectiles: FightProjectile[]
  nextProjectileId: number
  impact: FightImpact | null
}

export const EMPTY_INPUT: FightInput = {
  left: false,
  right: false,
  jump: false,
  down: false,
  guard: false,
  aura: false,
  hatsu: false,
}
