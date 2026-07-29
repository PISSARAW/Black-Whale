import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import { buildTierMesh, colourFor } from './mesh'

const ship = buildShip()

describe('buildTierMesh', () => {
  it('builds a mesh for every deck', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      expect(mesh.triangles, `${tierId} produced no geometry`).toBeGreaterThan(0)
      expect(mesh.positions.length).toBe(mesh.triangles * 9)
      expect(mesh.normals.length).toBe(mesh.positions.length)
      expect(mesh.colors.length).toBe(mesh.positions.length)
    }
  })

  it('never emits a coordinate that is not a number', () => {
    for (const plan of ship.plans.values()) {
      const mesh = buildTierMesh(plan)
      expect(mesh.positions.every(Number.isFinite)).toBe(true)
      expect(mesh.normals.every(Number.isFinite)).toBe(true)
    }
  })

  it('keeps every vertex between the deck floor and its tallest ceiling', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const tallest = Math.max(...plan.spaces.map((space) => ceilingOf(space, plan.tier)))

      for (let i = 1; i < mesh.positions.length; i += 3) {
        const y = mesh.positions[i]
        expect(y, `${tierId} has geometry below its floor`).toBeGreaterThanOrEqual(
          plan.tier.elevation - 0.001,
        )
        expect(y, `${tierId} has geometry above its ceiling`).toBeLessThanOrEqual(
          plan.tier.elevation + tallest + 0.001,
        )
      }
    }
  })

  it('gives the tallest hall on Tier 1 a ceiling above the corridors', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    let highest = -Infinity
    for (let i = 1; i < mesh.positions.length; i += 3) highest = Math.max(highest, mesh.positions[i])
    expect(highest).toBeCloseTo(plan.tier.elevation + 9)
  })
})

describe('the solids standing in the rooms', () => {
  it('raises the springs to their own height, not the room floor', () => {
    const plan = ship.plans.get('interior-hull-suspension')!
    const mesh = buildTierMesh(plan)
    const tallest = Math.max(...plan.structures.map((structure) => structure.height))

    let highest = -Infinity
    for (let i = 1; i < mesh.positions.length; i += 3) highest = Math.max(highest, mesh.positions[i])
    expect(highest).toBeGreaterThanOrEqual(plan.tier.elevation + tallest)
  })

  it('draws more geometry for a room with something in it', () => {
    const withCoffins = buildTierMesh(ship.plans.get('tier-1')!).triangles
    const empty = buildTierMesh({
      ...ship.plans.get('tier-1')!,
      structures: [],
    }).triangles
    expect(withCoffins).toBeGreaterThan(empty)
  })
})

describe('colourFor', () => {
  const base = [0.5, 0.5, 0.5] as const

  it('leaves plan-sourced geometry as it is', () => {
    expect(colourFor(base, 'plan')).toEqual([0.5, 0.5, 0.5])
  })

  it('brightens what a panel actually shows', () => {
    expect(colourFor(base, 'panel')[0]).toBeGreaterThan(0.5)
  })

  it('cools down anything the reconstruction invented', () => {
    const inferred = colourFor(base, 'inferred')
    // Cold means the blue channel outweighs the red one.
    expect(inferred[2]).toBeGreaterThan(inferred[0])
  })
})
