/**
 * Which rooms of a deck are worth drawing from where the visitor stands.
 *
 * A deck is extruded into one buffer, and until now it was also drawn as one
 * mesh: standing in a four-square-metre cabin, the whole of Tier 1 — a hundred
 * and forty-five metres of it — was rasterised, in `DoubleSide`, behind the
 * wall in front of your nose. Nothing could be culled, because there was
 * nothing to cull: one mesh is one bounding sphere.
 *
 * The fix does not need occlusion queries or a hand-authored portal graph,
 * because the reconstruction already has one. `deriveDoorways` says which rooms
 * open onto which, and a room you cannot reach through a couple of openings is
 * a room you cannot see: the ship has no glass in it. So the visibility set is
 * a breadth-first walk of that graph, and the renderer draws the rooms it
 * names and hides the rest.
 *
 * Nothing here reads three.js. The set is a set of space ids, so the whole
 * decision is testable without a GPU, the way the mesh is.
 */
import type { TierPlan } from './blueprint'

/**
 * How many openings deep the walk goes.
 *
 * One would be the tightest set that is still honest about what is *adjacent*,
 * and it is not enough to be honest about what is *seen*: standing in a cabin,
 * looking through its door, across the corridor and through the door opposite
 * is an everyday thing to do, and at depth one the room on the far side is not
 * drawn — you get a hole where a room should be. Two is the first depth that
 * cannot show one, since a third opening in line is never within the cone a
 * 3 m doorway leaves.
 *
 * It costs what it costs: on Tier 1, depth one names 3.6 rooms of 53 on
 * average and depth two names 14.3. Frustum culling takes most of that back —
 * each room is its own mesh with its own bounding sphere now, which is the
 * other half of what this buys.
 */
export const VIEW_DEPTH = 2

/** The rooms each room opens onto, on one deck. Doorways only: a stair is not a view. */
export function doorGraph(plan: TierPlan): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  for (const space of plan.spaces) graph.set(space.id, [])
  for (const door of plan.doorways) {
    graph.get(door.a)?.push(door.b)
    graph.get(door.b)?.push(door.a)
  }
  return graph
}

/**
 * The rooms to draw from `from`, or every room on the deck when the visitor is
 * nowhere in particular — out in the hull, or between two footprints.
 *
 * Drawing everything is the safe answer to "I do not know where you are": a
 * frame that costs too much is a worse bug than a frame that is wrong, but a
 * frame that is wrong is still a bug.
 */
export function visibleSpaces(
  plan: TierPlan,
  from: string | null,
  depth: number = VIEW_DEPTH,
): Set<string> {
  const everything = () => new Set(plan.spaces.map((space) => space.id))
  if (!from) return everything()

  const graph = doorGraph(plan)
  if (!graph.has(from)) return everything()

  const seen = new Set([from])
  let ring = [from]
  for (let step = 0; step < depth && ring.length; step++) {
    const next: string[] = []
    for (const id of ring) {
      for (const neighbour of graph.get(id) ?? []) {
        if (seen.has(neighbour)) continue
        seen.add(neighbour)
        next.push(neighbour)
      }
    }
    ring = next
  }
  return seen
}
