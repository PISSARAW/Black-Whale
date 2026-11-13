import { describe, expect, it } from 'vitest'
import type { Cookies } from '@sveltejs/kit'
import { SPOILER_COOKIE } from '$lib/server/spoiler'
import { load } from './+page.server'

const cookiesWith = (cap?: number) =>
  ({
    get: (name: string) => (name === SPOILER_COOKIE && cap !== undefined ? String(cap) : undefined),
  }) as unknown as Cookies

async function run(slug: string, cap?: number) {
  return load({
    params: { slug },
    cookies: cookiesWith(cap),
    url: new URL(`https://exploreblackwhale.com/abilities/${slug}`),
  } as never)
}

describe('ability detail publication boundary', () => {
  it('serves a source-backed record with related entities', async () => {
    const data = (await run('bungee-gum')) as any
    expect(data.ability.id).toBe('bungee-gum')
    expect(data.ability.sources.length).toBeGreaterThan(0)
    expect(data.owner.id).toBe('hisoka')
  })

  it('returns the same 404 for unknown and spoiler-hidden abilities', async () => {
    await expect(run('not-real')).rejects.toMatchObject({ status: 404 })
    await expect(run('stand-by-me', 413)).rejects.toMatchObject({ status: 404 })
  })

  it('prepares French catalogue prose rather than silently dropping localization', async () => {
    const data = (await load({
      params: { slug: 'bungee-gum' },
      cookies: cookiesWith(),
      url: new URL('https://exploreblackwhale.com/fr/abilities/bungee-gum'),
    } as never)) as any
    expect(data.localizedContent[data.ability.description]).toMatch(/aura|caoutchouc/i)
  })
})
