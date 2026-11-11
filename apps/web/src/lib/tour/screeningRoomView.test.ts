import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, validateBlueprint, floorOf, ceilingOf } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { MANGA_SCREENING_ROOM_VIEWS } from './mangaScreeningRoomViews'
import { screeningRoomSpotAnchors } from '../components/map/projection/screeningRoomPlan'
import {
  buildScreeningRoomDetails,
  hasScreeningRoomModel,
  isScreeningRoomSpace,
  screeningRoomSurfacePlan,
  SCREENING_ROOM_SPACE,
} from './screeningRoomView'

import { SurfaceWalker } from './SurfaceWalker'
import { pointInPolygon, structureFootprint } from './geometry'

const ship = theShip()
const plan = ship.plans.get('tier-2')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

function hasInfiniteCoords(root: THREE.Group): boolean {
  for (const child of root.children as THREE.Mesh[]) {
    const pos = child.geometry.getAttribute('position')
    for (let i = 0; i < pos.count * 3; i++) {
      if (!Number.isFinite(pos.array[i])) return true
    }
  }
  return false
}

describe('Screening Room (Tier 2) reconstructed from Chapter 359', () => {
  it('satisfies blueprint invariants for the screening room space', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('tier-2-screening-room'))).toEqual(
      [],
    )
  })

  it('represents the shown architecture with paired seating banks and a real stage access', () => {
    const structures = plan.structures.filter(
      (structure) => structure.spaceId === SCREENING_ROOM_SPACE,
    )
    expect(structures).toHaveLength(31)

    // Counts describe this reconstruction, not a published survey of the theatre.
    expect(structures.filter((s) => s.kind === 'platform')).toHaveLength(11)
    expect(structures.filter((s) => s.kind === 'pillar')).toHaveLength(2)
    expect(structures.filter((s) => s.kind === 'painting')).toHaveLength(2)
    expect(structures.filter((s) => s.kind === 'seat')).toHaveLength(12)

    expect(structures.some((s) => s.id === 'tier-2-screening-room-stage')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-proscenium-port')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-proscenium-starboard')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-curtain')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-screen')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-boxes-port-forward')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-boxes-port-aft')).toBe(true)
    expect(structures.some((s) => s.id === 'tier-2-screening-room-boxes-starboard-forward')).toBe(
      true,
    )
    expect(structures.some((s) => s.id === 'tier-2-screening-room-boxes-starboard-aft')).toBe(true)
    for (let i = 1; i <= 6; i++) {
      expect(structures.some((s) => s.id === `tier-2-screening-room-seating-0${i}`)).toBe(true)
    }
  })

  it('builds finite 3D geometry without permanent lights within triangle budget', () => {
    const root = buildScreeningRoomDetails({
      THREE,
      plan,
      spaceId: SCREENING_ROOM_SPACE,
      reveal: false,
    })
    expect(root).not.toBeNull()
    expect(hasInfiniteCoords(root!)).toBe(false)
    expect(root!.children.some((c) => (c as unknown as { isLight?: boolean }).isLight)).toBe(false)
    expect(root!.children.length).toBeLessThanOrEqual(2)

    const triCount = triangles(root!)
    // Detailed theatre model with proscenium, boxes, pleated curtain and seated stalls.
    expect(triCount).toBeGreaterThan(15_000)
    expect(triCount).toBeLessThan(150_000)

    disposeBanquetDetails(root!)
  })

  it('identifies the space and structure models correctly', () => {
    expect(isScreeningRoomSpace(SCREENING_ROOM_SPACE)).toBe(true)
    expect(isScreeningRoomSpace('tier-2-casino')).toBe(false)

    const stage = plan.structures.find((s) => s.id === 'tier-2-screening-room-stage')!
    expect(hasScreeningRoomModel(stage)).toBe(true)
  })

  it('returns null in reveal mode or for unrelated rooms', () => {
    expect(
      buildScreeningRoomDetails({
        THREE,
        plan,
        spaceId: SCREENING_ROOM_SPACE,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildScreeningRoomDetails({
        THREE,
        plan,
        spaceId: 'tier-2-casino',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('filters coarse structures in walk mode and preserves them in reveal mode', () => {
    const filtered = screeningRoomSurfacePlan(plan, false)
    const screeningStructures = filtered.structures.filter(
      (s) => s.spaceId === SCREENING_ROOM_SPACE,
    )
    expect(screeningStructures).toHaveLength(0)

    const preserved = screeningRoomSurfacePlan(plan, true)
    expect(preserved).toBe(plan)
  })

  it('exposes canonical manga viewpoints positioned inside the auditorium', () => {
    expect(MANGA_SCREENING_ROOM_VIEWS).toHaveLength(4)

    const space = plan.spaces.find((s) => s.id === SCREENING_ROOM_SPACE)!
    const [minX, minZ] = space.footprint[0]
    const [maxX, maxZ] = space.footprint[2]

    for (const v of MANGA_SCREENING_ROOM_VIEWS) {
      expect(v.spaceId).toBe(SCREENING_ROOM_SPACE)
      expect(v.chapter).toBe(359)
      expect(v.volume).toBe(34)
      expect(v.label.length).toBeGreaterThan(10)
      expect(v.labelFr.length).toBeGreaterThan(10)

      // Position within room metric bounds
      expect(v.at[0]).toBeGreaterThanOrEqual(minX)
      expect(v.at[0]).toBeLessThanOrEqual(maxX)
      expect(v.at[1]).toBeGreaterThanOrEqual(minZ)
      expect(v.at[1]).toBeLessThanOrEqual(maxZ)
    }

    const ids = MANGA_SCREENING_ROOM_VIEWS.map((v) => v.id)
    expect(ids).toContain('screening-room-overview')
    expect(ids).toContain('screening-room-stage-proscenium')
    expect(ids).toContain('screening-room-vip-box')
    expect(ids).toContain('screening-room-stage-looking-back')
  })

  it('defines 2D/3D projection anchors for key theater fixtures and occupants', () => {
    expect(screeningRoomSpotAnchors.occupants.presenter).toBeDefined()
    expect(screeningRoomSpotAnchors.occupants.stallsCenter).toBeDefined()
    expect(screeningRoomSpotAnchors.occupants.vipPort).toBeDefined()
    expect(screeningRoomSpotAnchors.stage).toBeDefined()
    expect(screeningRoomSpotAnchors.screen).toBeDefined()
    expect(screeningRoomSpotAnchors.curtain).toBeDefined()
    expect(screeningRoomSpotAnchors).not.toHaveProperty('projectionBooth')
    expect(screeningRoomSpotAnchors.centralAisle).toBeDefined()

    // Check anchor coordinates are percentage values between 0 and 100
    for (const coord of Object.values(screeningRoomSpotAnchors.occupants)) {
      expect(coord.x).toBeGreaterThan(0)
      expect(coord.x).toBeLessThan(100)
      expect(coord.y).toBeGreaterThan(0)
      expect(coord.y).toBeLessThan(100)
    }
  })
  it('keeps the entire model inside the theatre, from the floor to its ceiling', () => {
    const root = buildScreeningRoomDetails({
      THREE,
      plan,
      spaceId: SCREENING_ROOM_SPACE,
      reveal: false,
    })!
    const space = ship.spaces.get(SCREENING_ROOM_SPACE)!,
      bounds = new THREE.Box3().setFromObject(root)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-87.5)
    expect(bounds.max.x).toBeLessThanOrEqual(0)
    expect(bounds.min.z).toBeGreaterThanOrEqual(7)
    expect(bounds.max.z).toBeLessThanOrEqual(52.5)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(space, plan.tier) - 0.001)
    expect(bounds.max.y).toBeLessThanOrEqual(
      floorOf(space, plan.tier) + ceilingOf(space, plan.tier) + 0.001,
    )
    disposeBanquetDetails(root)
  })

  it('lets the actual walker cross the central aisle and reach the stage by its steps', () => {
    const walker = new SurfaceWalker()
    const floor = floorOf(ship.spaces.get(SCREENING_ROOM_SPACE)!, plan.tier)
    walker.reset(plan, [-12, 29.75])
    const through = walker.move(plan, {
      from: [-12, 29.75],
      to: [-76.4, 29.75],
      extras: [],
      ghost: false,
    })
    expect(through[0]).toBeCloseTo(-76.4)
    expect(through[1]).toBeCloseTo(29.75)
    let at: readonly [number, number] = [-76.3, 43.5]
    walker.reset(plan, at)
    for (let i = 0; i < 28; i++)
      at = walker.move(plan, { from: at, to: [at[0] - 0.1, at[1]], extras: [], ghost: false })
    expect(at[0]).toBeLessThan(-78.3)
    expect(walker.floor(plan, at)).toBeCloseTo(floor + 1.3)
    expect(plan.columns.get(SCREENING_ROOM_SPACE) ?? []).toEqual([])
  })

  it('keeps the screen in front of its pleated backdrop and the ordinary cameras clear of furniture', () => {
    const screen = plan.structures.find((s) => s.id.endsWith('screening-room-screen'))!
    const curtain = plan.structures.find((s) => s.id.endsWith('screening-room-curtain'))!
    expect(screen.at[0]).toBeGreaterThan(curtain.at[0] + curtain.size[0])
    expect(curtain.base).toBeCloseTo(1.3)
    for (const view of MANGA_SCREENING_ROOM_VIEWS.filter((v) => v.eyeHeight === undefined)) {
      expect(
        plan.structures.some(
          (s) =>
            s.spaceId === SCREENING_ROOM_SPACE && pointInPolygon(view.at, structureFootprint(s)),
        ),
        view.id,
      ).toBe(false)
    }
  })

  it('does not leave hard-coded seats behind when Nen removes a seating bank', () => {
    const build = (p: typeof plan) =>
      buildScreeningRoomDetails({ THREE, plan: p, spaceId: SCREENING_ROOM_SPACE, reveal: false })!
    const original = build(plan),
      without = build({
        ...plan,
        structures: plan.structures.filter((s) => s.id !== 'tier-2-screening-room-seating-01'),
      })
    expect(triangles(original) - triangles(without)).toBeGreaterThan(1000)
    disposeBanquetDetails(original)
    disposeBanquetDetails(without)
  })
})
