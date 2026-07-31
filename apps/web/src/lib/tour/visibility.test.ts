import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { buildTierMesh } from './mesh'
import { VIEW_DEPTH, doorGraph, visibleSpaces } from './visibility'

const ship = buildShip()
const decks = [...ship.plans.values()].filter((plan) => plan.tier.kind === 'deck')

describe('the door graph', () => {
  it('is symmetric: a door is a door from either side', () => {
    for (const plan of ship.plans.values()) {
      const graph = doorGraph(plan)
      for (const [id, neighbours] of graph) {
        for (const neighbour of neighbours) {
          expect(graph.get(neighbour), `${id} → ${neighbour} is one-way`).toContain(id)
        }
      }
    }
  })

  it('names every space on the deck, doors or no doors', () => {
    for (const plan of ship.plans.values()) {
      expect(doorGraph(plan).size).toBe(plan.spaces.length)
    }
  })
})

describe('what is drawn from where the visitor stands', () => {
  it('always holds the room underfoot and everything it opens onto', () => {
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const seen = visibleSpaces(plan, space.id)
        expect(seen, `${space.id} does not draw itself`).toContain(space.id)
        for (const door of plan.doorways) {
          if (door.a === space.id) expect(seen).toContain(door.b)
          if (door.b === space.id) expect(seen).toContain(door.a)
        }
      }
    }
  })

  it('draws the whole deck when the visitor is nowhere in particular', () => {
    for (const plan of ship.plans.values()) {
      expect(visibleSpaces(plan, null).size).toBe(plan.spaces.length)
      expect(visibleSpaces(plan, 'a-room-on-another-deck').size).toBe(plan.spaces.length)
    }
  })

  it('reaches no further than the depth it is given', () => {
    const plan = ship.plans.get('tier-1')!
    for (const space of plan.spaces) {
      const one = visibleSpaces(plan, space.id, 1)
      const two = visibleSpaces(plan, space.id, 2)
      expect(two.size).toBeGreaterThanOrEqual(one.size)
      for (const id of one) expect(two).toContain(id)
    }
    expect(VIEW_DEPTH).toBeGreaterThanOrEqual(2)
  })

  /**
   * The whole point of the exercise. Before portal culling a deck was one mesh
   * and every frame drew all of it, from anywhere; a ceiling here is what turns
   * "the culling quietly stopped working" into a failing test rather than a
   * frame rate someone notices six months later.
   *
   * The average over every room of a deck, not the worst room: the worst room
   * on Tier 1 is the corridor the whole deck opens onto, and from there most of
   * the deck genuinely is two doorways away.
   */
  /** The share of a deck's triangles drawn from the average room on it. */
  const drawnShare = (plan: (typeof decks)[number]) => {
    const mesh = buildTierMesh(plan)
    const perSpace = new Map(mesh.groups.map((group) => [group.spaceId, group.count / 3]))
    const shares = plan.spaces.map((space) => {
      let triangles = 0
      for (const id of visibleSpaces(plan, space.id)) triangles += perSpace.get(id) ?? 0
      return triangles / mesh.triangles
    })
    return shares.reduce((sum, share) => sum + share, 0) / shares.length
  }

  /** How many doorways apart the two furthest rooms of a deck are. */
  const spread = (plan: (typeof decks)[number]) => {
    const graph = doorGraph(plan)
    let worst = 0
    for (const start of graph.keys()) {
      const depth = new Map([[start, 0]])
      const queue = [start]
      while (queue.length) {
        const here = queue.shift()!
        for (const next of graph.get(here) ?? []) {
          if (depth.has(next)) continue
          depth.set(next, depth.get(here)! + 1)
          queue.push(next)
        }
      }
      worst = Math.max(worst, ...depth.values())
    }
    return worst
  }

  /**
   * A deck narrower than the view is exempt, and that is not the culling
   * failing. Tier 4-B is one office and the passage that reaches it; tier 5-B
   * is a spine with the cabins off it. Every room on such a deck is within
   * `VIEW_DEPTH` doorways of every other by construction, so there is nothing
   * there to hide and a ceiling would be a ceiling on the data rather than on
   * what the renderer does with it.
   */
  it('never draws a whole deck from inside one of its rooms', () => {
    for (const plan of decks) {
      if (spread(plan) <= VIEW_DEPTH) continue
      expect(drawnShare(plan), `${plan.tier.id} is drawn whole from anywhere on it`).toBeLessThan(1)
    }
  })

  /**
   * Tier 1 is the deck the exercise is about: 53 rooms over 145 metres, all of
   * which used to be rasterised from inside a four-square-metre cabin. The
   * smaller decks are a dozen rooms of open plan and there is little there to
   * cull — a ceiling on them would only be a ceiling on the data.
   */
  it('leaves most of Tier 1 undrawn, room for room', () => {
    const plan = ship.plans.get('tier-1')!
    const seen = plan.spaces.map((space) => visibleSpaces(plan, space.id).size)
    const average = seen.reduce((total, count) => total + count, 0) / seen.length
    expect(average / plan.spaces.length).toBeLessThan(0.45)
    expect(drawnShare(plan)).toBeLessThan(0.55)
  })
})
