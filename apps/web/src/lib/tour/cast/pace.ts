/**
 * A body that walks a beat: out along a line, a pause, and back again.
 *
 * The catalogue places a body in a room and `stations.ts` picks the spot. A
 * beat does not move that spot — it is where the body starts, where it comes
 * back to, and where everything that reads a post still finds it. What is
 * added is a second point a few metres off and the walk between the two.
 *
 * Staged, not simulated: the far end is fixed when the cast is laid out, from
 * the room's own walls, and the position at any moment is a function of the
 * clock and nothing else. Nobody here looks for a path, which is why nobody
 * here can be found halfway through a table.
 */
import type { Ship, TierPlan } from '../blueprint'
import { closestPointOnSegment, pointInPolygon } from '../geometry'
import type { Space, Vec2 } from '../types'
import { seedOf } from './stations'
import type { Post } from './types'

/** One beat, resolved to the two points it runs between. */
export interface Pace {
  from: Vec2
  to: Vec2
  /** Metres per second. */
  speed: number
  /** How long the body stands at each end, in seconds. */
  rest: number
  /** Where in the cycle this body is when the clock reads zero, in seconds. */
  offset: number
}

/** Where a pacing body is at one moment. */
export interface PaceStep {
  at: Vec2
  /** False while it stands at either end. */
  walking: boolean
}

/** What a character is given: how far it walks, and which way it sets off. */
interface Beat {
  /** The most it walks before turning back, in metres. */
  stride: number
  /** The way it sets off, in radians off the way it faces. Sideways when absent. */
  turn?: number
}

/**
 * Who walks a beat. Everyone else stands their post.
 *
 * Kept to people the canon posts on a watch, and by hand: a beat is the walk's
 * own staging, so it is listed here where it can be read and taken back out,
 * rather than derived from a role and handed to a hundred guards at once.
 */
const BEATS: Readonly<Record<string, Beat>> = {
  // Benjamin's man set to watch the Woble camp from inside room 1014.
  babimyna: { stride: 3.2 },
  // One of the three bodyguards posted outside room 1012.
  bladge: { stride: 2.8 },
  // Supervising the third deck from the police atrium.
  'mizaistom-nana': { stride: 3 },
}

/**
 * The cadence `humanAnimation` swings a leg at covers about this much floor a
 * second; walking any faster or slower would slide the feet.
 */
const WALK_SPEED = 1
const REST = 2.6
/** How close a walking shoulder may come to a wall or to furniture, in metres. */
const CLEARANCE = 0.55
/** Below this there is no room to swing an arm, whatever the post allows. */
const TIGHTEST = 0.35
/** A beat shorter than this is a shuffle; the body stands instead. */
const SHORTEST = 1.6
const SAMPLE = 0.2

interface Room {
  plan: TierPlan
  space: Space
}

/** How far the nearest wall or piece of furniture is from a point, in metres. */
function wallDistance(plan: TierPlan, at: Vec2): number {
  let nearest = Infinity
  for (const wall of plan.walls) {
    const near = closestPointOnSegment(at, wall.start, wall.end)
    nearest = Math.min(nearest, Math.hypot(near[0] - at[0], near[1] - at[1]))
  }
  return nearest
}

/** How far a body can walk from `from` on a bearing before the floor runs out. */
function clearRun(room: Room, from: Vec2, walk: { bearing: number; stride: number }): number {
  // A door post already stands closer to its wall than a stride would be let
  // pass: the walk may keep that near, and no nearer.
  const margin = Math.min(CLEARANCE, wallDistance(room.plan, from) - 0.02)
  if (margin < TIGHTEST) return 0
  const dx = Math.sin(walk.bearing)
  const dz = Math.cos(walk.bearing)
  let run = 0
  while (run + SAMPLE <= walk.stride) {
    const next: Vec2 = [from[0] + dx * (run + SAMPLE), from[1] + dz * (run + SAMPLE)]
    if (!pointInPolygon(next, room.space.footprint)) break
    if (wallDistance(room.plan, next) < margin) break
    run += SAMPLE
  }
  return run
}

/**
 * The beat this post walks, or null when it stands.
 *
 * A body a manga panel has posed stays in the panel, and a body with no
 * bearing has no sideways to set off in. Tried one way and then the other, so
 * a guard against the left-hand wall walks right.
 */
export function paceFor(plan: TierPlan, space: Space, post: Post): Pace | null {
  const beat = BEATS[post.member.characterId]
  if (!beat || post.pose !== undefined || post.heading === undefined) return null
  const turn = beat.turn ?? Math.PI / 2
  for (const side of [turn, turn + Math.PI]) {
    const bearing = post.heading + side
    const run = clearRun({ plan, space }, post.at, { bearing, stride: beat.stride })
    if (run < SHORTEST) continue
    const span = run / WALK_SPEED
    return {
      from: post.at,
      to: [post.at[0] + Math.sin(bearing) * run, post.at[1] + Math.cos(bearing) * run],
      speed: WALK_SPEED,
      rest: REST,
      offset: seedOf(post.member.characterId) % Math.ceil(2 * (span + REST)),
    }
  }
  return null
}

const between = (a: Vec2, b: Vec2, t: number): Vec2 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]

/** Where the body is on its beat when the walk's clock reads `seconds`. */
export function pacedAt(pace: Pace, seconds: number): PaceStep {
  const span = Math.hypot(pace.to[0] - pace.from[0], pace.to[1] - pace.from[1]) / pace.speed
  const cycle = 2 * (span + pace.rest)
  if (!(span > 0)) return { at: pace.from, walking: false }
  let t = (((seconds + pace.offset) % cycle) + cycle) % cycle
  if (t < pace.rest) return { at: pace.from, walking: false }
  t -= pace.rest
  if (t < span) return { at: between(pace.from, pace.to, t / span), walking: true }
  t -= span
  if (t < pace.rest) return { at: pace.to, walking: false }
  return { at: between(pace.to, pace.from, (t - pace.rest) / span), walking: true }
}

/** Beats already worked out, by post: a post is rebuilt only when the cast is. */
const LAID = new WeakMap<Post, Pace | null>()

/** The beat a post walks on the ship it stands on, worked out once per post. */
export function paceOf(ship: Ship, post: Post): Pace | null {
  if (LAID.has(post)) return LAID.get(post)!
  const plan = ship.plans.get(post.tierId)
  const space = ship.spaces.get(post.spaceId)
  const pace = plan && space ? paceFor(plan, space, post) : null
  LAID.set(post, pace)
  return pace
}

/**
 * The posts, each pacing body moved to where its beat has taken it.
 *
 * For whatever has to find a body rather than a post — the reticle, above
 * all. A body that stands is handed back as it came, so only the walkers are
 * new objects.
 */
export function pacedPosts(ship: Ship, posts: readonly Post[], seconds: number): Post[] {
  return posts.map((post) => {
    const pace = paceOf(ship, post)
    return pace ? { ...post, at: pacedAt(pace, seconds).at } : post
  })
}
