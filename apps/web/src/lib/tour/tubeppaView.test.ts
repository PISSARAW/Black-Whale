import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildTubeppaDetails,
  tubeppaSurfacePlan,
  hasTubeppaModel,
  TUBEPPA_LIVING,
} from './tubeppaView'
import { TUBEPPA_PRIVATE_SPACES } from './tubeppaView'
import { MANGA_TUBEPPA_VIEWS } from './mangaTubeppaViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { tubeppaApartmentFixtures } from '$lib/components/map/projection/tubeppaApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1005')!
const build = (spaceId: string, changes = {}) =>
  buildTubeppaDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Tubeppa’s apartment against the workstation panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from seven reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1005'))).toEqual([])
    expect(TUBEPPA_PRIVATE_SPACES).toHaveLength(7)
    for (const spaceId of TUBEPPA_PRIVATE_SPACES) {
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const boards = plan.structures.filter((item) => item.kind === 'painting')
    expect(boards).toHaveLength(2)
    expect(new Set(boards.map((item) => item.at[0])).size).toBe(1)
    expect(plan.structures.some((item) => item.id.endsWith('-whiteboard-2'))).toBe(false)
    expect(tubeppaSurfacePlan(plan, false).structures).toEqual([])
    expect(tubeppaSurfacePlan(plan, true)).toBe(plan)
    expect(tubeppaApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasTubeppaModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [TUBEPPA_LIVING, ...TUBEPPA_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(id === TUBEPPA_LIVING ? 250_000 : 20_000)
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
    expect(MANGA_TUBEPPA_VIEWS).toHaveLength(11)
    for (const view of MANGA_TUBEPPA_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (TUBEPPA_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('faces the seated prince towards the laptop and keeps the guardian absent from the source view', () => {
    const view = MANGA_TUBEPPA_VIEWS.find((view) => view.id === 'tubeppa-living-workstation')!
    const person = view.staging![0],
      desk = plan.structures.find((item) => item.id.endsWith('-living-desk'))!
    const dx = desk.at[0] - person.at[0],
      dz = desk.at[1] - person.at[1]
    expect(
      (dx * Math.sin(person.heading!) + dz * Math.cos(person.heading!)) / Math.hypot(dx, dz),
    ).toBeGreaterThan(0.99)
    expect(person.pose).toBe('seated')
    expect(view.pages).toContain('9')
    expect(view.beastStaging).toContainEqual({ ownerId: 'prince-tubeppa', omit: true })
  })
})
