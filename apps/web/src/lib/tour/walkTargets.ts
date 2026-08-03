/**
 * Where the walk opens, for each room the map can select.
 *
 * `/ship` offers one link into the reconstruction — "the same room, on foot" —
 * and answering it used to cost the whole blueprint in the browser: a 930 kB
 * chunk pulled into the page so that `spaceForLocation` could pick one id out
 * of it. Nothing else on that page reads the ship.
 *
 * So the answer is computed on the server, where the blueprint already is, and
 * sent as what it is: a few hundred short strings. The rule itself does not
 * move — this calls the same `spaceForLocation` — because a second way of
 * choosing which room to arrive in is exactly the kind of duplicate ADR-001 is
 * about.
 */
import { spaceForLocation, type Ship } from './blueprint'

/** Every slug the map could resolve to: the ids the blueprint uses, and their tails. */
function candidateSlugs(ship: Ship): Set<string> {
  const slugs = new Set<string>()
  for (const space of ship.blueprint.spaces) {
    const id = space.locationId
    if (!id) continue
    slugs.add(id)
    // The deck SVGs name their regions in their own vocabulary and `/ship`
    // resolves those to catalogue ids, which are often the tail of the
    // blueprint's own. That is the last resort `spaceForLocation` falls back
    // to; enumerating it here is what keeps the two in step.
    const parts = id.split('-')
    for (let index = 1; index < parts.length; index += 1) slugs.add(parts.slice(index).join('-'))
  }
  return slugs
}

export function walkTargetsByLocation(ship: Ship): Record<string, string> {
  const targets: Record<string, string> = {}
  for (const slug of candidateSlugs(ship)) {
    const space = spaceForLocation(ship, slug)
    if (space) targets[slug] = space.id
  }
  return targets
}
