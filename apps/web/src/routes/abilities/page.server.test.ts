import { describe, expect, it } from 'vitest'
import type { Cookies } from '@sveltejs/kit'
import { loadAbilityVisibility } from '$lib/server/ability-visibility'
import { SPOILER_COOKIE } from '$lib/server/spoiler'
import { load } from './+page.server'

/**
 * The cap, tested where it is applied rather than where it is decided.
 *
 * `ability-visibility.test.ts` already proves the index answers correctly.
 * That is not the failure this route had: the page used to enumerate the
 * client-side registry, so every technique in the archive reached the browser
 * whatever the reader had asked for, while a perfectly good filter sat unused
 * one import away. ADR-001 §1.3 F names the shape of it — the cap is applied by
 * hand in each loader, and one forgetting is one leak — so what needs holding
 * is the *wiring*, and only a test of the loader holds that.
 */

/** Just enough of a cookie jar for a loader that only ever reads one. */
function cookiesWith(cap: number | undefined): Cookies {
  return {
    get: (name: string) => (name === SPOILER_COOKIE && cap !== undefined ? String(cap) : undefined),
  } as unknown as Cookies
}

/** The loader takes an event; this one only ever touches `cookies`. */
function run(cap: number | undefined) {
  return load({ cookies: cookiesWith(cap) } as never)
}

describe('the abilities page and the reader who asked not to be spoiled', () => {
  it('lists the whole catalogue when no cap is set', async () => {
    const { abilities, spoilerLimit } = await run(undefined)

    expect(spoilerLimit).toBeNull()
    expect(abilities.length).toBeGreaterThan(0)
  })

  it('never sends an ability the cap withholds', async () => {
    const cap = 350
    const visibility = await loadAbilityVisibility()
    const { abilities, spoilerLimit } = await run(cap)

    expect(spoilerLimit).toBe(cap)
    for (const ability of abilities) {
      expect(visibility.isVisible(ability.id, cap), ability.id).toBe(true)
    }
  })

  it('withholds strictly more as the cap falls', async () => {
    const [everything, late, early] = await Promise.all([run(undefined), run(400), run(100)])

    // Not just "fewer": each is a subset of the one above it, which is what
    // makes the cap a reading position rather than a filter with moods.
    const ids = (result: { abilities: { id: string }[] }) =>
      new Set(result.abilities.map((ability) => ability.id))
    const [all, someIds, fewIds] = [ids(everything), ids(late), ids(early)]

    expect(fewIds.size).toBeLessThan(someIds.size)
    expect(someIds.size).toBeLessThanOrEqual(all.size)
    for (const id of fewIds) expect(someIds.has(id), id).toBe(true)
    for (const id of someIds) expect(all.has(id), id).toBe(true)
  })

  it('treats a cookie that is not a chapter number as no cap at all', async () => {
    // The cookie is client-controlled. `NaN` used to reach the comparison,
    // where every answer is false — a reader could empty the page by editing it.
    const junk = load({
      cookies: { get: () => 'not-a-number' } as unknown as Cookies,
    } as never)

    expect((await junk).abilities.length).toBe((await run(undefined)).abilities.length)
  })
})
