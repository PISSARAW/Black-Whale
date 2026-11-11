import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildZhangLeiDetails, zhangLeiSurfacePlan, hasZhangLeiModel } from './zhangLeiView'
import { ZHANG_LEI_PRIVATE_SPACES } from './zhangLeiApartmentView'
import { MANGA_ZHANG_LEI_APARTMENT_VIEWS } from './mangaZhangLeiApartmentViews'
import { zhangLeiStaging } from './mangaZhangLeiViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { zhangLeiApartmentFixtures } from '$lib/components/map/projection/zhangLeiApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1003')!
const build = (spaceId: string, changes = {}) =>
  buildZhangLeiDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Zhang Lei’s complete apartment', () => {
  it('keeps every room’s furniture on a valid shared plan, with honest reconstruction provenance', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1003'))).toEqual([])
    expect(ZHANG_LEI_PRIVATE_SPACES).toHaveLength(7)
    for (const spaceId of ZHANG_LEI_PRIVATE_SPACES) {
      for (const object of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(object.provenance).toBe('map')
        expect(object.sourceFr).toContain('Reconstitution')
      }
    }
    expect(zhangLeiSurfacePlan(plan, false).structures).toEqual([])
    expect(zhangLeiSurfacePlan(plan, true)).toBe(plan)
    expect(zhangLeiApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasZhangLeiModel).map((item) => item.id),
    )
  })

  it('renders finite bounded details without extra lights and removes ornaments with their solids', () => {
    for (const id of ZHANG_LEI_PRIVATE_SPACES) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(20_000)
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

  it('places reconstruction cameras on clear floor and leaves these views unpopulated', () => {
    expect(MANGA_ZHANG_LEI_APARTMENT_VIEWS).toHaveLength(7)
    for (const view of MANGA_ZHANG_LEI_APARTMENT_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint)).toBe(true)
      expect(view.staging).toEqual([])
      expect(view.labelFr).toContain('reconstitution')
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
    }
  })

  it('seats Oito and Zhang Lei facing their table, with Woble held above her lap', () => {
    for (const id of ['prince-zhanglei', 'queen-oito']) {
      const person = zhangLeiStaging.find((entry) => entry.characterId === id)!
      const dx = 6 - person.at[0],
        dz = -2.7 - person.at[1],
        heading = person.heading!
      expect(
        (dx * Math.sin(heading) + dz * Math.cos(heading)) / Math.hypot(dx, dz),
      ).toBeGreaterThan(0.99)
    }
    const baby = zhangLeiStaging.find((entry) => entry.characterId === 'prince-woble')!
    expect(baby.pose).toBe('held')
    expect(baby.floorOffset).toBeGreaterThan(0.5)
    const candles = plan.structures.filter((item) => item.id.includes('candelabrum'))
    expect(candles).toHaveLength(2)
    for (const candle of candles) expect(candle.base).toBe(0.78)
  })
})
