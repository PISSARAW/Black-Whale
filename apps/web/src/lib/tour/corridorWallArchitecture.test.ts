import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip } from './blueprint'
import {
  corridorWallRuns,
  tierOfSpace,
  wallBays,
  wallPoint,
  type CorridorWallRun,
} from './corridorWallLayout'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { dressTier1CorridorWall } from './corridorWallTier1'
import { dressTier2CorridorWall } from './corridorWallTier2'
import { dressTier3CorridorWall } from './corridorWallTier3'
import { dressTier4CorridorWall } from './corridorWallTier4'
import { dressTier5CorridorWall } from './corridorWallTier5'
import { buildCorridorWallDetails, isCorridorSpace } from './corridorWallView'

const ship = theShip()

describe('corridorWallLayout', () => {
  it('correctly identifies tier from space id or fallback', () => {
    expect(tierOfSpace('tier-1-main-corridor')).toBe(1)
    expect(tierOfSpace('tier-2-forward-corridor')).toBe(2)
    expect(tierOfSpace('tier-3-central-spine')).toBe(3)
    expect(tierOfSpace('tier-4-central-passage')).toBe(4)
    expect(tierOfSpace('tier-5-main-corridor')).toBe(5)
    expect(tierOfSpace('custom-space', 'tier-3-b')).toBe(3)
  })

  it('filters and segments corridor walls', () => {
    const plan = ship.plans.get('tier-1')!
    const space = plan.spaces.find((s) => s.id === 'tier-1-main-corridor')
    expect(space).toBeDefined()
    if (!space) return

    const runs = corridorWallRuns(plan, space)
    expect(runs.length).toBeGreaterThan(0)
    for (const run of runs) {
      expect(run.length).toBeGreaterThanOrEqual(1.4)
      const dot = run.tangent[0] * run.inward[0] + run.tangent[1] * run.inward[1]
      expect(Math.abs(dot)).toBeLessThan(0.01)
    }
  })

  it('computes bays and 3D wall points along runs', () => {
    const run: CorridorWallRun = {
      start: [0, 0],
      tangent: [1, 0],
      inward: [0, 1],
      length: 10.0,
      angle: 0,
    }
    const bays = wallBays(run, 3.0)
    expect(bays.length).toBe(3)
    const pt = wallPoint(run, { along: 5.0, y: 1.5, inset: 0.1 })
    expect(pt[0]).toBeCloseTo(5.0)
    expect(pt[1]).toBeCloseTo(1.5)
    expect(pt[2]).toBeCloseTo(0.1)
  })
})

describe('isCorridorSpace', () => {
  it('identifies corridor spaces and excludes specialized gates/approaches', () => {
    expect(isCorridorSpace('tier-1-main-corridor', 'corridor')).toBe(true)
    expect(isCorridorSpace('tier-2-main-corridor', 'corridor')).toBe(true)
    expect(isCorridorSpace('tier-3-central-spine', 'corridor')).toBe(true)
    expect(isCorridorSpace('tier-4-central-passage', 'corridor')).toBe(true)
    expect(isCorridorSpace('tier-5-main-corridor', 'corridor')).toBe(true)

    // Excluded bespoke spaces
    expect(isCorridorSpace('tier-1-princes-quarters-gate', 'corridor')).toBe(false)
    expect(isCorridorSpace('tier-1-royal-residential-approach-1001', 'corridor')).toBe(false)
    expect(isCorridorSpace('tier-1-royal-residential-approach-1014', 'corridor')).toBe(false)

    // Regular non-corridor rooms
    expect(isCorridorSpace('tier-1-banquet-hall', 'public')).toBe(false)
    expect(isCorridorSpace('tier-2-ministry-of-justice', 'administrative')).toBe(false)
  })
})

describe('Tier-specific corridor wall builders', () => {
  const dummyRun: CorridorWallRun = {
    start: [0, 0],
    tangent: [1, 0],
    inward: [0, 1],
    length: 8.0,
    angle: 0,
  }

  it('dresses Tier 1 wall with wainscoting and sconces', () => {
    const into = new BanquetDetailBuilder(THREE)
    dressTier1CorridorWall({ into, run: dummyRun }, { floor: 0, ceiling: 3.5 })
    const group = into.finish('tier-1-test')
    expect(group.children.length).toBeGreaterThan(0)
  })

  it('dresses Tier 2 wall with bumper rails and intercoms', () => {
    const into = new BanquetDetailBuilder(THREE)
    dressTier2CorridorWall({ into, run: dummyRun }, { floor: 0, ceiling: 3.2 })
    const group = into.finish('tier-2-test')
    expect(group.children.length).toBeGreaterThan(0)
  })

  it('dresses Tier 3 wall with cabin doors and handrails', () => {
    const into = new BanquetDetailBuilder(THREE)
    dressTier3CorridorWall({ into, run: dummyRun }, { floor: 0, ceiling: 3.0 })
    const group = into.finish('tier-3-test')
    expect(group.children.length).toBeGreaterThan(0)
  })

  it('dresses Tier 4 wall with stiffeners, conduits and hazard stripes', () => {
    const into = new BanquetDetailBuilder(THREE)
    dressTier4CorridorWall({ into, run: dummyRun }, { floor: 0, ceiling: 3.2 })
    const group = into.finish('tier-4-test')
    expect(group.children.length).toBeGreaterThan(0)
  })

  it('dresses Tier 5 wall with colossal web frames, stringers and ducts', () => {
    const into = new BanquetDetailBuilder(THREE)
    dressTier5CorridorWall({ into, run: dummyRun }, { floor: 0, ceiling: 4.5 })
    const group = into.finish('tier-5-test')
    expect(group.children.length).toBeGreaterThan(0)
  })
})

describe('buildCorridorWallDetails', () => {
  it('generates 3D corridor wall groups on each deck of the ship', () => {
    const testCases = [
      { deck: 'tier-1', spaceId: 'tier-1-main-corridor' },
      { deck: 'tier-2', spaceId: 'tier-2-main-corridor' },
      { deck: 'tier-3', spaceId: 'tier-3-central-spine' },
      { deck: 'tier-4', spaceId: 'tier-4-central-passage' },
      { deck: 'tier-5', spaceId: 'tier-5-main-corridor' },
    ]

    for (const { deck, spaceId } of testCases) {
      const plan = ship.plans.get(deck)!
      const group = buildCorridorWallDetails({
        THREE,
        plan,
        spaceId,
        reveal: false,
      })
      expect(group).not.toBeNull()
      expect(group?.name).toBe(`corridor-walls-${spaceId}`)
      expect(group?.children.length).toBeGreaterThan(0)

      const mesh = group?.children[0] as THREE.Mesh
      expect(mesh.isMesh).toBe(true)
      const positions = mesh.geometry.getAttribute('position')
      expect(positions.count).toBeGreaterThan(0)
    }
  })

  it('returns null for non-corridor rooms', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildCorridorWallDetails({
      THREE,
      plan,
      spaceId: 'tier-1-banquet-hall',
      reveal: false,
    })
    expect(group).toBeNull()
  })
})
