import type { DangerBoundary, PassageBoundary, Polygon, Vec2, WallSegment } from '../tour/types'

export type CombatSide = 'player' | 'opponent'
export type BodyZone = 'head' | 'torso' | 'arms' | 'legs'
export type AuraMode = 'ten' | 'ren' | 'zetsu'
export type FighterCondition = 'ready' | 'staggered' | 'down' | 'ko'
export type Impact = 'miss' | 'blocked' | 'clean' | 'critical' | 'knockdown' | 'ko'
export type MatchOutcome = 'playing' | 'won' | 'lost'
export type ArenaHatsuEffect = 'bind' | 'impact' | 'barrage' | 'restore' | 'enhance'
export type ArenaDuelContext = 'REGULATED' | 'CLANDESTINE' | 'NARRATIVE'

export const BODY_ZONES: readonly BodyZone[] = ['head', 'torso', 'arms', 'legs']

export interface KoCharge {
  zone: BodyZone
  remaining: number
}

export interface RyuShift {
  attackShare: number
  guard: BodyZone
  remaining: number
  /** A timed automatic focus returns to this allocation instead of settling permanently. */
  restore?: Pick<RyuShift, 'attackShare' | 'guard'>
}

export interface ArenaJump {
  elapsed: number
  velocity: number
  direction: Vec2
}

export interface AttackIntent {
  zone: BodyZone
  remaining: number
  targetAt: Vec2
  technique?: 'strike' | 'hatsu'
  power?: number
  range?: number
  recovery?: number
  /** Authored Clash contact freeze, expressed in Arena seconds. */
  hitstop?: number
  /** Clash move this intent performs; absent for Arena's own strikes. */
  moveId?: string
  /** Clash moves of the running combo, this one included. */
  combo?: readonly string[]
  /** Points the combo had already scored when this move was prepared. */
  scored?: number
  /** Authored Clash lunge, projected progressively onto the attacker's local 3D axis. */
  drive?: {
    total: number
    applied: number
    duration: number
    direction: Vec2
  }
}

export interface ElasticTether {
  id: string
  owner: CombatSide
  subject: CombatSide
  anchor: Vec2 | null
  restLength: number
  remaining: number
}

export interface PersistentNenEffect {
  id: string
  kind: 'TRANSFORMED_OBJECT' | 'CAPTURED_ABILITY' | 'HIDDEN_TRAP'
  owner: CombatSide
  target: CombatSide | null
  sourceHatsuId: string
  remaining: number | null
  detail: string | null
}

/** A non-living Arena solid that a deterministic combat command has displaced. */
export interface ArenaPhysicalObject {
  id: string
  position: Vec2
  storedBy: CombatSide | null
}

export interface FighterState {
  aura: number
  capacity: number
  /** Position in the metric coordinates of the reconstructed room. */
  position: Vec2
  movement: Vec2
  /** Vertical metres above the room floor; planar position remains in `position`. */
  height: number
  jump: ArenaJump | null
  facing: number
  mode: AuraMode
  attackShare: number
  guard: BodyZone
  gyo: boolean
  in: boolean
  ken: boolean
  en: number | null
  shuObjectId: string | null
  ko: KoCharge | null
  ryuShift: RyuShift | null
  guardWindow: number
  recoveryWindow: number
  feint: BodyZone | null
  intent: AttackIntent | null
  bound: number
  empowered: number
  hatsuSequence: { id: string; count: number; lastAt: number } | null
  hatsuPreparation: {
    id: 'parallel-future' | 'rihan-predator'
    observations: number
    targetHatsuId: string | null
    expiresAt: number
  } | null
  cooldown: number
  condition: FighterCondition
  recovery: number
  score: number
  /** Cancel window left open by the last landed Clash move. */
  chain?: import('./moveChain').MoveChain | null
  /** Clash move pressed before the running one landed. */
  buffered?: import('./moveChain').BufferedMove | null
}

export interface CombatEvent {
  at: number
  attacker: CombatSide
  zone: BodyZone
  impact: Impact
  points: number
  technique: 'strike' | 'ko' | 'hatsu'
  parried?: boolean
  moveId?: string
  /** Contact freeze applied by this event, expressed in seconds. */
  hitstop?: number
}

export interface CombatState {
  player: FighterState
  opponent: FighterState
  clock: number
  /** Remaining authored contact freeze; replay ticks continue while combat time does not. */
  hitstop: number
  outcome: MatchOutcome
  lastEvent: CombatEvent | null
  terrain: CombatTerrainPhysics
  tethers: ElasticTether[]
  nenEffects: PersistentNenEffect[]
  /** Physical scenery touched by combat, keyed by the Tour structure id. */
  physicalObjects: Record<string, ArenaPhysicalObject>
  opponentMemory: OpponentMemory
  lastHatsuBySide: Record<CombatSide, string | null>
  /** `clash`: Arena duels use Clash's Nen economy and exchange factors (combat/clashNen.ts). */
  nenRules?: 'clash'
  environment: {
    context: ArenaDuelContext
    noise: number
    witnesses: number
    securityAlert: number
    interventionIn: number | null
    intervened: boolean
  }
}

export interface OpponentMemory {
  observedEventAt: number | null
  zones: Record<BodyZone, number>
  hypothesis: {
    preferredZone: BodyZone | null
    confidence: number
    concealedAttacks: number
    knownHatsuIds: string[]
  }
}

export interface CombatTerrainPhysics {
  id: string
  footprint: Polygon
  walls: WallSegment[]
  /**
   * The footprint's open edges: ways out (`passage`) and exposed hazards
   * (`danger`). Solid edges are colliders carried by `walls` and are not repeated
   * here, which keeps the two from drifting apart.
   */
  boundaries?: Array<PassageBoundary | DangerBoundary>
}

export interface CombatSetup {
  playerAt: Vec2
  opponentAt: Vec2
  terrain: CombatTerrainPhysics
  context?: ArenaDuelContext
}

export type CombatAction =
  | { type: 'TICK'; dt: number }
  | { type: 'SYNC_POSITION'; side: CombatSide; position: Vec2 }
  | { type: 'FACE'; side: CombatSide; heading: number }
  | { type: 'EVADE'; side: CombatSide; vector: Vec2 }
  | { type: 'MOVE'; side: CombatSide; vector: Vec2 }
  | { type: 'JUMP'; side: CombatSide; vector: Vec2 }
  | { type: 'MODE'; side: CombatSide; mode: AuraMode }
  | { type: 'RYU'; side: CombatSide; attackShare?: number; guard?: BodyZone }
  | { type: 'GYO'; side: CombatSide; on: boolean }
  | { type: 'IN'; side: CombatSide; on: boolean }
  | { type: 'KEN'; side: CombatSide; on: boolean }
  | { type: 'EN'; side: CombatSide; radius: number | null }
  | { type: 'SHU'; side: CombatSide; objectId: string; on: boolean }
  | { type: 'GUARD'; side: CombatSide }
  | { type: 'FEINT'; side: CombatSide; zone: BodyZone }
  | { type: 'PREPARE_STRIKE'; side: CombatSide; zone: BodyZone }
  | {
      type: 'FIGHTING_MOVE'
      side: CombatSide
      fighterId: import('../fighting/types').FighterId
      slot: import('../fighting/types').MoveSlot
      targetAt: Vec2
      /** A raycast-selected, non-living Tour solid; absent when aiming at a body or empty space. */
      targetObject?: { id: string; position: Vec2 }
    }
  | { type: 'PREPARE_HATSU'; side: CombatSide; hatsuId: 'parallel-future' | 'rihan-predator' }
  | {
      type: 'HATSU'
      side: CombatSide
      effect: ArenaHatsuEffect
      zone: BodyZone
      hatsuId?: string
      cost?: number
      targetAt?: Vec2
    }
  | { type: 'STRIKE'; side: CombatSide; zone: BodyZone; targetAt?: Vec2 }
  | { type: 'KO'; side: CombatSide; zone: BodyZone }

export function otherSide(side: CombatSide): CombatSide {
  return side === 'player' ? 'opponent' : 'player'
}

export function initialFighter(position: Vec2): FighterState {
  return {
    aura: 100,
    capacity: 100,
    position,
    movement: [0, 0],
    height: 0,
    jump: null,
    facing: 0,
    mode: 'ten',
    attackShare: 0.5,
    guard: 'torso',
    gyo: false,
    in: false,
    ken: false,
    en: null,
    shuObjectId: null,
    ko: null,
    ryuShift: null,
    guardWindow: 0,
    recoveryWindow: 0,
    feint: null,
    intent: null,
    bound: 0,
    empowered: 0,
    hatsuSequence: null,
    hatsuPreparation: null,
    cooldown: 0,
    condition: 'ready',
    recovery: 0,
    score: 0,
  }
}

export function initialCombatState(setup: CombatSetup = defaultSetup()): CombatState {
  return {
    player: initialFighter(setup.playerAt),
    opponent: initialFighter(setup.opponentAt),
    clock: 0,
    hitstop: 0,
    outcome: 'playing',
    lastEvent: null,
    terrain: setup.terrain,
    tethers: [],
    nenEffects: [],
    physicalObjects: {},
    opponentMemory: {
      observedEventAt: null,
      zones: { head: 0, torso: 0, arms: 0, legs: 0 },
      hypothesis: {
        preferredZone: null,
        confidence: 0,
        concealedAttacks: 0,
        knownHatsuIds: [],
      },
    },
    lastHatsuBySide: { player: null, opponent: null },
    environment: {
      context: setup.context ?? 'REGULATED',
      noise: 0,
      witnesses: 0,
      securityAlert: 0,
      interventionIn: null,
      intervened: false,
    },
  }
}

function defaultSetup(): CombatSetup {
  return {
    playerAt: [0, 0],
    opponentAt: [20, 0],
    terrain: {
      id: 'test-ground',
      footprint: [
        [-50, -50],
        [50, -50],
        [50, 50],
        [-50, 50],
      ],
      walls: [],
    },
  }
}
