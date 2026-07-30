import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import { structureFootprint } from './geometry'
import { buildTierMesh, colourFor } from './mesh'

const ship = buildShip()

/**
 * The reveal repaints the ship; it must never rebuild it. A visitor who turns
 * the evidence on has to be looking at the same walls, in the same places, or
 * the overlay has stopped being an overlay and become a second reconstruction.
 */
describe('the reveal', () => {
  it('changes what every level says and not one triangle of it', () => {
    for (const [tierId, plan] of ship.plans) {
      const plain = buildTierMesh(plan)
      const shown = buildTierMesh(plan, { reveal: true })

      expect(shown.triangles, `${tierId} was rebuilt`).toBe(plain.triangles)
      expect([...shown.positions], `${tierId} moved`).toEqual([...plain.positions])
      expect([...shown.edges], `${tierId} was redrawn`).toEqual([...plain.edges])
      expect(shown.groups.map((group) => group.spaceId)).toEqual(
        plain.groups.map((group) => group.spaceId),
      )
      // Only the colours, and on any level worth revealing they do differ.
      if (plan.spaces.length > 1) {
        expect([...shown.colors], `${tierId} says the same thing revealed`).not.toEqual([
          ...plain.colors,
        ])
      }
    }
  })

  it('paints the walls a seal keeps blind, on the levels that have them', () => {
    // 0xef3340 through the same sRGB transfer the mesh applies to every colour.
    const toLinear = (channel: number) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    const blind = [0xef, 0x33, 0x40].map((channel) => toLinear(channel / 255))

    const sealed = [...ship.plans.values()].filter((plan) => plan.blind.length > 0)
    expect(sealed.length, 'no level declares a blind wall').toBeGreaterThan(0)

    for (const plan of sealed) {
      const colors = buildTierMesh(plan, { reveal: true }).colors
      let found = false
      for (let i = 0; i < colors.length; i += 3) {
        if (
          Math.abs(colors[i] - blind[0]) < 1e-6 &&
          Math.abs(colors[i + 1] - blind[1]) < 1e-6 &&
          Math.abs(colors[i + 2] - blind[2]) < 1e-6
        ) {
          found = true
          break
        }
      }
      expect(found, `${plan.tier.id} declares a blind wall and does not show it`).toBe(true)
    }
  })
})

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

  /**
   * The blueprint is hand-edited, and nothing in it is bounded: a room given
   * eight hundred solids, or a grille run the length of a deck, arrives as
   * geometry with no complaint from anywhere. These are the ceilings — set at
   * roughly twice what the ship currently draws, so ordinary additions pass and
   * an order of magnitude does not.
   */
  const MAX_DECK_TRIANGLES = 15_000
  const MAX_DECK_BYTES = 1_600_000
  /**
   * One room, which is now one draw call and one bounding sphere. The banquet
   * hall — its columns, its stage, its dais and its tables — is the largest at
   * about 3,500.
   */
  const MAX_ROOM_TRIANGLES = 8_000

  it('keeps every deck within the budget the walk is built for', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const bytes =
        mesh.positions.byteLength +
        mesh.normals.byteLength +
        mesh.colors.byteLength +
        mesh.edges.byteLength

      expect(mesh.triangles, `${tierId} extrudes too much`).toBeLessThanOrEqual(MAX_DECK_TRIANGLES)
      expect(bytes, `${tierId} is too many bytes of buffer`).toBeLessThanOrEqual(MAX_DECK_BYTES)

      for (const group of mesh.groups) {
        expect(
          group.count / 3,
          `${group.spaceId} is too much geometry for one room`,
        ).toBeLessThanOrEqual(MAX_ROOM_TRIANGLES)
      }
    }
  })

  it('cuts every deck into rooms that tile its buffers exactly', () => {
    for (const [tierId, plan] of ship.plans) {
      const mesh = buildTierMesh(plan)
      const ids = new Set(plan.spaces.map((space) => space.id))

      let vertices = 0
      let edgePoints = 0
      for (const group of mesh.groups) {
        expect(ids, `${tierId} groups geometry under an unknown room`).toContain(group.spaceId)
        // Contiguous and in order: a room drawn by a draw range cannot have its
        // triangles scattered through the buffer.
        expect(group.start, `${group.spaceId} does not follow the room before it`).toBe(vertices)
        expect(group.edgeStart).toBe(edgePoints)
        vertices += group.count
        edgePoints += group.edgeCount
      }
      expect(vertices, `${tierId} has geometry belonging to no room`).toBe(
        mesh.positions.length / 3,
      )
      expect(edgePoints).toBe(mesh.edges.length / 3)
    }
  })

  it('measures each room its own bounding sphere rather than the whole deck', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)

    for (const group of mesh.groups) {
      // Every vertex of the room is inside the sphere the renderer culls with.
      for (let i = group.start * 3; i < (group.start + group.count) * 3; i += 3) {
        const distance = Math.hypot(
          mesh.positions[i] - group.centre[0],
          mesh.positions[i + 1] - group.centre[1],
          mesh.positions[i + 2] - group.centre[2],
        )
        expect(
          distance,
          `${group.spaceId} has geometry outside its own sphere`,
        ).toBeLessThanOrEqual(group.radius + 0.001)
      }
    }

    // And no room's sphere is the deck's: a bounding sphere around all of Tier 1
    // is what could not be culled in the first place.
    const deckRadius = Math.max(...mesh.groups.map((group) => group.radius))
    const median = [...mesh.groups.map((group) => group.radius)].sort((a, b) => a - b)[
      Math.floor(mesh.groups.length / 2)
    ]
    expect(median).toBeLessThan(deckRadius / 2)
  })

  it('gives the tallest hall on Tier 1 a ceiling above the corridors', () => {
    const plan = ship.plans.get('tier-1')!
    const mesh = buildTierMesh(plan)
    let highest = -Infinity
    for (let i = 1; i < mesh.positions.length; i += 3)
      highest = Math.max(highest, mesh.positions[i])
    expect(highest).toBeCloseTo(plan.tier.elevation + 9)
  })
})

describe('the solids standing in the rooms', () => {
  it('raises the springs to their own height, not the room floor', () => {
    const plan = ship.plans.get('interior-hull-suspension')!
    const mesh = buildTierMesh(plan)
    const tallest = Math.max(...plan.structures.map((structure) => structure.height))

    let highest = -Infinity
    for (let i = 1; i < mesh.positions.length; i += 3)
      highest = Math.max(highest, mesh.positions[i])
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
        const top =
          plan.tier.elevation +
          Math.min(structure.base + structure.height, ceilingOf(room, plan.tier))

        for (const corner of structureFootprint(structure)) {
          for (let i = 0; i < mesh.positions.length; i += 3) {
            const onCorner =
              Math.abs(mesh.positions[i] - corner[0]) < 0.001 &&
              Math.abs(mesh.positions[i + 2] - corner[1]) < 0.001
            if (!onCorner) continue
            expect(mesh.positions[i + 1], `${structure.id} is drawn as a wall`).toBeLessThanOrEqual(
              top + 0.001,
            )
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
