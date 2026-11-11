import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf } from './blueprint'
import { pointInPolygon, structureFootprint } from './geometry'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildBenjaminRoomDetails, benjaminSurfacePlan } from './benjaminRoomView'
import { benjaminAppearanceOf } from './benjaminApartmentAppearance'
import { appearanceOf } from './roomAppearance'
import { MANGA_BENJAMIN_APARTMENT_VIEWS } from './mangaBenjaminApartmentViews'
import { benjaminApartmentFixtures } from '$lib/components/map/projection/benjaminRoomPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1001')!
const rooms = plan.spaces.filter(({ id }) => !id.endsWith('-living'))
const build = (spaceId: string, options = {}) =>
  buildBenjaminRoomDetails({ THREE, plan, spaceId, reveal: false, ...options })

describe('the programme-type rooms of Benjamin’s apartment', () => {
  it('labels the seven rooms and their furniture as map-based reconstructions', () => {
    expect(rooms).toHaveLength(7)
    for (const room of rooms) {
      expect(room.provenance).toBe('map')
      expect(room.sourceFr).toContain('reconstitués')
      for (const item of plan.structures.filter(({ spaceId }) => spaceId === room.id))
        expect(item.provenance).toBe('map')
    }
    expect(plan.spaces.find(({ id }) => id.endsWith('-living'))!.provenance).toBe('panel')
  })

  it('replaces all furniture blocks while retaining walked collision walls and evidence volumes', () => {
    const surface = benjaminSurfacePlan(plan, false)
    expect(surface.structures).toEqual([])
    expect(surface.walls).toBe(plan.walls)
    expect(benjaminSurfacePlan(plan, true)).toBe(plan)
  })

  it('builds and disposes finite geometry within each room and without extra lights', () => {
    for (const room of rooms) {
      const root = build(room.id)!
      expect(root.children.length).toBeGreaterThan(0)
      expect(root.children.length).toBeLessThanOrEqual(2)
      let vertices = 0
      for (const mesh of root.children as THREE.Mesh[]) {
        const positions = mesh.geometry.getAttribute('position')
        expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
        vertices += positions.count
        const dispose = vi.spyOn(mesh.geometry, 'dispose')
        expect(root.children.some((object) => object instanceof THREE.Light)).toBe(false)
        const box = new THREE.Box3().setFromObject(mesh)
        expect(box.min.y, room.id).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.02)
        expect(box.max.y, room.id).toBeLessThanOrEqual(
          floorOf(room, plan.tier) + ceilingOf(room, plan.tier) + 0.03,
        )
        expect(dispose).not.toHaveBeenCalled()
      }
      expect(vertices / 3).toBeLessThan(20_000)
      const disposers = (root.children as THREE.Mesh[]).map((mesh) =>
        vi.spyOn(mesh.geometry, 'dispose'),
      )
      disposeBanquetDetails(root)
      for (const dispose of disposers) expect(dispose).toHaveBeenCalledOnce()
      expect(build(room.id, { reveal: true })).toBeNull()
    }
  })

  it('reads the current walked structures, including removing every furniture item', () => {
    for (const room of rooms.filter((room) =>
      plan.structures.some(({ spaceId }) => spaceId === room.id),
    )) {
      const root = build(room.id)!,
        empty = build(room.id, { plan: { ...plan, structures: [] } })!
      const count = (group: THREE.Group) =>
        (group.children as THREE.Mesh[]).reduce(
          (sum, mesh) => sum + mesh.geometry.getAttribute('position').count,
          0,
        )
      expect(count(root)).toBeGreaterThan(count(empty))
      disposeBanquetDetails(root)
      disposeBanquetDetails(empty)
    }
  })

  it('places all seven inspection cameras in clear floor space and distinguishes the programme from a panel', () => {
    expect(MANGA_BENJAMIN_APARTMENT_VIEWS).toHaveLength(7)
    for (const view of MANGA_BENJAMIN_APARTMENT_VIEWS) {
      const room = rooms.find(({ id }) => id === view.spaceId)!
      expect(pointInPolygon(view.at, room.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter(
        ({ spaceId, base }) => spaceId === room.id && base === 0,
      )) {
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      }
      expect(view.staging).toEqual([])
      expect(view.labelFr).toContain('reconstitution')
    }
  })

  it('projects every additional fixture from the same plan, including the L-shaped kitchen and both WCs', () => {
    const fixtures = plan.structures.filter(({ spaceId }) => !spaceId.endsWith('-living'))
    expect(benjaminApartmentFixtures.map(({ id }) => id)).toEqual(fixtures.map(({ id }) => id))
    expect(fixtures.filter(({ id }) => id.includes('-wc-'))).toHaveLength(2)
    const returnCounter = fixtures.find(({ id }) => id.endsWith('-counter-09'))!
    expect(returnCounter.rotation).toBe(-90)
    expect(returnCounter.at[0]).toBeLessThan(2)
  })

  it('restricts the coherent finish to the 1001 and keeps its reception palette', () => {
    const living = plan.spaces.find(({ id }) => id.endsWith('-living'))!
    expect(appearanceOf(living, plan.tier)).toMatchObject({
      floor: 0xaaa08a,
      wall: 0xb6b3a5,
      ceiling: 0xbcb9ab,
    })
    const elsewhere = ship.plans.get('interior-room-1003')!.spaces[0]
    expect(benjaminAppearanceOf(elsewhere, appearanceOf(elsewhere, plan.tier))).toBeNull()
  })
})
