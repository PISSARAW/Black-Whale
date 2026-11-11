import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildWobleDetails,
  wobleSurfacePlan,
  hasWobleModel,
  WOBLE_PANEL_SPACES,
  WOBLE_DINING,
  WOBLE_BEDROOM,
  WOBLE_BATHROOM,
} from './wobleView'
import { WOBLE_PRIVATE_SPACES } from './wobleView'
import { MANGA_WOBLE_VIEWS } from './mangaWobleViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { wobleApartmentFixtures } from '$lib/components/map/projection/wobleApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1014')!
const build = (spaceId: string, changes = {}) =>
  buildWobleDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Woble’s apartment against the reception and bedroom panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from three reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1014'))).toEqual([])
    expect(WOBLE_PRIVATE_SPACES).toHaveLength(3)
    for (const spaceId of WOBLE_PRIVATE_SPACES) {
      expect(ship.spaces.get(spaceId)!.provenance).toBe('map')
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const tables = plan.structures.filter(
      (item) => item.spaceId === WOBLE_DINING && item.kind === 'table',
    )
    expect(tables).toHaveLength(1)
    expect(tables[0].size[1]).toBeGreaterThanOrEqual(2)
    expect(
      plan.structures.filter((item) => item.spaceId === WOBLE_DINING && item.kind === 'seat'),
    ).toHaveLength(6)
    expect(plan.structures.some((item) => item.id.endsWith('-kitchen-counter-09'))).toBe(false)
    expect(
      plan.structures.find((item) => item.id.endsWith('-kitchen-cabinet-24'))!.base,
    ).toBeGreaterThan(1)
    const bed = plan.structures.find(
      (item) => item.spaceId === WOBLE_BEDROOM && item.kind === 'bed',
    )!
    expect(bed.size[0]).toBeGreaterThan(3)
    expect(
      plan.structures.find(
        (item) => item.spaceId === WOBLE_BATHROOM && item.id.endsWith('-wc-pan'),
      )!.provenance,
    ).toBe('panel')
    expect(plan.structures.some((item) => /crib|cradle/.test(item.id))).toBe(false)
    expect(wobleSurfacePlan(plan, false).structures).toEqual([])
    expect(wobleSurfacePlan(plan, true)).toBe(plan)
    expect(wobleApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasWobleModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [...WOBLE_PANEL_SPACES, ...WOBLE_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(WOBLE_PANEL_SPACES.includes(id) ? 250_000 : 20_000)
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

  it('keeps all thirteen inspection cameras on clear floor and marks the three reconstructions', () => {
    expect(MANGA_WOBLE_VIEWS).toHaveLength(13)
    for (const view of MANGA_WOBLE_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (WOBLE_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('preserves all three legacy inspection links and keeps the main classroom free of generic furniture', () => {
    for (const id of ['woble-living-phone-wall', 'woble-kitchen-counter', 'woble-dining-guards'])
      expect(MANGA_WOBLE_VIEWS.some((view) => view.id === id)).toBe(true)
    for (const id of ['living-seat-04', 'living-table-05', 'living-cabinet-06'])
      expect(plan.structures.some((item) => item.id.endsWith(id))).toBe(false)
    for (const view of MANGA_WOBLE_VIEWS) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-woble', omit: true })
    }
  })
})
