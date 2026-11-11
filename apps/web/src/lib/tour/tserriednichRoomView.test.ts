import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildTserriednichRoomDetails,
  tserriednichSurfacePlan,
  hasTserriednichModel,
  TSERRIEDNICH_LIVING,
} from './tserriednichRoomView'
import { TSERRIEDNICH_PRIVATE_SPACES } from './tserriednichApartmentView'
import { MANGA_TSERRIEDNICH_VIEWS, tserriednichTrainingStaging } from './mangaTserriednichViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { tserriednichApartmentFixtures } from '$lib/components/map/projection/tserriednichApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1004')!
const build = (spaceId: string, changes = {}) =>
  buildTserriednichRoomDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Tserriednich’s apartment against the training panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from seven reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1004'))).toEqual([])
    expect(TSERRIEDNICH_PRIVATE_SPACES).toHaveLength(7)
    for (const spaceId of TSERRIEDNICH_PRIVATE_SPACES) {
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const clock = plan.structures.find((item) => item.id.endsWith('-mantel-clock'))!
    const cabinet = plan.structures.find((item) => item.id.endsWith('-clock-cabinet'))!
    expect(clock.base).toBe(cabinet.height)
    expect(tserriednichSurfacePlan(plan, false).structures).toEqual([])
    expect(tserriednichSurfacePlan(plan, true)).toBe(plan)
    expect(tserriednichApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasTserriednichModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [TSERRIEDNICH_LIVING, ...TSERRIEDNICH_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(id === TSERRIEDNICH_LIVING ? 150_000 : 20_000)
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
    expect(MANGA_TSERRIEDNICH_VIEWS).toHaveLength(11)
    for (const view of MANGA_TSERRIEDNICH_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (TSERRIEDNICH_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('faces teacher and pupil towards each other and keeps the Zetsu reference free of the guardian', () => {
    for (const [index, person] of tserriednichTrainingStaging.entries()) {
      const target = tserriednichTrainingStaging[1 - index].at,
        h = person.heading!,
        dx = target[0] - person.at[0],
        dz = target[1] - person.at[1]
      expect((dx * Math.sin(h) + dz * Math.cos(h)) / Math.hypot(dx, dz)).toBeGreaterThan(0.99)
    }
    const zetsu = MANGA_TSERRIEDNICH_VIEWS.find(
      (view) => view.id === 'tserriednich-zetsu-training',
    )!
    expect(zetsu.chapter).toBe(385)
    expect(zetsu.beastStaging).toContainEqual({ ownerId: 'prince-tserriednich', omit: true })
  })
})
