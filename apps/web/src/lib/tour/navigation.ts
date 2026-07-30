/**
 * Moving the visitor through the reconstruction.
 *
 * The walls the visitor collides with are the walls `geometry.ts` produced for
 * the renderer, doorways already cut out of them. There is no second, simpler
 * collision model to drift out of step with what is on screen: if you can see
 * through an opening, you can walk through it.
 */
import { EPSILON, closestPointOnSegment } from './geometry'
import type { Link, Tier, Vec2, WallSegment } from './types'

/** Shoulder width of the visitor, in metres. */
export const VISITOR_RADIUS = 0.4

/** How close to a stairwell you have to stand for it to offer the other deck. */
export const LINK_REACH = 6

/**
 * How fast the visitor walks and runs, in metres per second.
 *
 * These are the same argument as the scale in `data/ship/README.md`. The plans
 * are read at 0,35 m per unit rather than at 1 m because a banquet hall 450 m
 * long is a volume nobody can cross — the case for the scale is that these are
 * rooms a person walks. A visitor moving at 6 m/s is covering ground four times
 * faster than a person does, and a sprint at 16 m/s is 58 km/h: at those speeds
 * the hall shrinks back to the size the scale was chosen to deny, and every
 * measurement the reconstruction publishes stops meaning anything on screen.
 *
 * So: 2,1 m/s, a brisk walk, and 6 m/s for the run, which is a hard run and
 * still the pace the whole ship can be crossed at in a couple of minutes.
 */
export const WALK_SPEED = 2.1
export const SPRINT_SPEED = 6

/**
 * Length of one pace, in metres.
 *
 * At `WALK_SPEED` this is a cadence of about 2,7 steps a second, which is what
 * a person walking briskly does. It is also what the head's rise and fall and
 * the footsteps are both counted in, so the two cannot drift apart: they are
 * the same number read twice.
 */
export const STRIDE = 0.78

/** How far the eye rises and falls over one pace, in metres. */
export const BOB_RISE = 0.022

/** How far the head leans at the far end of a pace, in radians. */
export const BOB_ROLL = 0.006

/**
 * Where the head is within the pace, given the distance walked.
 *
 * Keyed to distance and not to time, which is the whole point: a camera that
 * bobs on a clock keeps bobbing when the visitor walks into a wall, and slides
 * out of step with the ground the moment anything changes the pace — the aura
 * that quickens it, a stick pushed half way. Read off the metres covered, the
 * dip lands where the foot lands, at every speed, and stops when the walking
 * stops because the distance stops growing.
 *
 * The rise is lowest on the whole paces, so `stepsIn` counting a step and the
 * camera reaching the bottom of its dip are the same instant. The lean has
 * twice the period, because a person leans on alternate feet.
 */
export function bobOf(walked: number, amplitude = 1): { rise: number; roll: number } {
  const pace = walked / STRIDE
  return {
    rise: -BOB_RISE * amplitude * Math.cos(2 * Math.PI * pace),
    roll: BOB_ROLL * amplitude * Math.sin(Math.PI * pace),
  }
}

/** How many paces the given distance is, for the footstep the last one made. */
export function stepsIn(walked: number): number {
  return Math.floor(walked / STRIDE)
}

const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]]
const len = (a: Vec2) => Math.hypot(a[0], a[1])

/**
 * Slides the visitor from `from` towards `to` without letting them through a
 * wall.
 *
 * The move is cut into steps no longer than the visitor's radius, so a sprint
 * down a corridor cannot skip over a bulkhead between two frames, and each step
 * is pushed back out of any wall it ends up inside. Pushing out repeatedly is
 * what makes corners work: the first push frees one wall, the second the other.
 */
export function resolveMovement(
  from: Vec2,
  to: Vec2,
  walls: WallSegment[],
  radius = VISITOR_RADIUS,
): Vec2 {
  const delta = sub(to, from)
  const distance = len(delta)
  if (distance < EPSILON) return from

  const steps = Math.max(1, Math.ceil(distance / radius))
  let position = from

  for (let step = 0; step < steps; step++) {
    const target: Vec2 = [position[0] + delta[0] / steps, position[1] + delta[1] / steps]
    position = pushOutOfWalls(target, position, walls, radius)
  }

  return position
}

/**
 * @param point    where the visitor wants to stand
 * @param fallback the last position known to be clear, used to choose a side
 *                 when the visitor ends up exactly on a wall
 */
function pushOutOfWalls(point: Vec2, fallback: Vec2, walls: WallSegment[], radius: number): Vec2 {
  let position = point

  for (let pass = 0; pass < 4; pass++) {
    let corrected = false

    for (const wall of walls) {
      const closest = closestPointOnSegment(position, wall.start, wall.end)
      const away = sub(position, closest)
      const distance = len(away)
      if (distance >= radius) continue

      let normal: Vec2
      if (distance > EPSILON) {
        normal = [away[0] / distance, away[1] / distance]
      } else {
        // Dead on the wall: leave on the side the visitor came from.
        const back = sub(fallback, closest)
        const backLength = len(back)
        if (backLength <= EPSILON) continue
        normal = [back[0] / backLength, back[1] / backLength]
      }

      position = [closest[0] + normal[0] * radius, closest[1] + normal[1] * radius]
      corrected = true
    }

    if (!corrected) break
  }

  return position
}

/** Only the walls that can matter for a move, so the loop stays short. */
export function wallsNear(walls: WallSegment[], point: Vec2, reach: number): WallSegment[] {
  return walls.filter((wall) => {
    const minX = Math.min(wall.start[0], wall.end[0]) - reach
    const maxX = Math.max(wall.start[0], wall.end[0]) + reach
    const minZ = Math.min(wall.start[1], wall.end[1]) - reach
    const maxZ = Math.max(wall.start[1], wall.end[1]) + reach
    return point[0] >= minX && point[0] <= maxX && point[1] >= minZ && point[1] <= maxZ
  })
}

/** How far the on-screen stick's knob travels from the middle of its base, in px. */
export const STICK_RADIUS = 46

/** Past this much of a push, the stick is running rather than walking. */
export const STICK_RIM = 0.94

/**
 * A finger on the on-screen stick, as a vector inside the unit circle: `x` to
 * the right, `z` forward, which is the screen's `y` the other way up.
 *
 * Past the rim the push saturates, so the stick reads as a direction and a pace
 * rather than as however far the finger happens to have slid across the glass.
 */
export function stickVector(dx: number, dy: number, radius = STICK_RADIUS): Vec2 {
  const distance = Math.hypot(dx, dy)
  const clamp = distance > radius ? radius / distance : 1
  return [(dx * clamp) / radius, (-dy * clamp) / radius]
}

/** What is being held down, on a keyboard or on the glass or on both at once. */
export interface WalkKeys {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  sprint: boolean
}

/**
 * One walking intent out of the keyboard and the stick together — a tablet with
 * a keyboard attached should not have to choose between them.
 *
 * Only an over-long vector is brought back to the unit circle: the keys are on
 * or off, so their diagonals still come out normalised, while a half push of the
 * stick stays a half pace.
 */
export function walkInput(
  keys: WalkKeys,
  stick: Vec2 | null,
): { strafe: number; advance: number; moving: boolean; running: boolean } {
  const push = stick ? Math.hypot(stick[0], stick[1]) : 0
  const strafe = Number(keys.right) - Number(keys.left) + (stick?.[0] ?? 0)
  const advance = Number(keys.forward) - Number(keys.back) + (stick?.[1] ?? 0)
  const magnitude = Math.hypot(strafe, advance)
  const scale = Math.max(magnitude, 1)
  return {
    strafe: strafe / scale,
    advance: advance / scale,
    moving: magnitude > EPSILON,
    running: keys.sprint || push > STICK_RIM,
  }
}

/**
 * The vertical link the visitor is standing on, if any, together with the space
 * it leads to from where they are.
 */
export function linkUnderfoot(
  links: Link[],
  spaceId: string | null,
  point: Vec2,
): { link: Link; to: string } | null {
  if (!spaceId) return null

  for (const link of links) {
    if (link.from !== spaceId && link.to !== spaceId) continue
    // Measure against the end the visitor is actually standing on: the two
    // ends of a door into an interior are in different coordinate spaces.
    // A door into a room's interior is offered from anywhere in that room:
    // the whole space is the threshold, and hunting for a spot on the floor of
    // a sixty-metre block would be a puzzle, not a tour. A stairwell still has
    // to be stood on.
    if (link.kind !== 'door') {
      const here = link.from === spaceId ? link.at : (link.atTo ?? link.at)
      if (len(sub(point, here)) > LINK_REACH) continue
    }
    return { link, to: link.from === spaceId ? link.to : link.from }
  }
  return null
}

/**
 * The way out of an interior, offered from anywhere inside it.
 *
 * An interior is a level of its own, reached by one door from the room it is the
 * inside of. `linkUnderfoot` finds that door from the space it lands in — the
 * entrance hall — and from nowhere else, which is fine for an apartment you
 * walked into and hopeless everywhere else: a prince's suite is seven rooms and
 * the cineplex is fourteen, nothing marks which of them the way out is in, and a
 * visitor who jumped straight to the master bedroom never saw the vestibule at
 * all. So the whole interior is the threshold, the same concession the door into
 * one already makes at the deck end.
 *
 * The destination is the room on the deck, not the vestibule: stepping out of an
 * apartment puts you in the corridor, whichever of its rooms you were standing
 * in.
 */
export function wayOutOfInterior(
  links: Link[],
  tier: Pick<Tier, 'kind' | 'parentSpaceId'>,
): { link: Link; to: string } | null {
  const parentSpaceId = tier.parentSpaceId
  if (tier.kind !== 'interior' || !parentSpaceId) return null
  const link = links.find(
    (candidate) =>
      candidate.kind === 'door' &&
      (candidate.from === parentSpaceId || candidate.to === parentSpaceId),
  )
  return link ? { link, to: parentSpaceId } : null
}
