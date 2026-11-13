import { describe, expect, it } from 'vitest'
import type { Cookies } from '@sveltejs/kit'
import { SPOILER_COOKIE } from '$lib/server/spoiler'
import { load } from './+page.server'

function cookiesWith(cap?: number): Cookies {
  return {
    get: (name: string) => (name === SPOILER_COOKIE && cap !== undefined ? String(cap) : undefined),
  } as unknown as Cookies
}

async function run(cap?: number) {
  return (await load({
    cookies: cookiesWith(cap),
    url: new URL('http://localhost/characters'),
  } as never)) as unknown as {
    characters: Array<{
      id: string
      description?: string
      firstAppearanceChapterId?: string | null
    }>
  }
}

describe('the character registry spoiler boundary', () => {
  it('does not serialize characters introduced after the reader cap', async () => {
    const { characters } = await run(340)

    expect(characters.some((character) => character.id === 'kurapika')).toBe(true)
    expect(characters.some((character) => character.id === 'prince-benjamin')).toBe(false)
    expect(characters.some((character) => character.id === 'komiya')).toBe(false)
    expect(characters.every((character) => character.description === undefined)).toBe(true)
  })

  it('keeps the full registry when no cap is configured', async () => {
    const { characters } = await run()
    expect(characters.some((character) => character.id === 'komiya')).toBe(true)
    expect(characters.some((character) => character.description)).toBe(true)
  })

  it('keeps the serialized registry below the discovery payload budget', async () => {
    const { characters } = await run()
    expect(Buffer.byteLength(JSON.stringify(characters), 'utf8')).toBeLessThan(150_000)
  })
})
