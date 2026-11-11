import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { ceilingOf, floorOf, theShip, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildCentralCourthouseDetails,
  CENTRAL_COURTHOUSE_SPACE,
  centralCourthouseSurfacePlan,
} from './centralCourthouseView'
import {
  blocksTheFloor,
  closestPointOnSegment,
  pointInPolygon,
  polygonsOverlap,
  structureFootprint,
} from './geometry'
import { mangaViewById, viewsForSpace } from './mangaViews'
import { resolveMovement, VISITOR_RADIUS } from './navigation'
import type { Structure, Vec2 } from './types'

const ship = theShip()
const plan = ship.plans.get('interior-courthouse')!
const court = ship.spaces.get(CENTRAL_COURTHOUSE_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === CENTRAL_COURTHOUSE_SPACE)
const fixture = (suffix: string): Structure => {
  const structure = structures.find(({ id }) => id === `tier-3-central-courthouse-${suffix}`)
  if (!structure) throw new Error(`The courthouse is missing its ${suffix}`)
  return structure
}

const build = (overrides: Partial<Parameters<typeof buildCentralCourthouseDetails>[0]> = {}) =>
  buildCentralCourthouseDetails({
    THREE,
    plan,
    spaceId: CENTRAL_COURTHOUSE_SPACE,
    reveal: false,
    ...overrides,
  })

/** Stop in front of a fixture, leaving room for the visitor's shoulders. */
const approach = (structure: Structure): Vec2 => [
  structure.at[0],
  structure.at[1] + structure.size[1] / 2 + VISITOR_RADIUS + 0.15,
]

function walkRoute(route: Vec2[]): void {
  let at = route[0]
  for (const target of route.slice(1)) {
    at = resolveMovement(at, target, plan.walls)
    expect(at[0], `Blocked while walking to ${target}`).toBeCloseTo(target[0], 4)
    expect(at[1], `Blocked while walking to ${target}`).toBeCloseTo(target[1], 4)
    expect(pointInPolygon(at, court.footprint)).toBe(true)
  }
}

describe('the Tier 3 Central Courthouse reconstructed from the supplied panel', () => {
  it('keeps the reconstructed interior connected and geometrically valid', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('courthouse'))).toEqual([])
    expect(ship.adjacency.get(CENTRAL_COURTHOUSE_SPACE)).toContain('tier-3-central-courthouse')
  })

  it('preserves the exposed seat, floor-standing gavel and two desks on the right', () => {
    const seat = fixture('seat')
    const gavel = fixture('gavel')
    const rear = fixture('rear-desk')
    const front = fixture('front-desk')

    expect(seat.kind).toBe('seat')
    expect(seat.base).toBe(0)
    expect(gavel.base).toBe(0)
    expect(gavel.at[0]).toBeLessThan(seat.at[0])
    expect(gavel.height).toBeGreaterThan(seat.height)
    expect(rear.at[0]).toBeGreaterThan(seat.at[0])
    expect(front.at[0]).toBeGreaterThan(seat.at[0])
    expect(rear.at[1]).toBeLessThan(front.at[1])
    expect(rear.height).toBeGreaterThan(front.height)
    expect(rear.size[0]).toBeGreaterThan(front.size[0])
    expect(fixture('curtain').at[1]).toBeLessThan(rear.at[1])

    for (const structure of structures) {
      expect(structure.provenance, structure.id).toBe('panel')
      expect(structure.id).not.toMatch(/-(bench-dais|prosecution|defence|dock)$/)
      expect(structure.kind).not.toBe('platform')
    }
  })

  it('keeps each fixture within the room and leaves their collision footprints separate', () => {
    for (const structure of structures) {
      const outline = structureFootprint(structure)
      expect(outline.every((at) => pointInPolygon(at, court.footprint)), structure.id).toBe(true)
      for (const other of structures.filter(({ id }) => id > structure.id)) {
        expect(
          polygonsOverlap(outline, structureFootprint(other)),
          `${structure.id} overlaps ${other.id}`,
        ).toBe(false)
      }
      if (blocksTheFloor(structure)) {
        expect(plan.walls.some(({ structureId }) => structureId === structure.id)).toBe(true)
      }
    }
  })

  it('lets a visitor enter, approach the judge and reach the right-hand desk', () => {
    const door = ship.links.find(({ to }) => to === CENTRAL_COURTHOUSE_SPACE)!
    expect(door.atTo).toBeDefined()
    const entry = door.atTo!
    const seat = approach(fixture('seat'))
    const desk = approach(fixture('front-desk'))

    walkRoute([entry, [0, 1], [seat[0], 1], seat])
    walkRoute([entry, [0, 1], [desk[0], 1], desk])
  })

  it('replaces only the court visuals without removing the original movement obstacles', () => {
    const other: Structure = { ...fixture('seat'), id: 'other-room-seat', spaceId: 'other-room' }
    const unmodelled: Structure = { ...fixture('seat'), id: 'future-courthouse-fixture' }
    const mixed = { ...plan, structures: [...plan.structures, other, unmodelled] }
    const before = mixed.structures.slice()
    const filtered = centralCourthouseSurfacePlan(mixed, false)

    expect(filtered.structures).toEqual([other, unmodelled])
    expect(mixed.structures).toEqual(before)
    expect(filtered.walls).toBe(mixed.walls)
    expect(filtered.columns).toBe(mixed.columns)
    expect(filtered.spaces).toBe(mixed.spaces)

    const seat = fixture('seat')
    const stopped = resolveMovement(approach(seat), seat.at, filtered.walls)
    expect(stopped[1]).toBeGreaterThanOrEqual(seat.at[1] + seat.size[1] / 2 + VISITOR_RADIUS - 1e-6)
    expect(pointInPolygon(stopped, structureFootprint(seat))).toBe(false)
  })

  it('builds finite batched geometry inside the room without adding ambient lights', () => {
    const root = build()!
    expect(root).not.toBeNull()
    try {
      expect(root.children.length).toBeGreaterThan(0)
      expect(root.children.length).toBeLessThanOrEqual(2)
      let triangles = 0
      root.traverse((object) => expect(object).not.toBeInstanceOf(THREE.Light))
      for (const mesh of root.children as THREE.Mesh[]) {
        const positions = mesh.geometry.getAttribute('position')
        const normals = mesh.geometry.getAttribute('normal')
        expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
        expect(Array.from(normals.array).every(Number.isFinite)).toBe(true)
        triangles += positions.count / 3
      }
      expect(triangles).toBeLessThan(80_000)

      const bounds = new THREE.Box3().setFromObject(root)
      const xs = court.footprint.map(([x]) => x)
      const zs = court.footprint.map(([, z]) => z)
      const floor = floorOf(court, plan.tier)
      expect(bounds.min.x).toBeGreaterThanOrEqual(Math.min(...xs) - 0.05)
      expect(bounds.max.x).toBeLessThanOrEqual(Math.max(...xs) + 0.05)
      expect(bounds.min.z).toBeGreaterThanOrEqual(Math.min(...zs) - 0.05)
      expect(bounds.max.z).toBeLessThanOrEqual(Math.max(...zs) + 0.05)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
      expect(bounds.max.y).toBeLessThanOrEqual(floor + ceilingOf(court, plan.tier) + 0.05)
    } finally {
      disposeBanquetDetails(root)
    }
  })

  it('preserves evidence mode and leaves the Tier 1 court and other rooms unchanged', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-supreme-court' })).toBeNull()
    expect(build({ plan: { ...plan, spaces: [] } })).toBeNull()
    expect(centralCourthouseSurfacePlan(plan, true)).toBe(plan)
    const royalDeck = ship.plans.get('tier-1-b')!
    expect(centralCourthouseSurfacePlan(royalDeck, false)).toBe(royalDeck)
  })

  it('offers the chapter 359 panel view at a walkable camera position', () => {
    const view = mangaViewById('central-courthouse-hearing')!
    expect(view).not.toBeNull()
    expect(view.spaceId).toBe(CENTRAL_COURTHOUSE_SPACE)
    expect(view.chapter).toBe(359)
    expect(view.volume).toBe(34)
    expect(viewsForSpace(CENTRAL_COURTHOUSE_SPACE)).toContain(view)
    expect(pointInPolygon(view.at, court.footprint)).toBe(true)
    for (const wall of plan.walls) {
      const closest = closestPointOnSegment(view.at, wall.start, wall.end)
      expect(Math.hypot(view.at[0] - closest[0], view.at[1] - closest[1])).toBeGreaterThanOrEqual(
        VISITOR_RADIUS,
      )
    }
    expect(view.eyeHeight ?? 1.7).toBeLessThan(ceilingOf(court, plan.tier))
  })
})
