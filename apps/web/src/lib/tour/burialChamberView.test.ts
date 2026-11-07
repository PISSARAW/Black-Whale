import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildBurialChamberDetails, BURIAL_SPACE } from './burialChamberView'
import { MANGA_BURIAL_CHAMBER_VIEWS } from './mangaBurialChamberViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  burialCoffins,
  burialCables,
  burialReliquary,
  burialSpotAnchors,
  BURIAL_VIEWBOX,
} from '$lib/components/map/projection/burialChamberPlan'

const ship = theShip()
const plan = ship.plans.get('interior-burial-chamber')!
const room = ship.spaces.get(BURIAL_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === BURIAL_SPACE)

const build = (overrides = {}) =>
  buildBurialChamberDetails({ THREE, plan, spaceId: BURIAL_SPACE, reveal: false, ...overrides })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the princes burial chamber reconstructed from chapter 371', () => {
  it('satisfies the shared blueprint invariants for the burial rotunda', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(BURIAL_SPACE))).toEqual([])
  })

  it('holds exactly fourteen radial caskets and the central apparatus in the blueprint', () => {
    const coffins = structures.filter(({ id }) => id.includes('coffin'))
    expect(coffins).toHaveLength(14)
    expect(burialCoffins).toHaveLength(14)
    expect(burialReliquary).toBeDefined()
    expect(burialCables).toHaveLength(14)

    // Coffin 1 (Momoze) has the active relay
    expect(burialCables[0].active).toBe(true)
    expect(burialCables.slice(1).every((cable) => !cable.active)).toBe(true)
  })

  it('keeps all coffins within the rotunda and free of mutual collision overlap', () => {
    const solids = structures.filter(({ kind }) => kind === 'casket')
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
    expect(bounds.max.y).toBeLessThanOrEqual(floor + room.ceiling! + 0.1)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-10.5)
    expect(bounds.max.x).toBeLessThanOrEqual(10.5)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-10.5)
    expect(bounds.max.z).toBeLessThanOrEqual(10.5)

    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in other rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-banquet-hall' })).toBeNull()
  })

  it('rebuilds the ornament with the current coffins instead of leaving ghosts behind', () => {
    const root = build()
    const halfCoffins = build({
      plan: {
        ...plan,
        structures: plan.structures.filter(
          ({ id }) => !id.includes('coffin-01') && !id.includes('coffin-02'),
        ),
      },
    })
    expect(triangles(halfCoffins)).toBeLessThan(triangles(root))

    const empty = build({ plan: { ...plan, structures: [] } })
    expect(triangles(empty)).toBeLessThan(triangles(halfCoffins))

    for (const object of [root, halfCoffins, empty]) disposeBanquetDetails(object)
  })

  it('anchors King Nasubi at Momoze’s coffin in the 2D local projection', () => {
    const nasubi = burialSpotAnchors.occupants['nasubi-hui-guo-rou']
    expect(nasubi).toBeDefined()
    expect(nasubi.x).toBeGreaterThan(50)
    expect(nasubi.x).toBeLessThan(70)
    expect(nasubi.y).toBeGreaterThan(70)
    expect(nasubi.y).toBeLessThan(90)
    expect(BURIAL_VIEWBOX.width).toBe(800)
    expect(BURIAL_VIEWBOX.height).toBe(800)
  })

  it('publishes the canonical manga views from chapter 371 with staging', () => {
    expect(MANGA_BURIAL_CHAMBER_VIEWS.length).toBe(3)
    for (const view of MANGA_BURIAL_CHAMBER_VIEWS) {
      expect(view.spaceId).toBe(BURIAL_SPACE)
      expect(view.chapter).toBe(371)
      expect(view.staging).toBeDefined()
      expect(view.staging?.some((s) => s.characterId === 'nasubi-hui-guo-rou')).toBe(true)
    }
  })
})
