import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildDiningHallDetails, DINING_HALL_SPACE, isCentralVIPTable } from './diningHallView'
import { centralVIPTableLayout } from './diningHallFurniture'
import { MANGA_DINING_HALL_VIEWS } from './mangaDiningHallViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  diningHallFixtures,
  diningHallPoint,
  diningHallSpotAnchors,
  DINING_HALL_VIEWBOX,
} from '$lib/components/map/projection/diningHallPlan'
import { spotAnchorFor } from '$lib/components/map/projection/roomAnchors'
import type { MapMarker } from '$lib/components/map/projection/types'

const ship = theShip()
const plan = ship.plans.get('tier-5')!
const room = ship.spaces.get(DINING_HALL_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === DINING_HALL_SPACE)
const build = (overrides = {}) =>
  buildDiningHallDetails({
    THREE,
    plan,
    spaceId: DINING_HALL_SPACE,
    reveal: false,
    ...overrides,
  })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the central dining hall reconstructed from chapters 371, 377 and 379-380', () => {
  it('satisfies the shared blueprint invariants for the dining hall', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(DINING_HALL_SPACE))).toEqual([])
  })

  it('keeps all floor structures within the room and clear of other collision solids', () => {
    const solids = structures.filter(({ base }) => base === 0)
    expect(solids.length).toBeGreaterThan(60)

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

  it('aligns both central tablecloths and place settings with the long axis', () => {
    const platforms = structures.filter(isCentralVIPTable)
    const platformBenches = structures.filter(
      (structure) => structure.id.includes('-platform-') && !isCentralVIPTable(structure),
    )
    expect(platforms).toHaveLength(2)
    expect(platformBenches).toHaveLength(8)
    expect(platformBenches.every(({ kind }) => kind === 'seat')).toBe(true)

    for (const platform of platforms) {
      const layout = centralVIPTableLayout(platform.size)
      expect(layout.runner[1]).toBeGreaterThan(layout.runner[0])
      expect(new Set(layout.placeSettings.map(([x]) => x))).toHaveLength(2)
      expect(new Set(layout.placeSettings.map(([, z]) => z))).toHaveLength(4)
    }
  })

  it('batches finite geometry within the envelope and the detail budget', () => {
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
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + room.ceiling! + 0.05)
    expect(bounds.min.x).toBeGreaterThanOrEqual(13.9)
    expect(bounds.max.x).toBeLessThanOrEqual(45.6)
    expect(bounds.min.z).toBeGreaterThanOrEqual(10.4)
    expect(bounds.max.z).toBeLessThanOrEqual(42.1)

    disposeBanquetDetails(root)
  })

  it('physically anchors overhead elements to ceiling and walls without mid-air gaps', () => {
    const root = build()
    const meshes = root.children as THREE.Mesh[]
    const positions: [number, number, number][] = []
    for (const mesh of meshes) {
      const posAttr = mesh.geometry.getAttribute('position')
      for (let i = 0; i < posAttr.count; i++) {
        positions.push([posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)])
      }
    }

    // Geometry reaches flush to the 9.0 m ceiling (within 0.05 m)
    const ceilingVertices = positions.filter(([, y]) => y >= 8.95)
    expect(ceilingVertices.length).toBeGreaterThan(50)

    // Catwalk hangers reaching the 9.0 m ceiling on both longitudinal lines
    const catwalkWestCeiling = positions.filter(([x, y]) => Math.abs(x - 23.5) < 0.6 && y >= 8.95)
    const catwalkEastCeiling = positions.filter(([x, y]) => Math.abs(x - 37.5) < 0.6 && y >= 8.95)
    expect(catwalkWestCeiling.length).toBeGreaterThanOrEqual(10)
    expect(catwalkEastCeiling.length).toBeGreaterThanOrEqual(10)

    // Menu board hangers reaching the 9.0 m ceiling above the service counter
    const menuBoardCeiling = positions.filter(([x, y]) => Math.abs(x - 14.7) < 0.3 && y >= 8.95)
    expect(menuBoardCeiling.length).toBeGreaterThanOrEqual(10)

    // South wall catwalk access ladder with safety cage crinoline
    const ladderCageVertices = positions.filter(
      ([x, y, z]) => Math.abs(x - 23.5) < 0.35 && y >= 2.2 && y <= 7.65 && z >= 41.4 && z <= 41.9,
    )
    expect(ladderCageVertices.length).toBeGreaterThanOrEqual(20)

    // Geometry reaches flush to the West wall at x = 14.0 (within 0.05 m)
    const westWallVertices = positions.filter(([x]) => x <= 14.05)
    expect(westWallVertices.length).toBeGreaterThan(50)

    // Geometry reaches flush to the East wall at x = 45.5 (within 0.05 m)
    const eastWallVertices = positions.filter(([x]) => x >= 45.45)
    expect(eastWallVertices.length).toBeGreaterThan(20)

    // Kitchen exhaust drop duct and hood cover the vertical span without gap
    const ductHoodY = positions
      .filter(([x, , z]) => Math.abs(x - 14.42) < 0.5 && Math.abs(z - 23.5) < 0.8)
      .map(([, y]) => y)
    const minY = Math.min(...ductHoodY)
    const maxY = Math.max(...ductHoodY)
    expect(maxY).toBeGreaterThanOrEqual(8.95)
    expect(minY).toBeLessThanOrEqual(2.25)

    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in unrelated rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-5-hangar-entrance' })).toBeNull()
  })

  it('rebuilds the furnishings with the current plan instead of leaving ghosts behind', () => {
    const root = build()
    const withoutBenches = build({
      plan: {
        ...plan,
        structures: plan.structures.filter(
          ({ spaceId, kind }) => spaceId !== DINING_HALL_SPACE || kind !== 'seat',
        ),
      },
    })
    expect(triangles(withoutBenches)).toBeLessThan(triangles(root))

    const architectureOnly = build({
      plan: {
        ...plan,
        structures: plan.structures.filter(({ spaceId }) => spaceId !== DINING_HALL_SPACE),
      },
    })
    expect(triangles(architectureOnly)).toBeLessThan(triangles(withoutBenches))

    for (const object of [root, withoutBenches, architectureOnly]) disposeBanquetDetails(object)
  })

  it('keeps all manga camera anchors and character staging positions within the room and clear of solids', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const view of MANGA_DINING_HALL_VIEWS) {
      expect(pointInPolygon(view.at, room.footprint)).toBe(true)
      for (const solid of solids) {
        expect(pointInPolygon(view.at, structureFootprint(solid)), `${view.id}/${solid.id}`).toBe(
          false,
        )
      }
      if (view.staging) {
        for (const actor of view.staging) {
          expect(pointInPolygon(actor.at, room.footprint), `${view.id}/${actor.characterId}`).toBe(
            true,
          )
        }
      }
    }
  })

  it('projects the same furnishings and spot anchors into the 2D map', () => {
    expect(diningHallFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const franklin = diningHallFixtures.find(({ id }) => id.endsWith('-franklin-table'))!
    const franklinPos = diningHallPoint(franklin.at)
    expect(diningHallSpotAnchors.occupants['franklin-bordeau']).toEqual({
      x: (franklinPos.x / DINING_HALL_VIEWBOX.width) * 100,
      y: (franklinPos.y / DINING_HALL_VIEWBOX.height) * 100,
    })

    const southPlatform = diningHallFixtures.find(({ id }) => id.endsWith('-platform-south'))!
    const southPos = diningHallPoint(southPlatform.at)
    expect(diningHallSpotAnchors.fallback).toEqual({
      x: (southPos.x / DINING_HALL_VIEWBOX.width) * 100,
      y: (southPos.y / DINING_HALL_VIEWBOX.height) * 100,
      inferred: true,
    })

    const franklinAnchor = spotAnchorFor({
      id: 'franklin-marker',
      locationId: DINING_HALL_SPACE,
      characterSlug: 'franklin-bordeau',
    } as unknown as MapMarker)
    expect(franklinAnchor?.exact).toBe(true)
    expect(franklinAnchor?.x).toBeCloseTo(diningHallSpotAnchors.occupants['franklin-bordeau'].x)

    const fallbackAnchor = spotAnchorFor({
      id: 'generic-passenger',
      locationId: DINING_HALL_SPACE,
    } as unknown as MapMarker)
    expect(fallbackAnchor?.exact).toBe(false)
    expect(fallbackAnchor?.x).toBeCloseTo(diningHallSpotAnchors.fallback.x)
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
