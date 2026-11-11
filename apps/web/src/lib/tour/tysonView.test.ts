import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildTysonDetails, tysonSurfacePlan, hasTysonModel, TYSON_LIVING } from './tysonView'
import { TYSON_PRIVATE_SPACES } from './tysonView'
import { MANGA_TYSON_VIEWS } from './mangaTysonViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { tysonApartmentFixtures } from '$lib/components/map/projection/tysonApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1006')!
const build = (spaceId: string, changes = {}) =>
  buildTysonDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Tyson’s apartment against the salon panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from seven reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1006'))).toEqual([])
    expect(TYSON_PRIVATE_SPACES).toHaveLength(7)
    for (const spaceId of TYSON_PRIVATE_SPACES) {
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const unsupported = ['-birthday-table', '-gift-display-1', '-gift-display-2']
    for (const suffix of unsupported)
      expect(plan.structures.some((item) => item.id.endsWith(suffix))).toBe(false)
    const table = plan.structures.find((item) => item.id.endsWith('-living-table-05'))!
    expect(table.height).toBeLessThan(0.6)
    expect(table.source).toContain('375')
    expect(tysonSurfacePlan(plan, false).structures).toEqual([])
    expect(tysonSurfacePlan(plan, true)).toBe(plan)
    expect(tysonApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasTysonModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [TYSON_LIVING, ...TYSON_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(id === TYSON_LIVING ? 250_000 : 20_000)
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

  it('keeps all eleven inspection cameras on clear floor and marks the seven reconstructions', () => {
    expect(MANGA_TYSON_VIEWS).toHaveLength(11)
    for (const view of MANGA_TYSON_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (TYSON_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('keeps the floor rug walkable and separates decor inspections from a staged birthday', () => {
    expect(plan.structures.some((item) => item.kind === 'platform')).toBe(false)
    for (const view of MANGA_TYSON_VIEWS.filter((view) => view.spaceId === TYSON_LIVING)) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-tyson', omit: true })
    }
    const view = MANGA_TYSON_VIEWS.find((view) => view.id === 'tyson-salon-panelling')!
    expect(view.chapter).toBe(389)
    expect(view.labelFr).toContain('Giuliano')
    expect(view.labelFr).toContain('permanent')
  })
})
