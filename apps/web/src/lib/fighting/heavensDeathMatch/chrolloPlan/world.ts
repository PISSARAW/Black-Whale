import type { ChrolloBookState } from '../../chrolloBook'
import { createCrowd, type CrowdOptions } from '../crowd/create'
import { NO_MARKS, living, type CrowdState, type Spectator } from '../crowd/types'
import { createDeathMatchChrolloBook } from '../loadout'
import { createDeathMatch, type DeathMatchOptions, type DeathMatchState } from '../scenario'
import { NO_DAMAGE, type StandsDamage, visibilityThroughSmoke } from '../stands/damage'
import type { Vec3 } from '../stands/geometry'

export interface ChrolloBody {
  at: Vec3
  book: ChrolloBookState
  /** Convert Hands: the spectator whose face Chrollo wears, who wears his. */
  disguisedAs: string | null
  /** The commentator's microphone, wired to the hall's speakers. */
  microphone: boolean
  /** Frames left of the fall back into the crowd that follows each surprise blow. */
  withdrawal: number
}

export interface HisokaBody {
  at: Vec3
  /** Unit direction of his gaze on the floor plane. */
  facing: { x: number; z: number }
  /** Bodies his gum currently sticks to. */
  gumAnchors: readonly string[]
  /** Fighting puppets, swinging or recovering: a moment Chrollo may strike. */
  busy: boolean
}

/** Everything the canonical plan reads and changes, apart from the fighters' own engine. */
export interface DeathMatchWorld {
  scenario: DeathMatchState
  crowd: CrowdState
  damage: StandsDamage
  chrollo: ChrolloBody
  hisoka: HisokaBody
}

export const REFEREE_ID = 'referee'
export const COMMENTATOR_BOOTH: Vec3 = { x: -21, y: 2.0, z: -12 }

function referee(): Spectator {
  // Behind the duel lane, at the back of the ring, between the two Floor Masters.
  const at = { x: 0, y: 0, z: -1.5 }
  return {
    id: REFEREE_ID,
    look: { palette: 0, height: 1.75, build: 0.5, hair: 0 },
    face: 'own',
    seat: at,
    at,
    velocity: { x: 0, y: 0, z: 0 },
    posture: 'standing',
    health: 100,
    nature: 'human',
    marks: NO_MARKS,
    route: [],
    routeIndex: 0,
    fear: 0,
    gum: false,
    revealedToHisoka: false,
  }
}

export interface WorldOptions {
  scenario?: Partial<DeathMatchOptions>
  crowd?: CrowdOptions
}

/** The hall before the bell: a seated crowd, the referee between the two Floor Masters. */
export function createDeathMatchWorld(options: WorldOptions = {}): DeathMatchWorld {
  const crowd = createCrowd(options.crowd)
  return {
    scenario: createDeathMatch(options.scenario),
    crowd: { ...crowd, spectators: [referee(), ...crowd.spectators] },
    damage: NO_DAMAGE,
    chrollo: {
      at: { x: 3, y: 0, z: 0.3 },
      book: createDeathMatchChrolloBook(),
      disguisedAs: null,
      microphone: false,
      withdrawal: 0,
    },
    hisoka: { at: { x: -3, y: 0, z: 0.3 }, facing: { x: 1, z: 0 }, gumAnchors: [], busy: false },
  }
}

const SIGHT_RANGE = 26
const SIGHT_COS = Math.cos((65 * Math.PI) / 180)

/** Hisoka's eyes: a cone in front of him, shortened by distance and dimmed by smoke. */
export function hisokaSees(world: DeathMatchWorld, point: Vec3): boolean {
  const { at, facing } = world.hisoka
  const dx = point.x - at.x
  const dz = point.z - at.z
  const distance = Math.hypot(dx, dz)
  if (distance < 0.6) return true
  if (distance > SIGHT_RANGE || (dx * facing.x + dz * facing.z) / distance < SIGHT_COS) return false
  return visibilityThroughSmoke(world.damage, at, point) > 0.4
}

/** Chrollo is lost in the crowd when several bodies stand around him or he wears another face. */
export function chrolloHidden(world: DeathMatchWorld): boolean {
  if (world.chrollo.disguisedAs) return true
  const { at } = world.chrollo
  const around = world.crowd.spectators.filter(
    (spectator) =>
      living(spectator) && Math.hypot(spectator.at.x - at.x, spectator.at.z - at.z) < 1.2,
  )
  return around.length >= 3
}

export function hisokaSeesChrollo(world: DeathMatchWorld): boolean {
  return !chrolloHidden(world) && hisokaSees(world, world.chrollo.at)
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Two puppets on him, or the engine says so: a moment Chrollo may strike. */
export function hisokaBusy(world: DeathMatchWorld): boolean {
  if (world.hisoka.busy) return true
  let around = 0
  for (const spectator of world.crowd.spectators)
    if (spectator.order && living(spectator) && distance(spectator.at, world.hisoka.at) <= 1.5)
      around += 1
  return around >= 2
}
