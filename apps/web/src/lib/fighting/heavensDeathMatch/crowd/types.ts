import type { Vec3 } from '../stands/geometry'

/**
 * What a body really is. Never shown as such to the Hisoka player: a copy and a
 * person driven by Black Voice look and move like any frightened spectator.
 */
export type SpectatorNature = 'human' | 'copy' | 'controlled'

export type SpectatorPosture =
  | 'seated'
  | 'standing'
  | 'fleeing'
  | 'airborne'
  | 'held'
  | 'injured'
  | 'dead'
  | 'evacuated'
  /** A Gallery Fake copy that ceased to exist. */
  | 'vanished'

/** Simplified visual identity: enough for a copy to be told from its neighbour, not from its source. */
export interface SpectatorLook {
  palette: number
  height: number
  build: number
  hair: number
}

export type PuppetOrder =
  | 'hold'
  | 'surround-hisoka'
  | 'explode-near-hisoka'
  | 'charge'
  | 'trip-hisoka'
  | 'shield-chrollo'
  /** Black Voice carrier bringing the Moon to the linked Sun-marked torso. */
  | 'touch-sun'
  /** After the last blast: climb on Hisoka until he is buried. */
  | 'pile-on-hisoka'

export interface SpectatorMarks {
  sun: boolean
  moon: boolean
  stamped: boolean
  blackVoice: boolean
  /** Frames the Sun mark has been charged; a full charge strengthens the blast. */
  sunCharge: number
  /** Where the Sun was drawn; a mark on the head leaves with the head. */
  sunSite?: 'head' | 'body'
}

export interface Spectator {
  id: string
  look: SpectatorLook
  /** Face worn after Convert Hands: a spectator may carry Chrollo's. */
  face: 'own' | 'chrollo'
  seat: Vec3
  at: Vec3
  velocity: Vec3
  posture: SpectatorPosture
  health: number
  nature: SpectatorNature
  /** Source body of a Gallery Fake copy. */
  copyOf?: string
  createdFrame?: number
  /** True when the copy was made while Hisoka could see it. */
  madeInSight?: boolean
  marks: SpectatorMarks
  order?: PuppetOrder
  /** Destination set by an order or a throw target; humans follow `route` instead. */
  goal?: Vec3
  route: readonly string[]
  routeIndex: number
  fear: number
  gum: boolean
  /** Hisoka saw it break, bleed or vanish like a copy. */
  revealedToHisoka: boolean
  cause?: 'trauma' | 'crush' | 'blast' | 'fall'
  /** The head was taken off; it lives on as a `DetachedHead`. */
  headless?: boolean
}

/** A limb of Hisoka's a gum line may tie a head to. */
export type HisokaLimb = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot'

/** A head cut from its body, still bound to it: detonating the body detonates the head. */
export interface DetachedHead {
  id: string
  bodyId: string
  at: Vec3
  velocity: Vec3
  /** Gum ties it to one of Hisoka's limbs; null lies loose or flies. */
  tiedTo: HisokaLimb | null
  flying: boolean
  /** Carries the Sun when it was drawn on the head. */
  sun: boolean
  spent: boolean
}

export interface CrowdState {
  frame: number
  rng: number
  spectators: readonly Spectator[]
  nextId: number
  heads?: readonly DetachedHead[]
}

export const NO_MARKS: SpectatorMarks = {
  sun: false,
  moon: false,
  stamped: false,
  blackVoice: false,
  sunCharge: 0,
}

export function living(spectator: Spectator): boolean {
  return !['dead', 'evacuated', 'vanished'].includes(spectator.posture)
}

export function present(spectator: Spectator): boolean {
  return spectator.posture !== 'evacuated' && spectator.posture !== 'vanished'
}
