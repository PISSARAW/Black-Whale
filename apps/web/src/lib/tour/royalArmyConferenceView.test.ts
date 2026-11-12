import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, validateBlueprint, floorOf } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildRoyalArmyConferenceDetails,
  ROYAL_ARMY_CONFERENCE_ROOM,
  royalArmyConferenceSurfacePlan,
} from './royalArmyConferenceView'
import { MANGA_ROYAL_ARMY_CONFERENCE_VIEWS } from './mangaRoyalArmyConferenceViews'
import { MANGA_VIEWS } from './mangaViews'
import { pointInPolygon, structureFootprint, polygonsOverlap } from './geometry'
import { SurfaceWalker } from './SurfaceWalker'
import type { Vec2 } from './types'
import {
  royalArmyConferenceFixtures,
  royalArmyConferencePoint,
  royalArmyConferenceSpotAnchors,
  ROYAL_ARMY_VIEWBOX,
} from '$lib/components/map/projection/royalArmyConferencePlan'
import { spotAnchorFor } from '$lib/components/map/projection/roomAnchors'
import type { MapMarker } from '$lib/components/map/projection/types'

const plan = theShip().plans.get('interior-royal-army-conference')!
const room = plan.spaces.find(({ id }) => id === ROYAL_ARMY_CONFERENCE_ROOM)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === room.id)
const fixture = (suffix: string) => structures.find(({ id }) => id === `${room.id}-${suffix}`)!
const build = (overrides = {}) =>
  buildRoyalArmyConferenceDetails({ THREE, plan, spaceId: room.id, reveal: false, ...overrides })!

describe('Army Conference Floor corrected against chapter 380, pages 1–6', () => {
  it('satisfies the blueprint invariants and distinguishes the committee and audience groups', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('royal-army-conference'))).toEqual(
      [],
    )
    expect(structures).toHaveLength(37)
    expect(structures.filter(({ kind }) => kind === 'seat')).toHaveLength(30)
    expect(structures.filter(({ id }) => id.includes('audience-chair'))).toHaveLength(18)
    expect(structures.every(({ source }) => source.includes('reconstructed'))).toBe(true)
  })

  it('opens the U towards the speaker, closes the audience side and keeps floor furniture separate', () => {
    const head = fixture('table-head'),
      port = fixture('table-port'),
      starboard = fixture('table-starboard')
    expect(head.at[1]).toBeGreaterThan(port.at[1])
    expect(head.at[1] - head.size[1] / 2).toBeCloseTo(port.at[1] + port.size[1] / 2)
    expect(starboard.at[1]).toBe(port.at[1])
    expect(fixture('chair-01').rotation).toBe(180)
    const solids = structures.filter(({ base }) => base === 0)
    for (const solid of solids) {
      const footprint = structureFootprint(solid)
      expect(
        footprint.every((at) => pointInPolygon(at, room.footprint)),
        solid.id,
      ).toBe(true)
      for (const other of solids.filter(({ id }) => id > solid.id))
        expect(
          polygonsOverlap(footprint, structureFootprint(other)),
          `${solid.id}/${other.id}`,
        ).toBe(false)
    }
  })

  it('provides an unobstructed central aisle and a physical presentation stage', () => {
    const walker = new SurfaceWalker()
    let at: Vec2 = [0, 6.5]
    const floor = walker.reset(plan, at)
    // Walk around the closed table instead of passing through its apron.
    for (const to of [
      [0, 4.6],
      [7.4, 4.6],
      [7.4, -3.3],
      [0.5, -3.3],
      [0.5, -5.1],
    ] as Vec2[]) {
      at = walker.move(plan, { from: at, to, extras: [], ghost: false })
      expect(at[0]).toBeCloseTo(to[0], 3)
      expect(at[1]).toBeCloseTo(to[1], 3)
    }
    expect(walker.floor(plan, at)).toBeCloseTo(floor + fixture('dais').height)
    expect(fixture('lectern').base).toBe(fixture('dais').height)
  })

  it('batches finite geometry in the room envelope without unsupported luminous equipment', () => {
    const root = build()
    const bounds = new THREE.Box3().setFromObject(root)
    expect(root.children).toHaveLength(1)
    let triangles = 0
    for (const mesh of root.children as THREE.Mesh[]) {
      expect(mesh.isMesh).toBe(true)
      const positions = mesh.geometry.getAttribute('position')
      expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
      triangles += positions.count / 3
    }
    expect(triangles).toBeLessThan(150_000)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-10.01)
    expect(bounds.max.x).toBeLessThanOrEqual(10.01)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-7.51)
    expect(bounds.max.z).toBeLessThanOrEqual(7.51)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.01)
    expect(bounds.max.y).toBeLessThanOrEqual(floorOf(room, plan.tier) + 5.01)
    disposeBanquetDetails(root)
  })

  it('preserves collisions and the original blocks in evidence mode', () => {
    const surface = royalArmyConferenceSurfacePlan(plan, false)
    expect(surface.structures.filter(({ spaceId }) => spaceId === room.id)).toEqual([])
    expect(plan.structures).toHaveLength(37)
    expect(royalArmyConferenceSurfacePlan(plan, true)).toBe(plan)
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'unrelated' })).toBeNull()
  })

  it('keeps legacy view links, corrects their sources and supports an empty decor inspection', () => {
    expect(MANGA_ROYAL_ARMY_CONFERENCE_VIEWS).toHaveLength(5)
    for (const view of MANGA_ROYAL_ARMY_CONFERENCE_VIEWS) {
      expect(MANGA_VIEWS.some(({ id }) => id === view.id)).toBe(true)
      expect(view.chapter).toBe(380)
      expect(view.pages).toContain('chapitre')
    }
    const audience = MANGA_ROYAL_ARMY_CONFERENCE_VIEWS[0]
    expect(audience.staging?.[0]).toMatchObject({
      characterId: 'mizaistom-nana',
      floorOffset: fixture('dais').height,
    })
    expect(
      MANGA_ROYAL_ARMY_CONFERENCE_VIEWS.find(({ id }) => id === 'royal-army-briefing-decor')
        ?.staging,
    ).toEqual([])
  })

  it('projects every walked fixture, and binds Mizaistom to his corrected position', () => {
    expect(royalArmyConferenceFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const point = royalArmyConferencePoint([0.5, -5.1])
    const anchor = royalArmyConferenceSpotAnchors.occupants['mizaistom-nana']
    expect(anchor.x).toBeCloseTo((point.x / ROYAL_ARMY_VIEWBOX.width) * 100)
    expect(anchor.y).toBeCloseTo((point.y / ROYAL_ARMY_VIEWBOX.height) * 100)
    expect(
      spotAnchorFor({ characterSlug: 'mizaistom-nana', locationId: room.id } as MapMarker)?.exact,
    ).toBe(true)
  })
})
