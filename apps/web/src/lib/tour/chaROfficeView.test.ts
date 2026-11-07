import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildChaROfficeDetails,
  CHA_R_BEDROOM,
  CHA_R_HALL,
  CHA_R_MAIN_OFFICE,
  CHA_R_MONITOR_ROOM,
  CHA_R_SPACES,
  chaRSurfacePlan,
} from './chaROfficeView'
import { MANGA_CHA_R_VIEWS } from './mangaChaRViews'
import { pointInPolygon } from './geometry'

const ship = theShip()
const plan = ship.plans.get('interior-cha-r-office')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Cha-R family office reconstructed from chapters 379 and 380', () => {
  it('satisfies blueprint invariants for all rooms of the office', () => {
    expect(CHA_R_SPACES).toContain(CHA_R_MAIN_OFFICE)
    expect(CHA_R_SPACES).toContain(CHA_R_BEDROOM)
    expect(CHA_R_SPACES).toContain(CHA_R_MONITOR_ROOM)
    expect(CHA_R_SPACES).toContain(CHA_R_HALL)
    const issues = validateBlueprint().filter((issue) =>
      Array.from(CHA_R_SPACES).some((id) => issue.includes(id)),
    )
    expect(issues).toEqual([])
  })

  it('builds finite, budgeted 3D manga details for each room of the Cha-R office', () => {
    for (const spaceId of CHA_R_SPACES) {
      const root = buildChaROfficeDetails({
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

  it('omits the reconstructed details in evidence mode and in non-office rooms', () => {
    expect(
      buildChaROfficeDetails({
        THREE,
        plan,
        spaceId: CHA_R_MAIN_OFFICE,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildChaROfficeDetails({
        THREE,
        plan,
        spaceId: 'tier-1-king-living-quarters-living',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('filters coarse blueprint structures via chaRSurfacePlan in walking mode', () => {
    const normalPlan = chaRSurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => CHA_R_SPACES.has(s.spaceId))).toBe(false)

    const revealPlan = chaRSurfacePlan(plan, true)
    expect(revealPlan.structures.some((s) => CHA_R_SPACES.has(s.spaceId))).toBe(true)
  })

  it('leaves unaffected any plans outside the Cha-R office', () => {
    const kingPlan = ship.plans.get('interior-king-quarters')!
    const filtered = chaRSurfacePlan(kingPlan, false)
    expect(filtered.structures.length).toBe(kingPlan.structures.length)
  })

  it('positions all canonical manga camera views inside the appropriate rooms', () => {
    for (const view of MANGA_CHA_R_VIEWS) {
      const space = ship.spaces.get(view.spaceId)!
      expect(space).toBeDefined()
      expect(pointInPolygon(view.at, space.footprint)).toBe(true)
    }
  })

  it('stages Feitan in the bunk room view for the chapter 379 interrogation', () => {
    const view = MANGA_CHA_R_VIEWS.find((v) => v.id === 'cha-r-bunks-bookshelves')!
    expect(view).toBeDefined()
    expect(view.chapter).toBe(379)
    expect(view.staging?.map((s) => s.characterId)).toEqual(['feitan-portor'])
  })

  it('publishes viewpoints for the three doors, the bunks, and the CCTV monitor room', () => {
    const ids = MANGA_CHA_R_VIEWS.map((v) => v.id)
    expect(ids).toContain('cha-r-emblem-three-doors')
    expect(ids).toContain('cha-r-bunks-bookshelves')
    expect(ids).toContain('cha-r-cctv-monitor-room')
  })

  it('releases all Three.js geometries and materials on disposal', () => {
    const root = buildChaROfficeDetails({
      THREE,
      plan,
      spaceId: CHA_R_MAIN_OFFICE,
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
