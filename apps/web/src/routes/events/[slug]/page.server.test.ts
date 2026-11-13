import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cookies } from '@sveltejs/kit'
import { SPOILER_COOKIE } from '$lib/server/spoiler'

const { findEvent, findLocation, findCharacters } = vi.hoisted(() => ({
  findEvent: vi.fn(),
  findLocation: vi.fn(),
  findCharacters: vi.fn(),
}))

vi.mock('$lib/server/db', () => ({
  prisma: {
    narrativeEvent: { findUnique: findEvent },
    location: { findUnique: findLocation },
    character: { findMany: findCharacters },
  },
}))

import { load } from './+page.server'

const slug = 'ch-345-tserriednich-is-revealed-as-a-serial-killer'
const cookiesWith = (cap?: number) =>
  ({
    get: (name: string) => (name === SPOILER_COOKIE && cap !== undefined ? String(cap) : undefined),
  }) as unknown as Cookies

const run = (candidate = slug, cap?: number) =>
  load({
    params: { slug: candidate },
    cookies: cookiesWith(cap),
    url: new URL(`https://exploreblackwhale.com/events/${candidate}`),
  } as never)

describe('event detail publication boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findEvent.mockResolvedValue({
      id: 'database-event',
      sourceId: slug,
      ordinal: 1,
      occurredAtLabel: null,
      occurredAtBasis: null,
      occurredAtSource: null,
      locationId: null,
      participations: [],
      chapter: { number: 345 },
    })
    findLocation.mockResolvedValue(null)
    findCharacters.mockResolvedValue([])
  })

  it('serves a stable, source-backed public event', async () => {
    const data = (await run()) as {
      event: { id: string; sources: Array<{ chapterId: string }> }
      chronology: { databaseId: string }
    }
    expect(data.event.id).toBe(slug)
    expect(data.event.sources).toEqual([{ chapterId: 'ch-345' }])
    expect(data.chronology.databaseId).toBe('database-event')
  })

  it('returns 404 before touching the database when the event is hidden', async () => {
    await expect(run(slug, 344)).rejects.toMatchObject({ status: 404 })
    expect(findEvent).not.toHaveBeenCalled()
  })

  it('uses the same 404 for an unknown slug', async () => {
    await expect(run('missing-event')).rejects.toMatchObject({ status: 404 })
  })
})
