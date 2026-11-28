import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf } from './blueprint'
import { buildCasinoDetails, casinoSurfacePlan } from './casinoView'
import {
  CASINO_LOWER_HALL,
  CASINO_SPACE,
  CASINO_STAIR_LANDING,
  CASINO_STAIR_ROOM,
  hasCasinoModel,
} from './casinoLayout'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import { CasinoFixture } from './casinoFixture'
import {
  dressCasinoIsland,
  dressCasinoMachine,
  dressSwampBall,
  dressCasinoSeat,
} from './casinoMachines'
import { pointInPolygon, structureFootprint } from './geometry'
import { SurfaceWalker } from './SurfaceWalker'
import { CasinoSpiralWalk, type SpiralLanding } from './casinoSpiralWalk'
import { buildCasinoSpiralView } from './casinoSpiralView'
import { computeDoorPlacement } from './doorDetailSurface'
import { linkUnderfoot } from './navigation'
import { mangaViewById } from './mangaViews'
import { casinoFixtures, casinoLowerFixtures } from '$lib/components/map/projection/casinoPlan'
import type { Vec2 } from './types'

const ship = theShip(),
  plan = ship.plans.get('tier-1-c')!,
  space = ship.spaces.get(CASINO_SPACE)!
const details = () => buildCasinoDetails({ THREE, plan, spaceId: CASINO_SPACE, reveal: false })!

describe('the chapter 420 casino reconstruction', () => {
  it('aligns the grand staircase doorway with the walkable surface on both sides', () => {
    const lowerPlan = ship.plans.get('tier-1')!
    const doorway = lowerPlan.doorways.find(
      ({ a, b }) => a === CASINO_STAIR_LANDING && b === CASINO_LOWER_HALL,
    )!
    const placement = computeDoorPlacement(lowerPlan, doorway)
    const walker = new SurfaceWalker()
    const [x, z] = placement.center
    const approach: Vec2 = [x, z - 0.73]
    const landing: Vec2 = [x, z - 0.23]
    const firstTread: Vec2 = [x, z + 0.25]

    expect(placement.floor).toBeCloseTo(walker.reset(lowerPlan, approach))
    expect(placement.height).toBeCloseTo(2.6)
    const atDoor = walker.move(lowerPlan, { from: approach, to: landing, extras: [], ghost: false })
    expect(atDoor[0]).toBeCloseTo(landing[0])
    expect(atDoor[1]).toBeCloseTo(landing[1])
    const across = walker.move(lowerPlan, {
      from: atDoor,
      to: firstTread,
      extras: [],
      ghost: false,
    })
    expect(across[0]).toBeCloseTo(firstTread[0])
    expect(across[1]).toBeCloseTo(firstTread[1])
    expect(walker.floor(lowerPlan, across)).toBeCloseTo(placement.floor)
    const back = walker.move(lowerPlan, { from: across, to: landing, extras: [], ghost: false })
    expect(back[0]).toBeCloseTo(landing[0])
    expect(back[1]).toBeCloseTo(landing[1])
    expect(walker.floor(lowerPlan, back)).toBeCloseTo(placement.floor)
  })

  it('keeps a bounded two-batch room below the banquet detail budget', () => {
    const root = details()
    expect(root.children).toHaveLength(2)
    let triangles = 0
    for (const child of root.children as THREE.Mesh[]) {
      const positions = child.geometry.getAttribute('position')
      expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
      triangles += positions.count / 3
    }
    expect(triangles).toBeLessThan(150_000)
    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(space, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.001)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + ceilingOf(space, plan.tier) + 0.001)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-57.75)
    expect(bounds.max.x).toBeLessThanOrEqual(-40.25)
    expect(bounds.min.z).toBeGreaterThanOrEqual(3.5)
    expect(bounds.max.z).toBeLessThanOrEqual(56)
    disposeBanquetDetails(root)
  })

  it('fits every complete furniture model inside its collision envelope, including rotated chairs', () => {
    for (const structure of plan.structures.filter(
      (s) => s.spaceId === CASINO_SPACE && hasCasinoModel(s),
    )) {
      const into = new BanquetDetailBuilder(THREE)
      const model = new CasinoFixture(THREE, into, { structure, floor: 0 })
      if (structure.id.endsWith('-swamp-ball')) dressSwampBall(THREE, model)
      else if (structure.id.includes('-machine-island-')) dressCasinoIsland(THREE, model)
      else if (structure.kind === 'seat') dressCasinoSeat(model)
      else if (structure.kind === 'cabinet') dressCasinoMachine(THREE, model)
      else continue
      const root = into.finish()
      const footprint = structureFootprint(structure)
      for (const mesh of root.children as THREE.Mesh[]) {
        const p = mesh.geometry.getAttribute('position')
        for (let i = 0; i < p.count; i++) {
          expect(pointInPolygon([p.getX(i), p.getZ(i)], footprint), structure.id).toBe(true)
          expect(p.getY(i), structure.id).toBeGreaterThanOrEqual(structure.base - 0.001)
          expect(p.getY(i), structure.id).toBeLessThanOrEqual(
            structure.base + structure.height + 0.001,
          )
        }
      }
      disposeBanquetDetails(root)
    }
  })

  it('replaces coarse furniture only in normal rendering and releases every buffer', () => {
    const surface = casinoSurfacePlan(plan, false)
    expect(surface.structures.some(hasCasinoModel)).toBe(false)
    expect(surface.walls.length).toBeLessThan(plan.walls.length)
    expect(plan.columns.get(CASINO_SPACE)).toHaveLength(10)
    expect(surface.columns.has(CASINO_SPACE)).toBe(false)
    expect(casinoSurfacePlan({ ...plan, structures: [] }, false).columns.has(CASINO_SPACE)).toBe(
      false,
    )
    expect(casinoSurfacePlan(plan, true).structures).toBe(plan.structures)
    expect(buildCasinoDetails({ THREE, plan, spaceId: CASINO_SPACE, reveal: true })).toBeNull()
    expect(
      buildCasinoDetails({ THREE, plan, spaceId: 'tier-1-banquet-hall', reveal: false }),
    ).toBeNull()
    const root = details()
    const disposed = (root.children as THREE.Mesh[]).flatMap((mesh) => [
      vi.spyOn(mesh.geometry, 'dispose'),
      vi.spyOn(mesh.material as THREE.Material, 'dispose'),
    ])
    disposeBanquetDetails(root)
    for (const spy of disposed) expect(spy).toHaveBeenCalledOnce()
  })

  it('removes the model when Nen lifts a machine out of the walked plan', () => {
    const full = details()
    const gone = buildCasinoDetails({
      THREE,
      plan: { ...plan, structures: plan.structures.filter((s) => !s.id.endsWith('-swamp-ball')) },
      spaceId: CASINO_SPACE,
      reveal: false,
    })!
    const vertices = (root: THREE.Group) =>
      (root.children[0] as THREE.Mesh).geometry.getAttribute('position').count
    expect(vertices(full) - vertices(gone)).toBeGreaterThan(1000)
    disposeBanquetDetails(full)
    disposeBanquetDetails(gone)
  })

  it('shares every furniture footprint with the map and clears the views and escape route', () => {
    expect(casinoFixtures.map(({ id }) => id)).toEqual(
      plan.structures
        .filter((s) => [CASINO_SPACE, CASINO_STAIR_ROOM].includes(s.spaceId))
        .map(({ id }) => id),
    )
    expect(
      plan.structures
        .filter((s) => s.id.includes('-gaming-table-'))
        .every((s) => s.kind === 'cabinet' && s.height > 2),
    ).toBe(true)
    for (const id of ['casino-420-gaming-floor', 'casino-420-swamp-ball']) {
      const view = mangaViewById(id)!
      expect(view.chapter).toBe(420)
      expect(view.volume).toBeUndefined()
      expect(
        plan.columns
          .get(CASINO_SPACE)!
          .every(([x, z]) => Math.hypot(x - view.at[0], z - view.at[1]) > 1),
      ).toBe(true)
    }
  })

  it('walks each terrace, rounds SWAMP BALL and crosses the emergency stair to the lower hall', () => {
    const walker = new SurfaceWalker()
    const ground = floorOf(space, plan.tier)
    const footpath = [
      { at: [-49, 12.3], rise: 0.4 },
      { at: [-49, 18.8], rise: 0.8 },
      { at: [-49, 24.8], rise: 1.2 },
      { at: [-49, 29.9], rise: 1.6 },
      { at: [-46.3, 29.9], rise: 1.6 },
      { at: [-46.3, 37.1], rise: 1.6 },
      { at: [-48.5, 42.3], rise: 1.6 },
      { at: [-48.5, 49.2], rise: 0 },
      { at: [-49.94, 49.2], rise: 0 },
      { at: [-49.94, 54.25], rise: 0 },
    ] as const
    let from: Vec2 = [-49, 8]
    for (const { at, rise } of footpath) {
      const result = walker.move(plan, { from, to: at, extras: [], ghost: false })
      expect(result[0], at.join(',')).toBeCloseTo(at[0])
      expect(result[1], at.join(',')).toBeCloseTo(at[1])
      expect(walker.floor(plan, result)).toBeCloseTo(ground + rise)
      from = result
    }

    const spiral = new CasinoSpiralWalk(ship)
    const { upper, lower } = spiral.path!
    expect(linkUnderfoot(ship.links, upper.spaceId, upper.at)).toBeNull()
    expect(spiral.enter(upper.spaceId, [-49, 53], [-48.83, 53])).toBe(false)
    const arrival = walkSpiral(spiral, upper, lower)
    spiral.reset()
    walkSpiral(spiral, lower, upper)
    const spiralView = buildCasinoSpiralView(THREE, spiral.path)!
    const shaft = new THREE.Box3().setFromObject(spiralView.root)
    expect(shaft.min.y).toBeLessThan(lower.floor)
    expect(shaft.max.y).toBeGreaterThan(upper.floor)
    spiralView.dispose()

    const lowerPlan = ship.plans.get('tier-1')!
    expect(walker.reset(lowerPlan, arrival)).toBeCloseTo(lowerPlan.tier.elevation + 1.44)
    const facingHall = walker.move(lowerPlan, {
      from: arrival,
      to: [-51, 52.05],
      extras: [],
      ghost: false,
    })
    const lowerHall = walker.move(lowerPlan, {
      from: facingHall,
      to: [-51, 60],
      extras: [],
      ghost: false,
    })
    const aligned = walker.move(lowerPlan, {
      from: lowerHall,
      to: [-49, 60],
      extras: [],
      ghost: false,
    })
    const exit: Vec2 = [-49, 64.5]
    const result = walker.move(lowerPlan, { from: aligned, to: exit, extras: [], ghost: false })
    expect(result[0]).toBeCloseTo(exit[0])
    expect(result[1]).toBeCloseTo(exit[1])
    expect(walker.floor(lowerPlan, result)).toBeCloseTo(lowerPlan.tier.elevation)
    expect(casinoLowerFixtures.filter(({ spaceId }) => spaceId === CASINO_LOWER_HALL)).toHaveLength(
      12,
    )
    const hallDetails = buildCasinoDetails({
      THREE,
      plan: lowerPlan,
      spaceId: CASINO_LOWER_HALL,
      reveal: false,
    })!
    expect(new THREE.Box3().setFromObject(hallDetails).isEmpty()).toBe(false)
    disposeBanquetDetails(hallDetails)
  })

  it('stages the chapter 420 encounter and flags the patrol bodies that cannot be identified', () => {
    const entrance = mangaViewById('casino-420-gaming-floor')!
    const encounter = mangaViewById('casino-420-swamp-ball')!

    expect(entrance.eventTitle).toBe(
      'Tserriednich discovers the casino patrols killed without gunfire',
    )
    expect(entrance.label).toContain('unidentified patrol bodies are not reconstructed')
    expect(entrance.staging?.map(({ characterId }) => characterId)).toEqual(['prince-tserriednich'])
    expect(encounter.eventTitle).toBe('Tserriednich encounters Hisoka in the VIP casino')
    expect(encounter.staging).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ characterId: 'hisoka', pose: 'seated' }),
        expect.objectContaining({ characterId: 'prince-tserriednich' }),
      ]),
    )

    for (const actor of [...entrance.staging!, ...encounter.staging!]) {
      const actorSpace = ship.spaces.get(actor.spaceId ?? CASINO_SPACE)!
      expect(pointInPolygon(actor.at, actorSpace.footprint), actor.characterId).toBe(true)
      expect(
        plan.structures
          .filter(
            ({ spaceId, kind }) =>
              spaceId === actorSpace.id &&
              kind !== 'platform' &&
              !(kind === 'seat' && actor.pose === 'seated'),
          )
          .some((solid) => pointInPolygon(actor.at, structureFootprint(solid))),
        actor.characterId,
      ).toBe(false)
    }
  })
})

function walkSpiral(
  spiral: CasinoSpiralWalk,
  origin: SpiralLanding,
  destination: SpiralLanding,
): Vec2 {
  let at: Vec2 = [origin.at[0] - 0.52, origin.at[1]]
  let yaw = -Math.PI / 2
  let floor = origin.floor
  let changes = 0
  expect(spiral.enter(origin.spaceId, at, [at[0] + 0.12, at[1]])).toBe(true)
  for (let i = 0; i < 400; i++) {
    const step = spiral.advance([-Math.sin(yaw) * 0.12, -Math.cos(yaw) * 0.12])!
    expect(Math.hypot(at[0] - step.at[0], at[1] - step.at[1])).toBeLessThan(0.16)
    const nextFloor = spiral.floor!
    expect(Math.abs(floor - nextFloor)).toBeLessThan(0.2)
    if (nextFloor !== floor) changes++
    floor = nextFloor
    at = step.at
    yaw += step.turn
    if (!step.landing) continue
    expect(step.landing).toBe(destination)
    expect(floor).toBeCloseTo(destination.floor)
    expect(changes).toBeGreaterThanOrEqual(60)
    return at
  }
  throw new Error('The spiral did not reach its landing')
}
