import type { Scene, Ray } from "three"
import type { TierPlan, Ship } from "./blueprint"
import { Aim, detachedOn, TourWorld, emptiedOn, heldSolidIds, type Perch, type Mark, solidById, solidNow, wanderOffset } from "./hatsu"
import type { Space, Vec2, Structure } from "./types"

export function aimedSpace(plan: TierPlan, aim: Aim): Space | null {
  const { at, heading, range = 90 } = aim
  // The camera looks along (-sin yaw, -cos yaw), as the walk's own movement
  // code has it.
  const dx = -Math.sin(heading)
  const dz = -Math.cos(heading)
  const here = plan.spaces.find((space) => pointInPolygon(at, space.footprint)) ?? null

  const STEP = 0.5
  for (let travelled = STEP; travelled <= range; travelled += STEP) {
    const point: Vec2 = [at[0] + dx * travelled, at[1] + dz * travelled]
    const space = plan.spaces.find((candidate) => pointInPolygon(point, candidate.footprint))
    if (space && space.id !== here?.id) return space
  }
  return here
}
export function aimedSolid(scene: Scene, plan: TierPlan, aim: Aim): Structure | null {
  const { ship, world } = scene
  const { at, heading, range = 40 } = aim
  const dx = -Math.sin(heading)
  const dz = -Math.cos(heading)

  // What Nen is holding moves every frame, so its outline is never cached.
  // There are a handful of those at most, against the hundred and twenty-odd
  // the deck itself stands.
  const targets = bakedTargets(ship, world, plan).concat(
    detachedOn(ship, world, { tierId: plan.tier.id }).map((held) => targetOf(held.structure)),
  )

  let nearest: Structure | null = null
  let distance = Infinity
  for (const target of targets) {
    // Each hit tightens the ray for the ones after it: past the nearest solid
    // found so far, nothing can win.
    const hit = rayReaches(target, { at, dx, dz }, Math.min(range, distance))
    if (hit === null || hit >= distance) continue
    distance = hit
    nearest = target.structure
  }
  return nearest
}
export function targetOf(structure: Structure): SolidTarget {
  const outline = structureFootprint(structure)
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const [x, z] of outline) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  return { structure, outline, minX, minZ, maxX, maxZ }
}
export const bakedTargets = (() => {
  const cache = new WeakMap<TierPlan, { key: string; targets: SolidTarget[] }>()

  return (ship: Ship, world: TourWorld, plan: TierPlan): SolidTarget[] => {
    const emptied = emptiedOn(world, plan.tier.id, ship).slice().sort()
    const held = heldSolidIds(world).slice().sort()
    const key = `${emptied.join(',')}::${held.join(',')}`

    const kept = cache.get(plan)
    if (kept?.key === key) return kept.targets

    const gone = new Set(emptied)
    const lifted = new Set(held)
    const targets = plan.structures
      .filter((structure) => !gone.has(structure.spaceId) && !lifted.has(structure.id))
      .map(targetOf)
    cache.set(plan, { key, targets })
    return targets
  }
})()
function intersectSlab(ctx: {
  origin: number
  direction: number
  low: number
  high: number
  bounds: { near: number; far: number }
}): boolean {
  if (Math.abs(ctx.direction) < 1e-9) return ctx.origin >= ctx.low && ctx.origin <= ctx.high
  const first = (ctx.low - ctx.origin) / ctx.direction
  const second = (ctx.high - ctx.origin) / ctx.direction
  ctx.bounds.near = Math.max(ctx.bounds.near, Math.min(first, second))
  ctx.bounds.far = Math.min(ctx.bounds.far, Math.max(first, second))
  return ctx.bounds.near <= ctx.bounds.far
}

function checkSegment(
  segment: { a: Vec2; b: Vec2 },
  ray: { at: Vec2; dx: number; dz: number; range: number },
  nearest: number | null,
): number | null {
  const { a, b } = segment
  const { at, dx, dz, range } = ray
  const ex = b[0] - a[0]
  const ez = b[1] - a[1]
  const denominator = dx * ez - dz * ex
  if (Math.abs(denominator) < 1e-9) return nearest

  const px = a[0] - at[0]
  const pz = a[1] - at[1]
  const along = (px * ez - pz * ex) / denominator
  if (along < 0 || along > range || (nearest !== null && along >= nearest)) return nearest
  const across = (px * dz - pz * dx) / denominator
  if (across < 0 || across > 1) return nearest
  return along
}

export function rayReaches(target: SolidTarget, ray: Ray, range: number): number | null {
  const { at, dx, dz } = ray
  const bounds = { near: 0, far: range }

  if (!intersectSlab({ origin: at[0], direction: dx, low: target.minX, high: target.maxX, bounds })) return null
  if (!intersectSlab({ origin: at[1], direction: dz, low: target.minZ, high: target.maxZ, bounds })) return null

  // Standing inside it — under a mezzanine, under a run of ducting — is aiming
  // at it, which is what marching from the first step out already did.
  if (pointInPolygon(at, target.outline)) return 0

  let nearest: number | null = null
  const outline = target.outline
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]
    const b = outline[(i + 1) % outline.length]
    nearest = checkSegment({ a, b }, { at, dx, dz, range }, nearest)
  }
  return nearest
}
export function perchFor(world: TourWorld, ship: Ship, choice: Perch): string {
  const { targetId, standingIn, random } = choice
  if (world.owlMode === 'shoulder') return standingIn ?? targetId
  if (world.owlMode === 'random') {
    const rooms = [...ship.spaces.keys()]
    if (!rooms.length) return targetId
    return rooms[Math.min(rooms.length - 1, Math.floor(random() * rooms.length))]
  }
  return targetId
}
export const POLARITY_PACE = 0.9
export function markedAt(
  ship: Ship,
  world: TourWorld,
  mark: Mark,
): { spaceId: string; base: Vec2; at: Vec2 } | null {
  const { id, hold, seconds } = mark
  const original = solidById(ship, world, id)
  if (!original) return null
  const base = solidNow(original, hold).at
  const drift = hold.alive ? wanderOffset(id, seconds) : ([0, 0] as Vec2)
  return { spaceId: original.spaceId, base, at: [base[0] + drift[0], base[1] + drift[1]] }
}
