import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildPoliceStationDetails,
  POLICE_ATRIUM,
  POLICE_ENTRANCE,
  POLICE_SAFETY,
} from './policeStationView'
import { MANGA_POLICE_VIEWS } from './mangaPoliceViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  policeFixtures,
  policeSpotAnchors,
} from '$lib/components/map/projection/policeStationPlan'

const ship = theShip()
const plan = ship.plans.get('interior-police-station')!
const atrium = ship.spaces.get(POLICE_ATRIUM)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === POLICE_ATRIUM)
const fixture = (suffix: string) => plan.structures.find(({ id }) => id.endsWith(suffix))!

const build = (overrides = {}) =>
  buildPoliceStationDetails({
    THREE,
    plan,
    spaceId: POLICE_ATRIUM,
    reveal: false,
    ...overrides,
  })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the central police station reconstructed from chapters 349, 378 and 393', () => {
  it('satisfies the shared blueprint invariants for the police spaces', () => {
    expect(
      validateBlueprint().filter((issue) => issue.includes('tier-3-central-police-station')),
    ).toEqual([])
  })

  it('holds the fountain, colonnade, marquee and desks in the blueprint', () => {
    const fountain = fixture('-fountain')
    const frontDesk = fixture('-front-desk')
    const safetyDesk = fixture('-safety-desk')
    const marquee = fixture('-marquee')

    expect(fountain.kind).toBe('basin')
    expect(fountain.sides).toBe(8)
    expect(frontDesk.kind).toBe('counter')
    expect(safetyDesk.kind).toBe('counter')
    expect(marquee.kind).toBe('platform')
    expect(marquee.base).toBeGreaterThanOrEqual(3.5)

    const columns = plan.structures.filter(({ id }) => id.includes('-column-'))
    expect(columns).toHaveLength(8)
    const galleries = plan.structures.filter(({ id }) => id.includes('-gallery-'))
    expect(galleries).toHaveLength(8)
  })

  it('keeps the floor furniture within the atrium and clear of other collision volumes', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const solid of solids) {
      const footprint = structureFootprint(solid)
      expect(
        footprint.every((at) => pointInPolygon(at, atrium.footprint)),
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

  it('batches finite geometry within the envelope and detail budget', () => {
    const root = build()
    expect(root.children.length).toBeGreaterThan(0)
    expect(root.children.length).toBeLessThanOrEqual(2)
    expect(triangles(root)).toBeLessThan(200_000)
    expect(root.children.some((child) => child instanceof THREE.Light)).toBe(false)

    for (const mesh of root.children as THREE.Mesh[]) {
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      )
    }

    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(atrium, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    // Lantern rises up to +2.6m above the 16m ceiling
    expect(bounds.max.y).toBeLessThanOrEqual(floor + atrium.ceiling! + 3.0)
    disposeBanquetDetails(root)
  })

  it('builds specific details for each police space and omits them in reveal mode', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-banquet-hall' })).toBeNull()

    const safetyDetails = buildPoliceStationDetails({
      THREE,
      plan,
      spaceId: POLICE_SAFETY,
      reveal: false,
    })
    expect(safetyDetails).not.toBeNull()
    disposeBanquetDetails(safetyDetails!)

    const entranceDetails = buildPoliceStationDetails({
      THREE,
      plan,
      spaceId: POLICE_ENTRANCE,
      reveal: false,
    })
    expect(entranceDetails).not.toBeNull()
    disposeBanquetDetails(entranceDetails!)
  })

  it('includes high-fidelity floor paving, screens, roof coffers and security apparatus', () => {
    const atriumRoot = build()
    expect(atriumRoot.children).toHaveLength(2)
    expect(triangles(atriumRoot)).toBeGreaterThan(10_000)
    disposeBanquetDetails(atriumRoot)

    const safetyRoot = buildPoliceStationDetails({
      THREE,
      plan,
      spaceId: POLICE_SAFETY,
      reveal: false,
    })!
    expect(safetyRoot.children).toHaveLength(2)
    expect(triangles(safetyRoot)).toBeGreaterThan(2_000)
    disposeBanquetDetails(safetyRoot)

    const entranceRoot = buildPoliceStationDetails({
      THREE,
      plan,
      spaceId: POLICE_ENTRANCE,
      reveal: false,
    })!
    expect(entranceRoot.children).toHaveLength(2)
    expect(triangles(entranceRoot)).toBeGreaterThan(400)
    disposeBanquetDetails(entranceRoot)
  })

  it('places camera views and Mizaistom Nana within room footprint and clear of solids', () => {
    for (const view of MANGA_POLICE_VIEWS) {
      const space = ship.spaces.get(view.spaceId)!
      expect(pointInPolygon(view.at, space.footprint)).toBe(true)

      const solids = plan.structures.filter((s) => s.spaceId === view.spaceId && s.base === 0)
      for (const solid of solids) {
        expect(pointInPolygon(view.at, structureFootprint(solid)), `${view.id}/${solid.id}`).toBe(
          false,
        )
      }

      if (view.staging) {
        for (const actor of view.staging) {
          expect(pointInPolygon(actor.at, space.footprint)).toBe(true)
        }
      }
    }
  })

  it('projects the room fixtures and spot anchors into the 2D map', () => {
    expect(policeFixtures.length).toBeGreaterThan(0)
    const mizaistomSpot = policeSpotAnchors.occupants['mizaistom-nana']
    expect(mizaistomSpot.x).toBeGreaterThan(0)
    expect(mizaistomSpot.x).toBeLessThan(100)
    expect(mizaistomSpot.y).toBeGreaterThan(0)
    expect(mizaistomSpot.y).toBeLessThan(100)

    const fountainSpot = policeSpotAnchors.fountain
    expect(fountainSpot.x).toBeGreaterThan(0)
    expect(fountainSpot.x).toBeLessThan(100)
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
