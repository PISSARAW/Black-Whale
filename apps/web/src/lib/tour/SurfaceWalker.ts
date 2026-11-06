import { floorOf, spaceAt, type TierPlan } from './blueprint'
import {
  HEADROOM,
  distanceToBoundary,
  pointInPolygon,
  structureFootprint,
  structureWalls,
} from './geometry'
import { resolveMovement, wallsNear } from './navigation'
import { banquetRails, type BanquetRail } from './banquetWalkLayout'
import type { Structure, Vec2, WallSegment } from './types'
import { standingSurface } from './standingSurface'

const STEP = 0.26
interface WalkModel {
  rooms: Set<string>
  surfaces: { structure: Structure; polygon: Vec2[]; top: number }[]
  solids: { structure: Structure; walls: WallSegment[]; bottom: number; top: number }[]
  fixed: WallSegment[]
  rails: BanquetRail[]
}
interface MoveRequest {
  from: Vec2
  to: Vec2
  extras: WallSegment[]
  ghost: boolean
}

function deckFloor(plan: TierPlan, at: Vec2): number {
  return floorOf(spaceAt(plan, at) ?? plan.spaces[0], plan.tier)
}

function walkModel(plan: TierPlan): WalkModel {
  const floors = new Map(plan.spaces.map((space) => [space.id, floorOf(space, plan.tier)]))
  const structures = plan.structures
  const ids = new Set(structures.map(({ id }) => id))
  const platforms = structures.filter(({ kind }) => kind === 'platform')
  return {
    rooms: new Set(platforms.map(({ spaceId }) => spaceId)),
    surfaces: platforms.map((structure) => ({
      structure,
      polygon: structureFootprint(structure),
      top: floors.get(structure.spaceId)! + structure.base + structure.height,
    })),
    solids: structures.map((structure) => ({
      structure,
      walls: structureWalls(structure),
      bottom: floors.get(structure.spaceId)! + structure.base,
      top: floors.get(structure.spaceId)! + structure.base + structure.height,
    })),
    fixed: plan.walls.filter(({ structureId }) => !structureId || !ids.has(structureId)),
    rails: banquetRails(structures).map((rail) => ({
      ...rail,
      base: rail.base + floors.get(rail.spaceId)!,
      top: rail.top + floors.get(rail.spaceId)!,
    })),
  }
}

function supportAt(
  model: WalkModel,
  at: Vec2,
  options: {
    height: number
    deck: number | null
  },
): number | null {
  const covering = model.surfaces.filter(
    (surface) =>
      pointInPolygon(at, surface.polygon) || distanceToBoundary(at, surface.polygon) < 0.025,
  )
  const coveredDeck = covering.some(
    ({ structure, top }) =>
      structure.base < HEADROOM && top > (options.deck ?? options.height) + 0.001,
  )
  const heights = options.deck === null || coveredDeck ? [] : [options.deck]
  for (const surface of covering) {
    if (Math.abs(surface.top - options.height) > STEP + 0.001) continue
    heights.push(surface.top)
  }
  return heights.length ? Math.max(...heights) : null
}

function obstaclesAt(model: WalkModel, height: number): WallSegment[] {
  const solids = model.solids
    .filter(({ structure, bottom, top }) => {
      if (structure.kind === 'platform') {
        if (/-stair-|-steps/.test(structure.id)) return false
        return top > height + STEP + 0.001 && bottom < height + HEADROOM
      }
      return bottom < height + HEADROOM && top > height + 0.02
    })
    .flatMap(({ walls }) => walls)
  const rails = model.rails.filter(({ base, top }) => base < height + HEADROOM && top > height)
  return [...model.fixed, ...solids, ...rails]
}

/** The camera eases independently; support remains exact even when sprinting up steps. */
export class SurfaceWalker {
  private at: Vec2 | null = null
  private height = 0
  private readonly models = new WeakMap<TierPlan, WalkModel>()

  reset(plan: TierPlan, at: Vec2, height?: number): number {
    this.at = at
    this.height = height ?? standingSurface(plan, at)
    return this.height
  }

  floor(plan: TierPlan, at: Vec2): number {
    if (!this.at || Math.hypot(this.at[0] - at[0], this.at[1] - at[1]) > 0.001) {
      return this.reset(plan, at)
    }
    const deck = deckFloor(plan, at)
    if (
      this.height > deck + 0.001 &&
      supportAt(this.model(plan), at, { height: this.height, deck: null }) === null
    )
      this.height = deck
    return this.height
  }

  private model(plan: TierPlan): WalkModel {
    if (!this.models.has(plan)) this.models.set(plan, walkModel(plan))
    return this.models.get(plan)!
  }

  move(plan: TierPlan, request: MoveRequest): Vec2 {
    const { from, to, extras, ghost } = request
    this.floor(plan, from)
    if (ghost) {
      this.reset(plan, to)
      return to
    }
    const model = this.model(plan)
    const onSurfaces = [from, to].some((at) => model.rooms.has(spaceAt(plan, at)?.id ?? ''))
    if (!onSurfaces) {
      const at = resolveMovement(from, to, wallsNear([...plan.walls, ...extras], from, 6))
      this.reset(plan, at)
      return at
    }
    return this.walk(plan, model, request)
  }

  private walk(plan: TierPlan, model: WalkModel, request: MoveRequest): Vec2 {
    const { from, to, extras } = request
    const count = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 0.1))
    const step: Vec2 = [(to[0] - from[0]) / count, (to[1] - from[1]) / count]
    let at = from
    for (let index = 0; index < count; index++) {
      const target: Vec2 = [at[0] + step[0], at[1] + step[1]]
      const onDeck = this.height <= deckFloor(plan, at) + STEP
      const support = supportAt(model, target, {
        height: this.height,
        deck: onDeck ? deckFloor(plan, target) : null,
      })
      if (support === null) continue
      const walls = wallsNear([...obstaclesAt(model, support), ...extras], at, 6)
      const resolved = resolveMovement(at, target, walls)
      const floor = supportAt(model, resolved, {
        height: this.height,
        deck: onDeck ? deckFloor(plan, resolved) : null,
      })
      if (floor === null) continue
      at = resolved
      this.height = floor
    }
    this.at = at
    return at
  }
}
