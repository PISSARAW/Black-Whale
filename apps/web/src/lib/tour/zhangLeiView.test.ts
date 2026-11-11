import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildZhangLeiDetails, ZHANG_LEI_DINING } from './zhangLeiView'
import { MANGA_ZHANG_LEI_VIEWS } from './mangaZhangLeiViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  zhangLeiFixtures,
  zhangLeiPoint,
  zhangLeiSpotAnchors,
  ZHANG_LEI_VIEWBOX,
} from '$lib/components/map/projection/zhangLeiPlan'

const ship = theShip()
const plan = ship.plans.get('interior-room-1003')!
const room = ship.spaces.get(ZHANG_LEI_DINING)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === ZHANG_LEI_DINING)
const fixture = (suffix: string) => structures.find(({ id }) => id.endsWith(suffix))!
const build = (overrides = {}) =>
  buildZhangLeiDetails({ THREE, plan, spaceId: ZHANG_LEI_DINING, reveal: false, ...overrides })!
const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('state dining room of Prince Zhang Lei reconstructed from chapter 365', () => {
  it('satisfies the shared blueprint invariants for Room 1003 state dining', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(ZHANG_LEI_DINING))).toEqual([])
  })

  it('holds Zhang Lei’s ceremonial table, high-backed chairs, credenza, standing statue, tabletop candelabra, guéridon and wall frames', () => {
    const table = fixture('-dining-table-07')
    const chairHead = fixture('-dining-chair-head')
    const chairFoot = fixture('-dining-chair-foot')
    const credenza = fixture('-dining-credenza')
    const statueStand = fixture('-dining-statue-stand')
    const candelabrum = fixture('-dining-candelabrum')
    const pedestalTable = fixture('-dining-pedestal-table')
    const framedDoc = fixture('-dining-framed-document')

    expect(table.kind).toBe('table')
    expect(chairHead.kind).toBe('seat')
    expect(chairFoot.kind).toBe('seat')
    expect(credenza.kind).toBe('cabinet')
    expect(statueStand.kind).toBe('cabinet')
    expect(candelabrum.kind).toBe('cabinet')
    expect(pedestalTable.kind).toBe('table')
    expect(framedDoc.kind).toBe('painting')
  })

  it('keeps the floor furniture within the room and clear of other collision volumes', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const solid of solids) {
      const footprint = structureFootprint(solid)
      expect(
        footprint.every((at) => pointInPolygon(at, room.footprint)),
        solid.id,
      ).toBe(true)
      for (const other of solids.filter(({ id }) => id > solid.id)) {
        expect(
          polygonsOverlap(footprint, structureFootprint(other)),
          `${solid.id}/${other.id}`,
        ).toBe(false)
      }
    }
  })

  it('batches finite geometry within the envelope and the banquet detail budget', () => {
    const root = build()
    expect(root.children.length).toBeGreaterThan(0)
    expect(root.children.length).toBeLessThanOrEqual(2)
    expect(triangles(root)).toBeLessThan(150_000)
    expect(root.children.some((child) => child instanceof THREE.Light)).toBe(false)
    for (const mesh of root.children as THREE.Mesh[]) {
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      )
    }
    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(room, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + (room.ceiling ?? 4.0) + 0.1)
    expect(bounds.min.x).toBeGreaterThanOrEqual(1.4)
    expect(bounds.max.x).toBeLessThanOrEqual(10.65)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-5.8)
    expect(bounds.max.z).toBeLessThanOrEqual(0.4)
    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in other rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-royal-residential-sector-room-1004-living' })).toBeNull()
  })

  it('rebuilds the ornament with the current furniture instead of leaving ghosts behind', () => {
    const root = build()
    const removed = build({
      plan: { ...plan, structures: plan.structures.filter(({ id }) => !id.includes('table-07')) },
    })
    expect(triangles(removed)).toBeLessThan(triangles(root))
    const empty = build({ plan: { ...plan, structures: [] } })
    expect(triangles(empty)).toBeLessThan(triangles(removed))
    for (const object of [root, removed, empty]) disposeBanquetDetails(object)
  })

  it('keeps dining cameras clear of solids and places the audience in populated views', () => {
    for (const v of MANGA_ZHANG_LEI_VIEWS.filter((view) => view.spaceId === ZHANG_LEI_DINING)) {
      expect(pointInPolygon(v.at, room.footprint)).toBe(true)
      for (const solid of structures.filter(({ base }) => base === 0)) {
        expect(pointInPolygon(v.at, structureFootprint(solid)), `${v.id}/${solid.id}`).toBe(false)
      }
      if (!v.staging?.length) continue
      const zhanglei = v.staging.find(({ characterId }) => characterId === 'prince-zhanglei')!
      expect(zhanglei.at).toEqual(fixture('-dining-chair-head').at)
      const oito = v.staging!.find(({ characterId }) => characterId === 'queen-oito')!
      expect(oito.at).toEqual(fixture('-dining-chair-foot').at)
    }
  })

  it('projects the room fixtures and audience spots into the 2D map', () => {
    expect(zhangLeiFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const chair = zhangLeiPoint(fixture('-dining-chair-head').at)
    expect(zhangLeiSpotAnchors.occupants['prince-zhanglei']).toEqual({
      x: (chair.x / ZHANG_LEI_VIEWBOX.width) * 100,
      y: (chair.y / ZHANG_LEI_VIEWBOX.height) * 100,
    })
  })

  it('releases the GPU resources when the room is unloaded', () => {
    const root = build()
    const parent = new THREE.Group()
    parent.add(root)
    const resources = (root.children as THREE.Mesh[]).flatMap((mesh) => [
      mesh.geometry,
      mesh.material as THREE.Material,
    ])
    const dispose = resources.map((resource) => vi.spyOn(resource, 'dispose'))
    disposeBanquetDetails(root)
    expect(root.parent).toBeNull()
    for (const spy of dispose) expect(spy).toHaveBeenCalledOnce()
  })
})
