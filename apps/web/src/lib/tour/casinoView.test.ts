import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf } from './blueprint'
import { buildCasinoDetails, casinoSurfacePlan } from './casinoView'
import { CASINO_SPACE, hasCasinoModel } from './casinoLayout'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import { CasinoFixture } from './casinoFixture'
import { dressCasinoMachine, dressSwampBall, dressCasinoSeat } from './casinoMachines'
import { pointInPolygon, structureFootprint } from './geometry'
import { resolveMovement } from './navigation'
import { mangaViewById } from './mangaViews'
import { casinoFixtures } from '$lib/components/map/projection/casinoPlan'

const ship = theShip(),
  plan = ship.plans.get('tier-1-c')!,
  space = ship.spaces.get(CASINO_SPACE)!
const details = () => buildCasinoDetails({ THREE, plan, spaceId: CASINO_SPACE, reveal: false })!

describe('the chapter 420 casino reconstruction', () => {
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
    for (const structure of plan.structures.filter(hasCasinoModel)) {
      const into = new BanquetDetailBuilder(THREE)
      const model = new CasinoFixture(THREE, into, { structure, floor: 0 })
      if (structure.id.endsWith('-swamp-ball')) dressSwampBall(THREE, model)
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
    expect(casinoSurfacePlan(plan, true)).toBe(plan)
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
      plan.structures.filter((s) => s.spaceId === CASINO_SPACE).map(({ id }) => id),
    )
    expect(
      plan.structures
        .filter((s) => s.id.includes('-gaming-table-'))
        .every((s) => s.kind === 'cabinet' && s.height > 2),
    ).toBe(true)
    const segments = [
      [
        [-49, 4],
        [-49, 26],
      ],
      [
        [-46.3, 27],
        [-46.3, 38],
      ],
      [
        [-49, 38],
        [-49, 54.25],
      ],
    ] as const
    for (const [from, to] of segments) {
      const result = resolveMovement(from, to, plan.walls)
      expect(result[0]).toBeCloseTo(to[0])
      expect(result[1]).toBeCloseTo(to[1])
    }
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
})
