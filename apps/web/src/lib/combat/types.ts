import type { Polygon, Vec2, WallSegment } from '../tour/types'

export type CombatSide = 'player' | 'opponent'
export type BodyZone = 'head' | 'torso' | 'arms' | 'legs'
export type AuraMode = 'ten' | 'ren' | 'zetsu'
export type FighterCondition = 'ready' | 'staggered' | 'down' | 'ko'
export type Impact = 'miss' | 'blocked' | 'clean' | 'critical' | 'knockdown' | 'ko'
export type MatchOutcome = 'playing' | 'won' | 'lost'
export type ArenaHatsuEffect = 'bind' | 'impact' | 'barrage' | 'restore' | 'enhance'

export const BODY_ZONES: readonly BodyZone[] = ['head', 'torso', 'arms', 'legs']

export interface KoCharge {
  zone: BodyZone
  remaining: number
}

export interface RyuShift {
  attackShare: number
  guard: BodyZone
  remaining: number
}

export interface AttackIntent {
  zone: BodyZone
  remaining: number
  targetAt: Vec2
}

export interface ElasticTether {
  id: string
  owner: CombatSide
  subject: CombatSide
  anchor: Vec2 | null
  restLength: number
  remaining: number
}

export interface FighterState {
  aura: number
  capacity: number
  /** Position in the metric coordinates of the reconstructed room. */
  position: Vec2
  movement: Vec2
  facing: number
  mode: AuraMode
  attackShare: number
  guard: BodyZone
  gyo: boolean
  in: boolean
  ken: boolean
  ko: KoCharge | null
  ryuShift: RyuShift | null
  guardWindow: number
  recoveryWindow: number
  feint: BodyZone | null
  intent: AttackIntent | null
  bound: number
  empowered: number
  cooldown: number
  condition: FighterCondition
  recovery: number
  score: number
}

export interface CombatEvent {
  at: number
  attacker: CombatSide
  zone: BodyZone
  impact: Impact
  points: number
  technique: 'strike' | 'ko' | 'hatsu'
}

export interface CombatState {
  player: FighterState
  opponent: FighterState
  clock: number
  outcome: MatchOutcome
  lastEvent: CombatEvent | null
  terrain: CombatTerrainPhysics
  tethers: ElasticTether[]
}

export interface CombatTerrainPhysics {
  id: string
  footprint: Polygon
  walls: WallSegment[]
}

export interface CombatSetup {
  playerAt: Vec2
  opponentAt: Vec2
  terrain: CombatTerrainPhysics
}

export type CombatAction =
  | { type: 'TICK'; dt: number }
  | { type: 'SYNC_POSITION'; side: CombatSide; position: Vec2 }
  | { type: 'FACE'; side: CombatSide; heading: number }
  | { type: 'EVADE'; side: CombatSide; vector: Vec2 }
  | { type: 'MOVE'; side: CombatSide; vector: Vec2 }
  | { type: 'MODE'; side: CombatSide; mode: AuraMode }
  | { type: 'RYU'; side: CombatSide; attackShare?: number; guard?: BodyZone }
  | { type: 'GYO'; side: CombatSide; on: boolean }
  | { type: 'IN'; side: CombatSide; on: boolean }
  | { type: 'KEN'; side: CombatSide; on: boolean }
  | { type: 'GUARD'; side: CombatSide }
  | { type: 'FEINT'; side: CombatSide; zone: BodyZone }
  | { type: 'PREPARE_STRIKE'; side: CombatSide; zone: BodyZone }
  | {
      type: 'HATSU'
      side: CombatSide
      effect: ArenaHatsuEffect
      zone: BodyZone
      hatsuId?: string
      targetAt?: Vec2
    }
  | { type: 'STRIKE'; side: CombatSide; zone: BodyZone }
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
    facing: 0,
    mode: 'ten',
    attackShare: 0.5,
    guard: 'torso',
    gyo: false,
    in: false,
    ken: false,
    ko: null,
    ryuShift: null,
    guardWindow: 0,
    recoveryWindow: 0,
    feint: null,
    intent: null,
    bound: 0,
    empowered: 0,
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
    outcome: 'playing',
    lastEvent: null,
    terrain: setup.terrain,
    tethers: [],
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
