import type { PainPackerState } from './feitanPain'
import type { ChrolloBookState } from './chrolloBook'
import type { FightEnvironment } from './fightEnvironment'
import type { LsdfGuard } from './lsdf'
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
  | 'shizuku'
  | 'hinrigh'
  | 'mizaistom'
  | 'leorio'
  | 'hanzo'
  | 'rihan'
  | 'zakuro'
  | 'melody'
  | 'basho'
  | 'camilla'
  | 'halkenburg'
  | 'gel'
  | 'lynch'
  | 'luini'
  | 'bill'
  | 'furykov'
  | 'cluck'
  | 'beyond'
  | 'fugetsu'
  | 'kacho'
  | 'luzurus'
  | 'momoze'
  | 'salesale'
  | 'zhanglei'
  | 'gidal'
  | 'longhi'
  | 'musse'
  | 'padaille'
  | 'tubeppa'
  | 'tyson'
  | 'sayird'
  | 'terebellum'
  | 'voconte'
  | 'yokotani'

export type FighterPose =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'guard'
  | 'light'
  | 'heavy'
  | 'special'
  | 'ranged'
  | 'hit'
  | 'down'
  | 'wakeup'
  | 'ko'

export type AttackKind = 'light' | 'heavy' | 'special' | 'ranged'
export type AttackVariant = 'standing' | 'low' | 'air' | 'throw'
export type MoveAction = 'light' | 'heavy' | 'special' | 'throw' | 'finisher'
export type MoveSlot =
  | 'standingLight'
  | 'standingHeavy'
  | 'lowLight'
  | 'lowHeavy'
  | 'airLight'
  | 'airHeavy'
  | 'forwardLight'
  | 'forwardHeavy'
  | 'backHeavy'
  | 'neutralSpecial'
  | 'forwardSpecial'
  | 'downSpecial'
  | 'backSpecial'
  | 'throw'
  | 'finisher'
export type AttackPhase = 'startup' | 'active' | 'recovery'
export type FightSide = 'player' | 'opponent'
export type FightPhase = 'ready' | 'fighting' | 'finished'
export type FightMode = 'versus-ai' | 'versus-local' | 'training'
export type FightNenZone = 'head' | 'torso' | 'hands' | 'feet'
export type FightFinishReason = 'hits' | 'knockout' | 'technical-knockout' | 'time' | 'expulsion' | null

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
  knockdownFrames: number
  wakeupInvulnerableFrames: number
  reversalWindow: number
  comboHits: number
  comboDamage: number
  juggleCount: number
  blocking: boolean
  guardFrames: number
  ryuWindow: number
  auraExhausted: boolean
  hatsuChargeFrames: number
  hatsuEffects: FighterHatsuEffects
  /** Bandit's Secret: retained pages, one open page and one Double Face bookmark. */
  chrolloBook?: ChrolloBookState
  /** Texture Surprise disguises an existing cloth panel, never the physical body. */
  textureSurprise?: { surface: 'cloth' }
  /** Skill 4: the controlled double leaves a separate, vulnerable sleeping body. */
  hanzoProjection?: {
    bodyX: number
    bodyFacing: -1 | 1
    bodyNen: NenTechniqueState<FightNenZone>
    startupFrames: number
  }
  /** On (怨): hatred banked from damage, and the seal its blood leaves. Absent until hit. */
  on?: { grudge: number; sealFrames: number }
  /** Dash, prejump, landing and air drift; absent until the fighter first moves. */
  motion?: FighterMotion
  attack: {
    moveId?: string
    variant?: AttackVariant
    confirmedHit?: boolean
    kind: AttackKind
    frame: number
    impacted: boolean
    auraCharged: boolean
    concealed: boolean
    hatsuSource: FighterId | null
    projectileSpawned: boolean
    projectilesSpawned?: number
    reversal: boolean
  } | null
  bufferedAttack: {
    moveId?: string
    variant?: AttackVariant
    confirmedHit?: boolean
    kind: AttackKind
    auraCharged: boolean
    concealed: boolean
    hatsuSource: FighterId | null
  } | null
}

export interface FighterDash {
  direction: -1 | 1
  frame: number
  frames: number
  peak: number
}

export interface FighterMotion {
  velocityX: number
  prejumpFrames: number
  jumpDirection: -1 | 0 | 1
  landingFrames: number
  dash: FighterDash | null
  heldDirection: -1 | 0 | 1
  tapDirection: -1 | 0 | 1
  tapWindow: number
}

export interface FighterHatsuEffects {
  painPacker: PainPackerState | null
  forcedZetsuFrames: number
  contagionFrames: number
  contagionStacks: number
  futureSight: number
  batonCharges: number
  senseSeals: number
  blinkyFrames: number
  cohortWillFrames: number
  arrowNocked: number
  possessedFrames: number
  sunMark: number
  moonMark: number
  manipulatedFrames: number
  transformationFrames: number
  isolationFrames: number
  cyclotronTurns: number
  stitchedFrames: number
  needleFrames: number
  serpentMarks: number
  cantabileFrames: number
  biohazardFrames: number
  restrainedFrames: number
  predatorFrames: number
  bloodBoundFrames: number
  entrancedFrames: number
  haikuFrames: number
  venomFrames: number
  soulExposedFrames: number
  teleportDodges: number
  growthFrames: number
  wormDodges: number
  kachoGuards: number
  desireFrames: number
  momozeFrames: number
  smokeFrames: number
  coinCharges: number
  gidalCurseFrames: number
  contractFrames: number
  weaponFrames: number
  synthesisFrames: number
  eyeWogFrames: number
  doorDodges: number
  /** Set once the Hatsu was activated in front of this fighter. */
  witnessedHatsu: FighterId | null
  /** Last acquired page; the book itself decides which abilities can be used. */
  stolenHatsu: FighterId | null
  /** 1 while the fighter's own Hatsu sits in Chrollo's book. */
  hatsuStolen: number
}

export interface FightInput {
  /** Speech directed at a nearby sleeping body, to interrupt Hanzo Skill 4. */
  call?: boolean
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
  knockdown: boolean
  counterHit: boolean
  punish: boolean
  antiAir: boolean
  wallSplat: boolean
  invulnerable: boolean
  comboHits: number
  damageScale: number
  points: number
  zone: FightNenZone
  concealed: boolean
  avoided: boolean
  projectileId: number | null
  position: { x: number; y: number }
  /** Sweet Home moves the wound once; it never creates an invulnerable/avoided hit. */
  transfer?: { owner: FightSide; from: FightSide; to: FightSide; backlash: boolean }
}

export type ProjectileShape =
  'card' | 'chain' | 'page' | 'seed' | 'orb' | 'eye' | 'bullet' | 'stone' | 'remote-fist'

export interface RemotePunchPath {
  originX: number
  targetX: number
  travelFrames: number
  struck: boolean
}

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
  /** `object` for real thrown matter; `nen` for conjured or emitted aura. */
  matter: ProjectileMatter
  remotePunch?: RemotePunchPath
}

export type ProjectileMatter = 'object' | 'nen'

export interface BungeeGumAttachment {
  owner: FightSide
  target: FightSide
  hidden: boolean
  /** The owner is reeling the target in; cleared once the line goes slack. */
  retracting: boolean
  /** The owner launches themselves toward the stretched target attachment. */
  rebounding?: boolean
}

export interface FightState {
  environment: FightEnvironment
  /** Autonomous guards, never avoidance charges on the fighter. */
  lsdf?: Partial<Record<FightSide, LsdfGuard>>
  expulsion?: { owner: FightSide; target: FightSide; sequence: number }
  formatId: FightFormatId
  mode: FightMode
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
  matchWinner: FightSide | null
  roundNumber: number
  roundsWon: Record<FightSide, number>
  finishReason: FightFinishReason
  score: Record<FightSide, number>
  knockdowns: Record<FightSide, number>
  bungeeGum: BungeeGumAttachment | null
  projectiles: FightProjectile[]
  nextProjectileId: number
  impact: FightImpact | null
  /** Positions before the last simulated frame, read by the renderer to interpolate. */
  previousPositions?: Record<FightSide, { x: number; y: number }>
  /** Frames until the AI opponent picks its next action. */
  aiCooldown?: number
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
