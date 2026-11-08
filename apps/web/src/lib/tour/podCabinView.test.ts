import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildPodCabinDetails,
  POD_CABIN_SPACE,
  POD_CABIN_SPACES,
  podCabinSurfacePlan,
} from './podCabinView'
import { MANGA_VIEWS } from './mangaViews'
import { pointInPolygon, structureFootprint } from './geometry'

const ship = theShip()
const plan = ship.plans.get('interior-lifeboat')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Tier 1 escape pod cabin reconstructed from chapter 383', () => {
  it('satisfies blueprint invariants for the pod cabin space', () => {
    expect(POD_CABIN_SPACES).toContain(POD_CABIN_SPACE)
    const issues = validateBlueprint().filter((issue) => issue.includes(POD_CABIN_SPACE))
    expect(issues).toEqual([])
  })

  it('builds finite, budgeted 3D details for the pod cabin', () => {
    const root = buildPodCabinDetails({
      THREE,
      plan,
      spaceId: POD_CABIN_SPACE,
      reveal: false,
    })
    expect(root).not.toBeNull()
    expect(root!.children.length).toBe(2)
    expect(triangles(root!)).toBeLessThan(60_000)

    for (const mesh of root!.children as THREE.Mesh[]) {
      const positions = Array.from(mesh.geometry.getAttribute('position').array)
      expect(positions.every(Number.isFinite)).toBe(true)
    }

    const space = plan.spaces.find((s) => s.id === POD_CABIN_SPACE)!
    const bounds = new THREE.Box3().setFromObject(root!)
    const floor = floorOf(space, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + space.ceiling! + 0.1)

    disposeBanquetDetails(root!)
  })

  it('builds luminous emissive meshes for telemetry screens, buttons and lamps', () => {
    const root = buildPodCabinDetails({
      THREE,
      plan,
      spaceId: POD_CABIN_SPACE,
      reveal: false,
    })!
    const glowMesh = root.children[1] as THREE.Mesh
    expect(glowMesh).toBeDefined()
    expect(glowMesh.material).toBeDefined()
    const glowTriangles = glowMesh.geometry.getAttribute('position').count / 3
    expect(glowTriangles).toBeGreaterThan(50)
    disposeBanquetDetails(root)
  })

  it('omits the reconstructed details in evidence mode and in non-pod spaces', () => {
    expect(
      buildPodCabinDetails({
        THREE,
        plan,
        spaceId: POD_CABIN_SPACE,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildPodCabinDetails({
        THREE,
        plan,
        spaceId: 'tier-1-king-living-quarters-living',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('filters coarse blueprint structures via podCabinSurfacePlan in walking mode', () => {
    const normalPlan = podCabinSurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => POD_CABIN_SPACES.has(s.spaceId))).toBe(false)

    const revealPlan = podCabinSurfacePlan(plan, true)
    expect(revealPlan.structures.some((s) => POD_CABIN_SPACES.has(s.spaceId))).toBe(true)
  })

  it('leaves unaffected any plans outside the pod cabin', () => {
    const kingPlan = ship.plans.get('interior-king-quarters')!
    const filtered = podCabinSurfacePlan(kingPlan, false)
    expect(filtered.structures.length).toBe(kingPlan.structures.length)
  })

  it('positions the canonical chapter 383 manga camera view clear of solids', () => {
    const view = MANGA_VIEWS.find((v) => v.id === 'lifeboat-round-hatch')!
    expect(view).toBeDefined()
    expect(view.chapter).toBe(383)
    const space = ship.spaces.get(view.spaceId)!
    expect(pointInPolygon(view.at, space.footprint)).toBe(true)

    const solids = plan.structures.filter((s) => s.spaceId === view.spaceId && s.base === 0)
    for (const solid of solids) {
      expect(pointInPolygon(view.at, structureFootprint(solid))).toBe(false)
    }
  })

  it('releases all Three.js geometries and materials on disposal', () => {
    const root = buildPodCabinDetails({
      THREE,
      plan,
      spaceId: POD_CABIN_SPACE,
      reveal: false,
    })!
    const parent = new THREE.Group()
    parent.add(root)

    const meshes = root.children as THREE.Mesh[]
    const disposables = meshes.flatMap((mesh) => [mesh.geometry, mesh.material as THREE.Material])
    const spies = disposables.map((res) => vi.spyOn(res, 'dispose'))

    disposeBanquetDetails(root)
    expect(root.parent).toBeNull()
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledOnce()
    }
  })
})
