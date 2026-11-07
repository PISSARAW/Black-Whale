import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildHospitalDetails,
  HOSPITAL_CLINIC,
  HOSPITAL_HALL,
  HOSPITAL_RESEARCH,
  HOSPITAL_SPACES,
  HOSPITAL_STAFF,
  HOSPITAL_SUPPLIES,
  hospitalSurfacePlan,
} from './hospitalView'
import { MANGA_HOSPITAL_VIEWS } from './mangaHospitalViews'
import { pointInPolygon } from './geometry'

const ship = theShip()
const plan = ship.plans.get('interior-central-hospital')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Central Hospital and Medical Ward reconstructed from chapters 358 and 391', () => {
  it('satisfies blueprint invariants for all rooms of the hospital', () => {
    const issues = validateBlueprint().filter((issue) =>
      Array.from(HOSPITAL_SPACES).some((id) => issue.includes(id)),
    )
    expect(issues).toEqual([])
  })

  it('builds finite, budgeted 3D manga details for each room of the hospital', () => {
    for (const spaceId of HOSPITAL_SPACES) {
      const root = buildHospitalDetails({
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

  it('omits the reconstructed details in evidence mode and in non-hospital rooms', () => {
    expect(
      buildHospitalDetails({
        THREE,
        plan,
        spaceId: HOSPITAL_CLINIC,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildHospitalDetails({
        THREE,
        plan,
        spaceId: 'tier-1-king-living-quarters-living',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('filters coarse blueprint structures via hospitalSurfacePlan in walking mode', () => {
    const normalPlan = hospitalSurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => HOSPITAL_SPACES.has(s.spaceId))).toBe(false)

    const revealPlan = hospitalSurfacePlan(plan, true)
    expect(revealPlan.structures.some((s) => HOSPITAL_SPACES.has(s.spaceId))).toBe(true)
  })

  it('leaves unaffected any plans outside the Central Hospital', () => {
    const kingPlan = ship.plans.get('interior-king-quarters')!
    const filtered = hospitalSurfacePlan(kingPlan, false)
    expect(filtered.structures.length).toBe(kingPlan.structures.length)
  })

  it('positions all canonical manga camera views inside the appropriate hospital rooms', () => {
    for (const view of MANGA_HOSPITAL_VIEWS) {
      const space = ship.spaces.get(view.spaceId)!
      expect(space).toBeDefined()
      expect(pointInPolygon(view.at, space.footprint)).toBe(true)
    }
  })

  it('includes camera viewpoints for clinic, supplies, staff consultation, and research lab', () => {
    const ids = MANGA_HOSPITAL_VIEWS.map((v) => v.id)
    expect(ids).toContain('hospital-central-clinic')
    expect(ids).toContain('hospital-supplies-reserve')
    expect(ids).toContain('hospital-consultation-office')
    expect(ids).toContain('hospital-research-lab')
  })

  it('releases all Three.js geometries and materials on disposal', () => {
    const root = buildHospitalDetails({
      THREE,
      plan,
      spaceId: HOSPITAL_CLINIC,
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
