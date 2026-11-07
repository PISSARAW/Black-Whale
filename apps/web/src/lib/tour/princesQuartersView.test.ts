import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildPrincesQuartersDetails,
  princesSurfacePlan,
  hasPrincesGateModel,
  PRINCES_GATE_SPACE,
  isPrincesApproach,
  isPrincesCorridor,
} from './princesQuartersView'
import { mangaViewById } from './mangaViews'
import { structureFootprint, pointInPolygon } from './geometry'
import {
  princesGateFixtures,
  princesSpotAnchors,
  PRINCES_GATE_VIEWBOX,
} from '$lib/components/map/projection/princesPlan'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
const gateRoom = ship.spaces.get(PRINCES_GATE_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === PRINCES_GATE_SPACE)

const build = (overrides = {}) =>
  buildPrincesQuartersDetails({
    THREE,
    plan,
    spaceId: PRINCES_GATE_SPACE,
    reveal: false,
    ...overrides,
  })

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe("the princes' quarters and gate reconstructed from chapters 363 and 382", () => {
  it('satisfies the shared blueprint invariants for the princes gate and corridors', () => {
    const issues = validateBlueprint().filter(
      (issue) =>
        issue.includes(PRINCES_GATE_SPACE) || issue.includes('tier-1-royal-residential-corridor'),
    )
    expect(issues).toEqual([])
  })

  it('holds the registration desk in the blueprint with valid dimensions', () => {
    const desk = structures.find(hasPrincesGateModel)
    expect(desk).toBeDefined()
    expect(desk!.kind).toBe('counter')
    expect(desk!.size[0]).toBeGreaterThan(0.5)
    expect(desk!.size[1]).toBeGreaterThan(1.0)
    expect(desk!.height).toBeGreaterThan(0.8)
  })

  it('keeps the desk inside the gate room polygon without overlapping walls', () => {
    const desk = structures.find(hasPrincesGateModel)!
    const footprint = structureFootprint(desk)
    expect(footprint.every((pt) => pointInPolygon(pt, gateRoom.footprint))).toBe(true)
  })

  it('batches finite geometry within the gate envelope and triangle budget', () => {
    const root = build()
    expect(root).not.toBeNull()
    expect(root!.children.length).toBeGreaterThan(0)
    expect(root!.children.length).toBeLessThanOrEqual(2)
    expect(triangles(root!)).toBeLessThan(150_000)

    for (const mesh of root!.children as THREE.Mesh[]) {
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      )
    }

    const bounds = new THREE.Box3().setFromObject(root!)
    const floor = floorOf(gateRoom, plan.tier)
    const ceilingHeight = ceilingOf(gateRoom, plan.tier)

    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + ceilingHeight + 0.05)
    expect(bounds.min.x).toBeGreaterThanOrEqual(13.0 - 0.1)
    expect(bounds.max.x).toBeLessThanOrEqual(16.5 + 0.1)

    disposeBanquetDetails(root!)
  })

  it('omits the interpretation in reveal mode and in unhandled rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-banquet-hall' })).toBeNull()
  })

  it('builds unique detailed models for all 14 individual prince apartment approaches', () => {
    for (let n = 1; n <= 14; n++) {
      const approachId = `tier-1-royal-residential-approach-${1000 + n}`
      expect(isPrincesApproach(approachId)).toBe(true)

      const root = build({ spaceId: approachId })
      expect(root, approachId).not.toBeNull()
      expect(triangles(root!)).toBeGreaterThan(50)
      expect(triangles(root!)).toBeLessThan(50_000)
      disposeBanquetDetails(root!)
    }
  })

  it('builds corridor architecture for front corridors and U-shaped corridors', () => {
    const corridorSpaces = [
      'tier-1-princes-front-corridor-port',
      'tier-1-princes-front-corridor-starboard',
      'tier-1-royal-residential-corridor-port',
      'tier-1-royal-residential-corridor-starboard',
      'tier-1-royal-residential-corridor-aft',
      'tier-1-royal-residential-cross-gap-1',
      'tier-1-royal-residential-back-passage-1',
    ]

    for (const spaceId of corridorSpaces) {
      expect(isPrincesCorridor(spaceId)).toBe(true)
      const root = build({ spaceId })
      expect(root, spaceId).not.toBeNull()
      expect(triangles(root!)).toBeGreaterThan(20)
      disposeBanquetDetails(root!)
    }
  })

  it('filters coarse blueprint desk via princesSurfacePlan in normal mode', () => {
    const rawDesks = plan.structures.filter(hasPrincesGateModel)
    expect(rawDesks.length).toBeGreaterThan(0)

    const filtered = princesSurfacePlan(plan, false)
    const remaining = filtered.structures.filter(hasPrincesGateModel)
    expect(remaining).toHaveLength(0)

    const revealed = princesSurfacePlan(plan, true)
    expect(revealed.structures.filter(hasPrincesGateModel)).toHaveLength(rawDesks.length)
  })

  it('publishes and stages the canonical manga views from chapters 363 and 382', () => {
    const gateView = mangaViewById('princes-quarters-gate-checkpoint')
    expect(gateView).toBeDefined()
    expect(gateView!.chapter).toBe(382)
    expect(gateView!.spaceId).toBe(PRINCES_GATE_SPACE)

    const corridorView = mangaViewById('princely-corridor-perspective')
    expect(corridorView).toBeDefined()
    expect(corridorView!.chapter).toBe(363)
    expect(corridorView!.spaceId).toBe('tier-1-princes-front-corridor-starboard')
  })

  it('anchors gate occupants in the 2D local projection map', () => {
    expect(princesSpotAnchors.occupants['balsamilco-might']).toBeDefined()
    expect(princesSpotAnchors.occupants['prince-halkenburg']).toBeDefined()
    expect(princesGateFixtures.length).toBeGreaterThan(0)

    const deskFixture = princesGateFixtures.find(({ id }) => id.endsWith('-desk'))
    expect(deskFixture).toBeDefined()
    expect(deskFixture!.point.x).toBeGreaterThan(0)
    expect(deskFixture!.point.x).toBeLessThan(PRINCES_GATE_VIEWBOX.width)
  })
})
