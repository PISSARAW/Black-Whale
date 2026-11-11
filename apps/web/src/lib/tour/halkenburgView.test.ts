import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildHalkenburgDetails,
  halkenburgSurfacePlan,
  hasHalkenburgModel,
  HALKENBURG_BEDROOM,
  HALKENBURG_LIVING,
} from './halkenburgView'
import { HALKENBURG_PRIVATE_SPACES } from './halkenburgView'
import { MANGA_HALKENBURG_VIEWS } from './mangaHalkenburgViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { halkenburgApartmentFixtures } from '$lib/components/map/projection/halkenburgApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1009')!
const build = (spaceId: string, changes = {}) =>
  buildHalkenburgDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Halkenburg’s apartment against the reception and bedroom panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from six reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1009'))).toEqual([])
    expect(HALKENBURG_PRIVATE_SPACES).toHaveLength(6)
    for (const spaceId of HALKENBURG_PRIVATE_SPACES) {
      expect(ship.spaces.get(spaceId)!.provenance).toBe('plan')
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const bed = plan.structures.find(
      (item) => item.kind === 'bed' && item.spaceId === HALKENBURG_BEDROOM,
    )!
    expect(bed.rotation).toBe(180)
    expect(bed.provenance).toBe('panel')
    expect(bed.sourceFr).toContain('page de lecture 5')
    const salon = plan.structures.filter((item) => item.spaceId === HALKENBURG_LIVING)
    expect(salon).toHaveLength(5)
    expect(salon.filter((item) => item.kind === 'seat')).toHaveLength(2)
    expect(salon.some((item) => item.kind === 'table' || item.id.endsWith('-seat-04'))).toBe(false)
    expect(
      salon
        .filter((item) => item.kind === 'cabinet')
        .every((item) => item.at[0] + item.size[0] / 2 < 7.5),
    ).toBe(true)
    expect(halkenburgSurfacePlan(plan, false).structures).toEqual([])
    expect(halkenburgSurfacePlan(plan, true)).toBe(plan)
    expect(halkenburgApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasHalkenburgModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [HALKENBURG_LIVING, HALKENBURG_BEDROOM, ...HALKENBURG_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(
        [HALKENBURG_BEDROOM, HALKENBURG_LIVING].includes(id) ? 250_000 : 20_000,
      )
      for (const mesh of full.children as THREE.Mesh[])
        expect(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite)).toBe(
          true,
        )
      const bounds = new THREE.Box3().setFromObject(full)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.01)
      expect(bounds.max.y).toBeLessThanOrEqual(
        floorOf(room, plan.tier) + ceilingOf(room, plan.tier) + 0.01,
      )
      full.traverse((object) => expect(object instanceof THREE.Light).toBe(false))
      if (plan.structures.some((item) => item.spaceId === id))
        expect(vertices(full)).toBeGreaterThan(vertices(empty))
      expect(build(id, { reveal: true })).toBeNull()
      disposeBanquetDetails(full)
      disposeBanquetDetails(empty)
    }
  })

  it('keeps all eleven inspection cameras on clear floor and marks the six reconstructions', () => {
    expect(MANGA_HALKENBURG_VIEWS).toHaveLength(11)
    for (const view of MANGA_HALKENBURG_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (HALKENBURG_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('uses the actual room panels and keeps every inspection unpopulated', () => {
    const main = MANGA_HALKENBURG_VIEWS.find((view) => view.id === 'halkenburg-living-cleared')!
    expect(main.chapter).toBe(382)
    expect(main.pages).toContain('11')
    const chairs = MANGA_HALKENBURG_VIEWS.find((view) => view.id === 'halkenburg-folding-chairs')!
    expect(chairs.chapter).toBe(386)
    expect(chairs.pages).toContain('13')
    for (const view of MANGA_HALKENBURG_VIEWS) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-halkenburg', omit: true })
    }
  })
})
