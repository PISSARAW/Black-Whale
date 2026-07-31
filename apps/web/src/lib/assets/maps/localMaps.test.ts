import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blueprint, buildShip } from '../../tour/blueprint'
import type { Space } from '../../tour/types'

/**
 * The hand-drawn room plans, held to the blueprint the way the deck plans are.
 *
 * `deckMaps.test.ts` covers the five plans `scripts/generate-deck-maps.py`
 * writes: they are generated, so they can only drift by someone forgetting to
 * rerun the generator, and the test catches that. The plans under `local/` are
 * drawn by hand, which is a stronger reason to check them and not a weaker one —
 * nothing regenerates them at all.
 *
 * The observation deck is what made that concrete. Ch. 358's annotated cutaway
 * moved the room to the bow and the blueprint followed; the drawing kept the aft
 * footprint it had been given, and for as long as that stood `/ship` showed a
 * square room off a corridor while `/tour` walked a crescent across the bow.
 * Both called themselves the observation deck.
 *
 * One room so far. The other thirty local plans are drawings of rooms the
 * blueprint gives no interior for — a hospital ward, a cineplex concourse — and
 * holding those to a footprint would be holding them to something the
 * reconstruction does not claim. This is for the ones that do draw a room the
 * walk also walks.
 */

const ship = buildShip()

const source = readFileSync(new URL('./local/observation-deck.svelte', import.meta.url), 'utf8')

/** Every `[a, b]` pair inside a named literal, in the order it is written. */
function pairs(name: string): [number, number][] {
  const block = source.match(new RegExp(`const ${name}[^=]*=\\s*\\[([\\s\\S]*?)\\n\\s*\\]`))
  if (!block) throw new Error(`${name} is not drawn`)
  return [...block[1].matchAll(/\[\s*(-?[\d.]+),\s*(-?[\d.]+),?\s*\]/g)].map((match) => [
    Number(match[1]),
    Number(match[2]),
  ])
}

/** A `{ key: [a, b], ... }` literal, for the bay and the doorway. */
function fields(name: string): Record<string, [number, number]> {
  const block = source.match(new RegExp(`const ${name}\\s*=\\s*\\{([^}]*)\\}`))
  if (!block) throw new Error(`${name} is not drawn`)
  const out: Record<string, [number, number]> = {}
  for (const match of block[1].matchAll(/(\w+):\s*\[\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\]/g)) {
    out[match[1]] = [Number(match[2]), Number(match[3])]
  }
  return out
}

describe('the observation deck plan', () => {
  const space = blueprint.spaces.find((entry) => entry.id === 'tier-3-observation-deck') as Space

  it('draws the room the blueprint puts at the bow, corner for corner', () => {
    expect(pairs('footprint')).toEqual(space.footprint.map(([x, z]) => [x, z]))
  })

  it('puts the bay where the blueprint stands it, at the size it gives it', () => {
    const structure = blueprint.structures.find(
      (entry) => entry.id === 'tier-3-observation-deck-window',
    )!
    const bay = fields('bay')
    expect(bay.at).toEqual([structure.at[0], structure.at[1]])
    expect(bay.size).toEqual([structure.size[0], structure.size[1]])
  })

  it('draws the doorway the walk derives, and only that one', () => {
    const plan = ship.plans.get('tier-3')!
    const doors = plan.doorways.filter((entry) => entry.a === space.id || entry.b === space.id)
    // One neighbour on the whole deck: the promenade behind it. A second door on
    // the plan would be a way out of the room the walk does not have.
    expect(doors).toHaveLength(1)
    expect(ship.adjacency.get(space.id)).toEqual(['tier-3-port-promenade'])

    const door = fields('door')
    expect([door.from, door.to]).toEqual([
      [doors[0].start[0], doors[0].start[1]],
      [doors[0].end[0], doors[0].end[1]],
    ])
  })

  it('states the room the blueprint measures, and not the one it used to draw', () => {
    const xs = space.footprint.map(([x]) => x)
    const zs = space.footprint.map(([, z]) => z)
    const across = Math.max(...zs) - Math.min(...zs)
    const deep = Math.max(...xs) - Math.min(...xs)

    // The figures in the caption, in the file's own decimal comma. The old plan
    // said 66,5 × 38,5 — a room off a corridor — and said it for months.
    expect(source).toContain(`${across.toString().replace('.', ',')} m across the bow`)
    expect(source).toContain(`${deep} m deep`)
    expect(source).toContain(`${space.ceiling} m deckhead`)
  })
})
