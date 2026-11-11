import { floorOf, type TierPlan } from './blueprint'
import type { Space, Vec2 } from './types'
import { BanquetDetailBuilder } from './banquetDetailBuilder'

interface WallRun {
  start: Vec2
  end: Vec2
}

/** Split the finish at the actual shared-plan openings, including Hatsu door changes. */
export function diningHallWallRuns(plan: TierPlan, space: Space): WallRun[] {
  return space.footprint.flatMap((start, index) => {
    const end = space.footprint[(index + 1) % space.footprint.length]
    return splitWall({ start, end }, { plan, space })
  })
}

function splitWall(wall: WallRun, context: { plan: TierPlan; space: Space }): WallRun[] {
  const { start, end } = wall
  const length = Math.hypot(end[0] - start[0], end[1] - start[1])
  const ux = (end[0] - start[0]) / length,
    uz = (end[1] - start[1]) / length
  const along = (p: Vec2) => (p[0] - start[0]) * ux + (p[1] - start[1]) * uz
  const onWall = (p: Vec2) => Math.abs((p[0] - start[0]) * uz - (p[1] - start[1]) * ux) < 0.01
  const openings = context.plan.doorways
    .filter((door) => door.a === context.space.id || door.b === context.space.id)
    .filter((door) => onWall(door.start) && onWall(door.end))
    .map(
      (door) =>
        [
          Math.max(0, Math.min(along(door.start), along(door.end))),
          Math.min(length, Math.max(along(door.start), along(door.end))),
        ] as const,
    )
    .sort((a, b) => a[0] - b[0])
  const point = (t: number): Vec2 => [start[0] + ux * t, start[1] + uz * t]
  const runs: WallRun[] = []
  let cursor = 0
  for (const [from, to] of openings) {
    if (from > cursor) runs.push({ start: point(cursor), end: point(from) })
    cursor = Math.max(cursor, to)
  }
  if (cursor < length) runs.push({ start: point(cursor), end })
  return runs
}

/** Restrained steel lining: inferred seams, grounded dado and clear doorway thresholds. */
export function dressDiningHallWalls(options: {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}): void {
  const { into, plan, space } = options
  const floor = floorOf(space, plan.tier)
  for (const run of diningHallWallRuns(plan, space)) {
    dressWallRun(into, run, floor)
  }
}

function dressWallRun(into: BanquetDetailBuilder, run: WallRun, floor: number): void {
  const dx = run.end[0] - run.start[0],
    dz = run.end[1] - run.start[1]
  const length = Math.hypot(dx, dz)
  const x = (run.start[0] + run.end[0]) / 2,
    z = (run.start[1] + run.end[1]) / 2
  const rotation = [0, -Math.atan2(dz, dx), 0] as const
  into.box([length, 0.45, 0.08], { at: [x, floor + 0.225, z], rotation, colour: 0x3d3f44 })
  into.box([length, 0.035, 0.085], { at: [x, floor + 0.46, z], rotation, colour: 0x76787d })
  const count = Math.ceil(length / 2.6)
  for (let index = 0; index <= count; index++) {
    const t = index / count
    into.box([0.035, 2.2, 0.05], {
      at: [run.start[0] + dx * t, floor + 1.58, run.start[1] + dz * t],
      rotation,
      colour: 0x777970,
    })
  }
}
