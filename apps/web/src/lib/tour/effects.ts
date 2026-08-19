import type { Ship } from "./blueprint"
import { TourWorld, TourCastResult, standingIn, solidNow, TourReport, POLARITY_CONTACT } from "./hatsu"
import { markedAt, POLARITY_PACE } from "./targeting"
import type { Vec2 } from "./types"

export const MELT_STAGES = [1, 0.62, 0.3, 0.12]
export function gasStep(world: TourWorld, ship: Ship): TourCastResult | null {
  if (!world.toad) return null
  const solids = { ...world.solids }
  let melting = 0
  let gone = 0
  for (const solid of standingIn(ship, world, world.toad)) {
    const hold = solids[solid.id]
    if (hold?.melting === undefined) continue
    const stage = hold.melting + 1
    if (stage >= MELT_STAGES.length) {
      solids[solid.id] = { ...hold, melting: stage, gone: true }
      gone++
      continue
    }
    solids[solid.id] = { ...hold, melting: stage, squash: MELT_STAGES[stage] }
    melting++
  }
  if (!melting && !gone) return null
  return {
    world: { ...world, solids },
    report: { kind: 'melted', spaceId: world.toad, melting, gone },
  }
}
export const SMOKE_FULL = 6
export const FLOCK_ROOMS = 10
export const FLOCK_PER_ROOM = 4
export const FLOCK_BIRDS = 12
export function smokeStep(world: TourWorld): TourCastResult | null {
  const smoke = world.smoke
  if (!smoke || smoke.filled >= SMOKE_FULL) return null
  const filled = smoke.filled + 1
  return {
    world: { ...world, smoke: { ...smoke, filled } },
    report: {
      kind: 'smoke-spread',
      spaceId: smoke.spaceId,
      filled,
      full: filled >= SMOKE_FULL,
    },
  }
}
export const REEL_METRES = 1.5
export const REEL_REACH = 1.5
export function reelStep(world: TourWorld, ship: Ship, at: Vec2): TourCastResult | null {
  if (!world.centipede) return null
  const solids = { ...world.solids }
  let pulled = 0
  let eaten = 0
  for (const solid of standingIn(ship, world, world.centipede)) {
    const hold = solids[solid.id]
    if (hold?.glued === undefined) continue
    const now = solidNow(solid, hold)
    const dx = at[0] - now.at[0]
    const dz = at[1] - now.at[1]
    const gap = Math.hypot(dx, dz)
    if (gap <= REEL_REACH) {
      solids[solid.id] = { ...hold, glued: hold.glued + 1, gone: true }
      eaten++
      continue
    }
    const step = Math.min(REEL_METRES, gap - REEL_REACH)
    solids[solid.id] = {
      ...hold,
      glued: hold.glued + 1,
      at: [now.at[0] + (dx / gap) * step, now.at[1] + (dz / gap) * step],
    }
    pulled++
  }
  if (!pulled && !eaten) return null
  return {
    world: { ...world, solids },
    report: { kind: 'reeled', spaceId: world.centipede, pulled, eaten },
  }
}
export function catStep(world: TourWorld, ship: Ship): TourCastResult | null {
  if (!world.cat) return null
  const standing = standingIn(ship, world, world.cat)
  const next = standing[0]
  if (!next) return null
  return {
    world: {
      ...world,
      solids: { ...world.solids, [next.id]: { ...world.solids[next.id], gone: true } },
    },
    report: {
      kind: 'crushed-one',
      spaceId: world.cat,
      solidId: next.id,
      left: standing.length - 1,
    },
  }
}
export function polarityStep(
  world: TourWorld,
  ship: Ship,
  step: { seconds: number; delta: number },
): { world: TourWorld; report: TourReport | null } | null {
  const { seconds, delta } = step
  const suns: string[] = []
  const moons: string[] = []
  for (const [id, hold] of Object.entries(world.solids)) {
    if (hold.gone) continue
    if (hold.mark === 'sun') suns.push(id)
    if (hold.mark === 'moon') moons.push(id)
  }
  if (!suns.length || !moons.length) return null

  const solids = { ...world.solids }
  /** Everything already blown this tick: a thing goes off once and is not there after. */
  const spent = new Set<string>()
  let report: TourReport | null = null

  for (const sunId of suns) {
    if (spent.has(sunId)) continue
    const sun = markedAt(ship, world, { id: sunId, hold: world.solids[sunId], seconds })
    if (!sun) continue
    const room = ship.spaces.get(sun.spaceId)
    if (!room) continue

    // The nearest opposite in the same room. Nothing reaches through a bulkhead
    // or through a deck: `at` is measured on the level it stands on, so two
    // things four decks apart share coordinates and share nothing else.
    let nearest: { id: string; base: Vec2; at: Vec2; away: number; apart: number } | null = null
    for (const moonId of moons) {
      if (spent.has(moonId)) continue
      const moon = markedAt(ship, world, { id: moonId, hold: world.solids[moonId], seconds })
      if (!moon || moon.spaceId !== sun.spaceId) continue
      const away = Math.hypot(sun.at[0] - moon.at[0], sun.at[1] - moon.at[1])
      const apart = Math.hypot(sun.base[0] - moon.base[0], sun.base[1] - moon.base[1])
      if (!nearest || away < nearest.away) nearest = { id: moonId, ...moon, away, apart }
    }
    if (!nearest) continue

    // Touching: both go, and the marks go with them. The first pair to meet is
    // the one the walk speaks of — a second explosion in the same tenth of a
    // second would talk over it.
    //
    // Two measurements rather than one, and either will do it. Where the things
    // are drawn is the one a visitor can see, and it is what a near miss is
    // decided on; but a living thing's drift is a ring it never leaves, and two
    // rings of the same size can turn about the same point forever without the
    // gap between them ever closing. So the things themselves arriving at the
    // same place counts as having met, whatever the drift is doing over it.
    if (nearest.away < POLARITY_CONTACT || nearest.apart < POLARITY_CONTACT) {
      solids[sunId] = { ...solids[sunId], gone: true, alive: false, mark: undefined }
      solids[nearest.id] = { ...solids[nearest.id], gone: true, alive: false, mark: undefined }
      spent.add(sunId)
      spent.add(nearest.id)
      report ??= { kind: 'detonated', solidId: sunId, otherId: nearest.id }
      continue
    }

    // Not touching yet: each takes a step towards the other, and neither leaves
    // the room it was marked in.
    const dx = nearest.base[0] - sun.base[0]
    const dz = nearest.base[1] - sun.base[1]
    const span = Math.hypot(dx, dz) || 1
    const stride = Math.min(POLARITY_PACE * delta, span / 2)
    const walk = (from: Vec2, towards: 1 | -1): Vec2 => {
      const to: Vec2 = [
        from[0] + (dx / span) * stride * towards,
        from[1] + (dz / span) * stride * towards,
      ]
      return pointInPolygon(to, room.footprint) ? to : from
    }
    solids[sunId] = { ...solids[sunId], at: walk(sun.base, 1) }
    solids[nearest.id] = { ...solids[nearest.id], at: walk(nearest.base, -1) }
  }

  return { world: { ...world, solids }, report }
}
