import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ROUTE = 'apps/web/src/routes/tour/+page.svelte'
const EXPERIENCE = 'apps/web/src/routes/tour/TourPageExperience.svelte'

describe('the tour loading boundary', () => {
  it('keeps the blueprint-bearing experience out of the route entry', () => {
    const route = readFileSync(ROOT + ROUTE, 'utf8')
    expect(route).toContain("import('./TourPageExperience.svelte')")
    expect(route).not.toMatch(/^\s*import\s+.*TourPageExperience/m)
    expect(route.split(/\r?\n/).length).toBeLessThanOrEqual(80)
  })

  it('keeps the moved experience byte-identical to its baseline', () => {
    const experience = readFileSync(ROOT + EXPERIENCE, 'utf8')
    expect(experience).toContain('import { crossingsOn, deckOf, theShip')
    expect(experience).toContain('const ship = theShip()')
  })
})
