import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildSupremeCourtDetails,
  SUPREME_COURT_SPACE,
  supremeCourtSurfacePlan,
} from './supremeCourtView'
import { MANGA_GENERAL_VIEWS } from './mangaGeneralViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  courtFixtures,
  supremeCourtSpotAnchors,
} from '$lib/components/map/projection/supremeCourtPlan'

const ship = theShip()
const plan = ship.plans.get('tier-1-b')!
const court = ship.spaces.get(SUPREME_COURT_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === SUPREME_COURT_SPACE)
const fixture = (suffix: string) =>
  plan.structures.find(({ id }) => id.startsWith('tier-1-supreme-court-') && id.endsWith(suffix))!

const build = (overrides = {}) =>
  buildSupremeCourtDetails({
    THREE,
    plan,
    spaceId: SUPREME_COURT_SPACE,
    reveal: false,
    ...overrides,
  })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Supreme Court reconstructed from chapters 349, 371, 376 and 379', () => {
  it('satisfies the shared blueprint invariants for the supreme court', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(SUPREME_COURT_SPACE))).toEqual([])
  })

  it('holds the magistrate bench, clerk desks, podium, counsel tables, tiered benches and seal', () => {
    const bench = fixture('-bench')
    const clerkLeft = fixture('-clerk-left')
    const clerkRight = fixture('-clerk-right')
    const podium = fixture('-podium')
    const prosecution = fixture('-prosecution')
    const defence = fixture('-defence')
    const seal = fixture('-seal')

    expect(bench.kind).toBe('counter')
    expect(bench.size[1]).toBeCloseTo(11.4, 2)
    expect(clerkLeft.kind).toBe('table')
    expect(clerkRight.kind).toBe('table')
    expect(podium.kind).toBe('counter')
    expect(prosecution.kind).toBe('table')
    expect(defence.kind).toBe('table')
    expect(seal.kind).toBe('painting')
    expect(seal.sides).toBe(16)

    const galleryBenches = structures.filter(({ id }) => id.includes('-benches-'))
    expect(galleryBenches).toHaveLength(4)
    for (const b of galleryBenches) {
      expect(b.size[0]).toBe(20.9)
    }
  })

  it('keeps solid floor furniture within the court hall and clear of other collision volumes', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const solid of solids) {
      const footprint = structureFootprint(solid)
      expect(
        footprint.every((at) => pointInPolygon(at, court.footprint)),
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

  it('batches finite geometry within the envelope and high-detail budget', () => {
    const root = build()
    expect(root.children.length).toBeGreaterThan(0)
    expect(root.children.length).toBeLessThanOrEqual(2)
    expect(triangles(root)).toBeGreaterThan(10_000)
    expect(triangles(root)).toBeLessThan(200_000)
    expect(root.children.some((child) => child instanceof THREE.Light)).toBe(false)

    for (const mesh of root.children as THREE.Mesh[]) {
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      )
    }

    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(court, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + court.ceiling! + 0.5)
    disposeBanquetDetails(root)
  })

  it('omits details in reveal mode and ignores unrelated spaces', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-banquet-hall' })).toBeNull()
  })

  it('places camera views within the courtroom footprint and clear of solids', () => {
    const courtViews = MANGA_GENERAL_VIEWS.filter((v) => v.spaceId === SUPREME_COURT_SPACE)
    expect(courtViews.length).toBeGreaterThanOrEqual(2)

    for (const view of courtViews) {
      expect(pointInPolygon(view.at, court.footprint)).toBe(true)
      const solids = plan.structures.filter(
        (s) => s.spaceId === SUPREME_COURT_SPACE && s.base === 0,
      )
      for (const solid of solids) {
        expect(pointInPolygon(view.at, structureFootprint(solid)), `${view.id}/${solid.id}`).toBe(
          false,
        )
      }
    }
  })

  it('projects court fixtures and spot anchors correctly into 2D local map', () => {
    expect(courtFixtures.length).toBeGreaterThan(0)
    const cleapatro = supremeCourtSpotAnchors.occupants.cleapatro
    expect(cleapatro.x).toBeGreaterThan(0)
    expect(cleapatro.x).toBeLessThan(100)
    expect(cleapatro.y).toBeGreaterThan(0)
    expect(cleapatro.y).toBeLessThan(100)

    const camilla = supremeCourtSpotAnchors.occupants.camilla
    expect(camilla.x).toBeGreaterThan(0)
    expect(camilla.x).toBeLessThan(100)

    const benchSpot = supremeCourtSpotAnchors.magistrateBench
    expect(benchSpot.x).toBeGreaterThan(0)
    expect(benchSpot.x).toBeLessThan(100)
  })

  it('filters out supreme court structures from walked surface plan except in reveal mode', () => {
    const normalPlan = supremeCourtSurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => s.spaceId === SUPREME_COURT_SPACE)).toBe(false)

    const revealedPlan = supremeCourtSurfacePlan(plan, true)
    expect(revealedPlan.structures.some((s) => s.spaceId === SUPREME_COURT_SPACE)).toBe(true)
  })

  it('releases GPU resources when details are disposed', () => {
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
