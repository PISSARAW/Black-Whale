import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import { structureFootprint } from './geometry'
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

  it('never extrudes a solid to the ceiling the way it does a wall', () => {
    // The faces of a structure are in `plan.walls` so the visitor collides
    // with them. Drawn by the wall pass as well, a bed would come out as a
    // partition from floor to ceiling — which is what a deck full of
    // furniture looked like before the renderer learned to skip them.
    for (const plan of ship.plans.values()) {
      if (!plan.structures.length) continue
      const mesh = buildTierMesh(plan)

      for (const structure of plan.structures) {
        const room = plan.spaces.find((space) => space.id === structure.spaceId)!
        const top = plan.tier.elevation + Math.min(structure.base + structure.height, ceilingOf(room, plan.tier))

        for (const corner of structureFootprint(structure)) {
          for (let i = 0; i < mesh.positions.length; i += 3) {
            const onCorner =
              Math.abs(mesh.positions[i] - corner[0]) < 0.001 &&
              Math.abs(mesh.positions[i + 2] - corner[1]) < 0.001
            if (!onCorner) continue
            expect(
              mesh.positions[i + 1],
              `${structure.id} is drawn as a wall`,
            ).toBeLessThanOrEqual(top + 0.001)
          }
        }
      }
    }
  })

  it('draws a run of bars as uprights you can see between', () => {
    const plan = ship.plans.get('interior-beyond-cell')!
    const grille = plan.structures.filter((structure) => structure.kind === 'bars')
    expect(grille.length).toBeGreaterThan(0)

    const asBars = buildTierMesh(plan).triangles
    const asSlabs = buildTierMesh({
      ...plan,
      // The same runs, told they are cabinets: one box each.
      structures: plan.structures.map((structure) =>
        structure.kind === 'bars' ? { ...structure, kind: 'cabinet' as const } : structure,
      ),
    }).triangles

    // What the room draws with no grille in it at all, so the comparison is
    // between the two ways of drawing the runs and not between two rooms.
    const withoutGrille = buildTierMesh({
      ...plan,
      structures: plan.structures.filter((structure) => structure.kind !== 'bars'),
    }).triangles

    // Two boxes against fifty uprights and the rail over them.
    expect(asBars - withoutGrille).toBeGreaterThan((asSlabs - withoutGrille) * 4)
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
