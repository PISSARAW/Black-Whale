import { describe, expect, it } from 'vitest'
import { IdentityEngine } from '../src/index.js'

const EVENT = { id: 'event-3', sequence: 3, ordinal: 30, chapter: { number: 405 } }
const EARLIER = { id: 'event-1', sequence: 1, ordinal: 10, chapter: { number: 401 } }
const LATER = { id: 'event-9', sequence: 9, ordinal: 90, chapter: { number: 412 } }

const TSERRIEDNICH_BODY = {
  id: 'body-tserriednich',
  originalCharacterId: 'tserriednich',
  label: 'Tserriednich',
  bodyType: 'HUMAN',
  firstVisibleEventId: 'event-1',
}

function consciousness(id: string, originCharacterId: string) {
  return { id, originCharacterId, label: id, consciousnessType: 'HUMAN', firstVisibleEventId: 'event-1' }
}

/** Only the four reads IdentityEngine performs. */
function fakePrisma(options: {
  event?: typeof EVENT | null
  body?: typeof TSERRIEDNICH_BODY | null
  occupancies?: unknown[]
  appearances?: unknown[]
}) {
  return {
    narrativeEvent: { findUnique: async () => (options.event === undefined ? EVENT : options.event) },
    body: { findUnique: async () => (options.body === undefined ? TSERRIEDNICH_BODY : options.body) },
    bodyOccupancy: { findMany: async () => options.occupancies ?? [] },
    appearanceState: { findMany: async () => options.appearances ?? [] },
  } as never
}

describe('IdentityEngine.resolveIdentity', () => {
  it('reports an empty body as perceived by its original owner', async () => {
    const engine = new IdentityEngine(fakePrisma({}))
    const result = await engine.resolveIdentity('body-tserriednich', 'event-3')

    expect(result.consciousness).toBeNull()
    expect(result.perceivedAs).toBe('tserriednich')
    expect(result.isDissonant).toBe(false)
  })

  it('is not dissonant when a body holds its own consciousness', async () => {
    const engine = new IdentityEngine(
      fakePrisma({
        occupancies: [
          { consciousness: consciousness('mind-tserriednich', 'tserriednich'), fromEvent: EARLIER, untilEvent: null },
        ],
      }),
    )
    const result = await engine.resolveIdentity('body-tserriednich', 'event-3')

    expect(result.consciousness?.id).toBe('mind-tserriednich')
    expect(result.isDissonant).toBe(false)
  })

  it('is dissonant when a transferred consciousness occupies the body', async () => {
    // The arc's central conceit: the body still looks like its owner, so
    // perceivedAs must not follow the consciousness inside it.
    const engine = new IdentityEngine(
      fakePrisma({
        occupancies: [
          { consciousness: consciousness('mind-hisoka', 'hisoka'), fromEvent: EARLIER, untilEvent: null },
        ],
      }),
    )
    const result = await engine.resolveIdentity('body-tserriednich', 'event-3')

    expect(result.consciousness?.originCharacterId).toBe('hisoka')
    expect(result.perceivedAs).toBe('tserriednich')
    expect(result.isDissonant).toBe(true)
  })

  it('ignores an occupancy that has already ended', async () => {
    const engine = new IdentityEngine(
      fakePrisma({
        occupancies: [
          { consciousness: consciousness('mind-hisoka', 'hisoka'), fromEvent: EARLIER, untilEvent: EVENT },
        ],
      }),
    )
    const result = await engine.resolveIdentity('body-tserriednich', 'event-3')

    expect(result.consciousness).toBeNull()
  })

  it('ignores an occupancy that has not started yet', async () => {
    const engine = new IdentityEngine(
      fakePrisma({
        occupancies: [
          { consciousness: consciousness('mind-hisoka', 'hisoka'), fromEvent: LATER, untilEvent: null },
        ],
      }),
    )

    expect((await engine.resolveIdentity('body-tserriednich', 'event-3')).consciousness).toBeNull()
  })

  it('keeps the most recent of several active occupancies', async () => {
    const engine = new IdentityEngine(
      fakePrisma({
        occupancies: [
          { consciousness: consciousness('mind-old', 'someone'), fromEvent: EARLIER, untilEvent: null },
          { consciousness: consciousness('mind-new', 'hisoka'), fromEvent: EVENT, untilEvent: null },
        ],
      }),
    )

    expect((await engine.resolveIdentity('body-tserriednich', 'event-3')).consciousness?.id).toBe('mind-new')
  })

  it('lets an active appearance override who the body is taken for', async () => {
    const engine = new IdentityEngine(
      fakePrisma({
        appearances: [{ appearanceCharacterId: 'benjamin', fromEvent: EARLIER, untilEvent: null }],
      }),
    )

    expect((await engine.resolveIdentity('body-tserriednich', 'event-3')).perceivedAs).toBe('benjamin')
  })

  it('drops a disguise that has been lifted', async () => {
    const engine = new IdentityEngine(
      fakePrisma({
        appearances: [{ appearanceCharacterId: 'benjamin', fromEvent: EARLIER, untilEvent: EVENT }],
      }),
    )

    expect((await engine.resolveIdentity('body-tserriednich', 'event-3')).perceivedAs).toBe('tserriednich')
  })

  it('refuses an unknown event rather than guessing', async () => {
    const engine = new IdentityEngine(fakePrisma({ event: null }))
    await expect(engine.resolveIdentity('body-tserriednich', 'nope')).rejects.toThrow(/Event nope not found/)
  })

  it('refuses an unknown body', async () => {
    const engine = new IdentityEngine(fakePrisma({ body: null }))
    await expect(engine.resolveIdentity('ghost', 'event-3')).rejects.toThrow(/Body ghost not found/)
  })
})

describe('IdentityEngine.findBodyOf', () => {
  it('returns the body a consciousness currently occupies', async () => {
    const engine = new IdentityEngine(
      fakePrisma({ occupancies: [{ body: TSERRIEDNICH_BODY, fromEvent: EARLIER, untilEvent: null }] }),
    )

    expect((await engine.findBodyOf('mind-hisoka', 'event-3'))?.id).toBe('body-tserriednich')
  })

  it('returns null when the occupancy is over', async () => {
    const engine = new IdentityEngine(
      fakePrisma({ occupancies: [{ body: TSERRIEDNICH_BODY, fromEvent: EARLIER, untilEvent: EVENT }] }),
    )

    expect(await engine.findBodyOf('mind-hisoka', 'event-3')).toBeNull()
  })

  it('returns null for an unknown event instead of throwing', async () => {
    const engine = new IdentityEngine(fakePrisma({ event: null }))
    expect(await engine.findBodyOf('mind-hisoka', 'nope')).toBeNull()
  })
})
