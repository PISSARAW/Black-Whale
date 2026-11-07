import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildHeillyHideoutDetails,
  HEILLY_PROCESSING,
  HEILLY_SPACES,
  heillySurfacePlan,
} from './heillyHideoutView'
import { MANGA_HEILLY_VIEWS } from './mangaHeillyViews'
import { pointInPolygon } from './geometry'

const ship = theShip()
const plan = ship.plans.get('interior-heilly-hideout')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Heil-Ly secret hideout reconstructed from chapters 398, 399 and 407', () => {
  it('satisfies blueprint invariants for all rooms of the hideout', () => {
    const issues = validateBlueprint().filter((issue) =>
      Array.from(HEILLY_SPACES).some((id) => issue.includes(id)),
    )
    expect(issues).toEqual([])
  })

  it('builds finite, budgeted 3D manga details for each room of the hideout', () => {
    for (const spaceId of HEILLY_SPACES) {
      const root = buildHeillyHideoutDetails({
        THREE,
        plan,
        spaceId,
        reveal: false,
      })
      expect(root).not.toBeNull()
      expect(root!.children.length).toBeGreaterThan(0)
      expect(root!.children.length).toBeLessThanOrEqual(2)
      expect(triangles(root!)).toBeLessThan(150_000)

      for (const mesh of root!.children as THREE.Mesh[]) {
        const positions = Array.from(mesh.geometry.getAttribute('position').array)
        expect(positions.every(Number.isFinite)).toBe(true)
      }

      const space = plan.spaces.find((s) => s.id === spaceId)!
      const bounds = new THREE.Box3().setFromObject(root!)
      const floor = floorOf(space, plan.tier)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
      expect(bounds.max.y).toBeLessThanOrEqual(floor + space.ceiling! + 0.1)

      disposeBanquetDetails(root!)
    }
  })

  it('omits the reconstructed details in evidence mode and in non-hideout rooms', () => {
    expect(
      buildHeillyHideoutDetails({
        THREE,
        plan,
        spaceId: HEILLY_PROCESSING,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildHeillyHideoutDetails({
        THREE,
        plan,
        spaceId: 'tier-1-king-living-quarters-living',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('filters coarse blueprint structures via heillySurfacePlan in walking mode', () => {
    const normalPlan = heillySurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => HEILLY_SPACES.has(s.spaceId))).toBe(false)

    const revealPlan = heillySurfacePlan(plan, true)
    expect(revealPlan.structures.some((s) => HEILLY_SPACES.has(s.spaceId))).toBe(true)
  })

  it('leaves unaffected any plans outside the Heil-Ly hideout', () => {
    const kingPlan = ship.plans.get('interior-king-quarters')!
    const filtered = heillySurfacePlan(kingPlan, false)
    expect(filtered.structures.length).toBe(kingPlan.structures.length)
  })

  it('positions all canonical manga camera views inside the appropriate rooms', () => {
    for (const view of MANGA_HEILLY_VIEWS) {
      const space = ship.spaces.get(view.spaceId)!
      expect(space).toBeDefined()
      expect(pointInPolygon(view.at, space.footprint)).toBe(true)
    }
  })

  it('stages Morena and Borksen at the negotiation table in the office view', () => {
    const view = MANGA_HEILLY_VIEWS.find((v) => v.id === 'morena-office-negotiation-game')!
    expect(view).toBeDefined()
    expect(view.chapter).toBe(407)
    expect(view.staging?.map((s) => s.characterId)).toEqual(['morena-prudo', 'borksen'])
  })

  it('includes camera viewpoints for processing, laundry, and communal rooms', () => {
    const ids = MANGA_HEILLY_VIEWS.map((v) => v.id)
    expect(ids).toContain('heilly-processing-room')
    expect(ids).toContain('heilly-laundry-disposal')
    expect(ids).toContain('heilly-communal-table')
  })

  it('releases all Three.js geometries and materials on disposal', () => {
    const root = buildHeillyHideoutDetails({
      THREE,
      plan,
      spaceId: HEILLY_PROCESSING,
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
