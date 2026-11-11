import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildKachoDetails,
  kachoSurfacePlan,
  hasKachoModel,
  KACHO_KITCHEN,
  KACHO_LIVING,
  KACHO_DINING,
} from './kachoView'
import { KACHO_PRIVATE_SPACES } from './kachoView'
import { MANGA_KACHO_VIEWS } from './mangaKachoViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { kachoApartmentFixtures } from '$lib/components/map/projection/kachoApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1010')!
const build = (spaceId: string, changes = {}) =>
  buildKachoDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Kacho’s apartment against the study, dining and kitchen panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from five reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1010'))).toEqual([])
    expect(KACHO_PRIVATE_SPACES).toHaveLength(5)
    for (const spaceId of KACHO_PRIVATE_SPACES) {
      expect(ship.spaces.get(spaceId)!.provenance).toBe('plan')
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const kitchen = plan.structures.filter((item) => item.spaceId === KACHO_KITCHEN)
    expect(kitchen).toHaveLength(4)
    const wallUnits = kitchen.find((item) => item.id.endsWith('-cabinet-15'))!
    expect(wallUnits.base).toBeGreaterThan(1.5)
    const cooker = kitchen.find((item) => item.id.endsWith('-counter-16'))!
    expect(cooker.at[0]).toBeLessThan(
      kitchen.find((item) => item.id.endsWith('-counter-08'))!.at[0] - 1.5,
    )
    expect(cooker.rotation).toBe(-90)
    expect(kitchen.some((item) => item.id.endsWith('-counter-09'))).toBe(false)
    const salon = plan.structures.filter((item) => item.spaceId === KACHO_LIVING)
    expect(salon.some((item) => item.id.endsWith('-study-desk'))).toBe(true)
    expect(salon.some((item) => item.id.endsWith('-study-chair'))).toBe(true)
    expect(salon.some((item) => /-(dresser|round-stool|seat-04|table-05)$/.test(item.id))).toBe(
      false,
    )
    const dining = plan.structures.filter((item) => item.spaceId === KACHO_DINING)
    expect(dining.filter((item) => item.kind === 'seat')).toHaveLength(2)
    expect(kachoSurfacePlan(plan, false).structures).toEqual([])
    expect(kachoSurfacePlan(plan, true)).toBe(plan)
    expect(kachoApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasKachoModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [KACHO_LIVING, KACHO_KITCHEN, KACHO_DINING, ...KACHO_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(
        [KACHO_KITCHEN, KACHO_LIVING, KACHO_DINING].includes(id) ? 250_000 : 20_000,
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

  it('keeps all eleven inspection cameras on clear floor and marks the five reconstructions', () => {
    expect(MANGA_KACHO_VIEWS).toHaveLength(11)
    for (const view of MANGA_KACHO_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (KACHO_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('retains the two existing inspection links and uses the actual study and kitchen panels', () => {
    const main = MANGA_KACHO_VIEWS.find((view) => view.id === 'kacho-living-homework')!
    expect(main.chapter).toBe(376)
    expect(main.pages).toContain('10')
    const kitchen = MANGA_KACHO_VIEWS.find((view) => view.id === 'kacho-kitchen-cabinet')!
    expect(kitchen.chapter).toBe(376)
    expect(kitchen.pages).toContain('11')
    const dining = MANGA_KACHO_VIEWS.find((view) => view.id === 'kacho-dining-table')!
    expect(dining.chapter).toBe(366)
    expect(dining.pages).toContain('4')
    for (const view of MANGA_KACHO_VIEWS) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-kacho', omit: true })
    }
  })
})
