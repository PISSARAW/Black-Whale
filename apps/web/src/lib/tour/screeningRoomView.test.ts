import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, validateBlueprint } from './blueprint'
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

  it('contains the 15 canonical structures in blueprint.json', () => {
    const structures = plan.structures.filter(
      (structure) => structure.spaceId === SCREENING_ROOM_SPACE,
    )
    expect(structures).toHaveLength(15)

    // Stage, proscenium piers, curtain, screen, 4 boxes, 6 seating blocks
    expect(structures.filter((s) => s.kind === 'platform')).toHaveLength(5)
    expect(structures.filter((s) => s.kind === 'pillar')).toHaveLength(2)
    expect(structures.filter((s) => s.kind === 'painting')).toHaveLength(2)
    expect(structures.filter((s) => s.kind === 'seat')).toHaveLength(6)

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
    // Rich theater model with proscenium arch, boxes, chandeliers, raked stalls
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
    expect(preserved.structures.filter((s) => s.spaceId === SCREENING_ROOM_SPACE)).toHaveLength(15)
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
    expect(screeningRoomSpotAnchors.occupants.briefingOfficer).toBeDefined()
    expect(screeningRoomSpotAnchors.occupants.stallsCenter).toBeDefined()
    expect(screeningRoomSpotAnchors.occupants.vipPort).toBeDefined()
    expect(screeningRoomSpotAnchors.stage).toBeDefined()
    expect(screeningRoomSpotAnchors.screen).toBeDefined()
    expect(screeningRoomSpotAnchors.curtain).toBeDefined()
    expect(screeningRoomSpotAnchors.projectionBooth).toBeDefined()
    expect(screeningRoomSpotAnchors.centralAisle).toBeDefined()

    // Check anchor coordinates are percentage values between 0 and 100
    for (const coord of Object.values(screeningRoomSpotAnchors.occupants)) {
      expect(coord.x).toBeGreaterThan(0)
      expect(coord.x).toBeLessThan(100)
      expect(coord.y).toBeGreaterThan(0)
      expect(coord.y).toBeLessThan(100)
    }
  })
})
