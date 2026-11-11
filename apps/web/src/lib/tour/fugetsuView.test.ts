import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildFugetsuDetails,
  fugetsuSurfacePlan,
  hasFugetsuModel,
  FUGETSU_BEDROOM,
} from './fugetsuView'
import { FUGETSU_PRIVATE_SPACES } from './fugetsuView'
import { MANGA_FUGETSU_VIEWS } from './mangaFugetsuViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { fugetsuApartmentFixtures } from '$lib/components/map/projection/fugetsuApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1011')!
const build = (spaceId: string, changes = {}) =>
  buildFugetsuDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Fugetsu’s apartment against the bedroom panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from seven reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1011'))).toEqual([])
    expect(FUGETSU_PRIVATE_SPACES).toHaveLength(7)
    for (const spaceId of FUGETSU_PRIVATE_SPACES) {
      expect(ship.spaces.get(spaceId)!.provenance).toBe('map')
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const bed = plan.structures.find(
      (item) => item.kind === 'bed' && item.spaceId === FUGETSU_BEDROOM,
    )!
    expect(bed.size[0]).toBeGreaterThan(3)
    expect(bed.rotation).toBe(180)
    const props = plan.structures.filter((item) => item.spaceId === FUGETSU_BEDROOM)
    expect(props).toHaveLength(4)
    expect(props.some((item) => item.id.endsWith('-cabinet-02'))).toBe(false)
    const keepsakes = props.find((item) => item.id.endsWith('-book-stack'))!
    expect(keepsakes.base).toBeGreaterThan(bed.height)
    expect(pointInPolygon(keepsakes.at, structureFootprint(bed))).toBe(true)
    expect(props.find((item) => item.id.endsWith('-clock-and-photos'))!.sourceFr).toContain(
      '01 h 27',
    )
    expect(fugetsuSurfacePlan(plan, false).structures).toEqual([])
    expect(fugetsuSurfacePlan(plan, true)).toBe(plan)
    expect(fugetsuApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasFugetsuModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [FUGETSU_BEDROOM, ...FUGETSU_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(id === FUGETSU_BEDROOM ? 250_000 : 20_000)
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
    expect(MANGA_FUGETSU_VIEWS).toHaveLength(11)
    for (const view of MANGA_FUGETSU_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (FUGETSU_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('uses the bed and clock panels without turning the Nen gate into a permanent exit', () => {
    const main = MANGA_FUGETSU_VIEWS.find((view) => view.id === 'fugetsu-bedroom-curtains')!
    expect(main.chapter).toBe(366)
    expect(main.pages).toContain('3')
    const clock = MANGA_FUGETSU_VIEWS.find((view) => view.id === 'fugetsu-digital-clock')!
    expect(clock.chapter).toBe(374)
    expect(clock.pages).toContain('9')
    for (const view of MANGA_FUGETSU_VIEWS) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-fugetsu', omit: true })
    }
    expect(plan.structures.some((item) => /worm|portal|tunnel/.test(item.id))).toBe(false)
  })
})
