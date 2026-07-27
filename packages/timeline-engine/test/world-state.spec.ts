import { describe, expect, it, vi } from 'vitest'
import { TimelineEngine } from '../src/index.js'

const CH401 = { id: 'event-1', chapterId: 'ch-401', sequence: 1, ordinal: 10, chapter: { number: 401 } }
const CH405 = { id: 'event-3', chapterId: 'ch-405', sequence: 3, ordinal: 30, chapter: { number: 405 } }
const CH412 = { id: 'event-9', chapterId: 'ch-412', sequence: 9, ordinal: 90, chapter: { number: 412 } }

function visible(id: string, firstVisibleEvent = CH401) {
  return { id, firstVisibleEvent }
}

function temporal(overrides: Record<string, unknown> = {}) {
  return { fromEvent: CH401, untilEvent: null, ...overrides }
}

/** Records every `where` the engine sends, so query bounds can be asserted. */
function fakePrisma(options: {
  event?: typeof CH405 | null
  characters?: unknown[]
  bodies?: unknown[]
  consciousnesses?: unknown[]
  presences?: unknown[]
  states?: unknown[]
  occupancies?: unknown[]
  appearances?: unknown[]
} = {}) {
  const calls: Record<string, unknown[]> = {}
  const model = (name: string, rows: unknown[] | undefined) => ({
    findMany: vi.fn(async (args?: unknown) => {
      ;(calls[name] ??= []).push(args)
      return rows ?? []
    }),
    findUnique: async () => (options.event === undefined ? CH405 : options.event),
    findFirst: async () => (options.event === undefined ? CH405 : options.event),
  })

  const prisma = {
    narrativeEvent: model('narrativeEvent', []),
    character: model('character', options.characters),
    body: model('body', options.bodies),
    consciousness: model('consciousness', options.consciousnesses),
    presence: model('presence', options.presences),
    bodyState: model('bodyState', options.states),
    bodyOccupancy: model('bodyOccupancy', options.occupancies),
    appearanceState: model('appearanceState', options.appearances),
    location: model('location', []),
    consciousnessState: model('consciousnessState', []),
  }
  return { prisma: prisma as never, calls }
}

describe('TimelineEngine.getWorldState visibility', () => {
  it('refuses a point it cannot resolve', async () => {
    const { prisma } = fakePrisma({ event: null })
    await expect(new TimelineEngine(prisma).getWorldState({ eventId: 'nope' })).rejects.toThrow(
      /Unable to resolve timeline point/,
    )
  })

  it('hides an entity first revealed after the reader has read', async () => {
    const { prisma } = fakePrisma({
      characters: [visible('kurapika'), visible('tserriednich', CH412)],
    })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.characters.map((character: any) => character.id)).toEqual(['kurapika'])
  })

  it('applies the same rule to bodies and consciousnesses', async () => {
    const { prisma } = fakePrisma({
      bodies: [visible('body-a'), visible('body-b', CH412)],
      consciousnesses: [visible('mind-a'), visible('mind-b', CH412)],
    })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.bodies).toHaveLength(1)
    expect(state.consciousnesses).toHaveLength(1)
  })

  it('honours an explicit reveal limit below the target event', async () => {
    const { prisma } = fakePrisma({ characters: [visible('kurapika'), visible('oito', CH405)] })
    const state = await new TimelineEngine(prisma).getWorldState({
      eventId: 'event-3',
      revealedThroughChapter: 401,
    })

    expect(state.characters.map((character: any) => character.id)).toEqual(['kurapika'])
  })
})

describe('TimelineEngine.getWorldState temporal records', () => {
  it('keeps an open-ended presence', async () => {
    const { prisma } = fakePrisma({ presences: [temporal({ entityId: 'body-a' })] })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.presences).toHaveLength(1)
  })

  it('drops a presence closed at the target event', async () => {
    const { prisma } = fakePrisma({ presences: [temporal({ untilEvent: CH405 })] })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.presences).toEqual([])
  })

  it('keeps a presence whose end has not been revealed yet', async () => {
    // The reader is at 405 and must not learn the presence ever ends.
    const { prisma } = fakePrisma({ presences: [temporal({ untilEvent: CH412 })] })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.presences).toHaveLength(1)
  })

  it('drops a record that has not started', async () => {
    const { prisma } = fakePrisma({ occupancies: [temporal({ fromEvent: CH412 })] })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.occupancies).toEqual([])
  })

  it('indexes body states by body', async () => {
    const { prisma } = fakePrisma({
      states: [
        temporal({ bodyId: 'body-a', state: 'ALIVE' }),
        temporal({ bodyId: 'body-b', state: 'DEAD', untilEvent: CH405 }),
      ],
    })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.bodyStates).toEqual({ 'body-a': 'ALIVE' })
  })

  it('filters appearances on the same rule', async () => {
    const { prisma } = fakePrisma({
      appearances: [temporal({ entityId: 'body-a' }), temporal({ entityId: 'body-b', fromEvent: CH412 })],
    })
    const state = await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    expect(state.appearances).toHaveLength(1)
  })
})

describe('TimelineEngine.getWorldState query bounds', () => {
  it('bounds every table it reads by the revealed chapter', async () => {
    const { prisma, calls } = fakePrisma()
    await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    const bound = { chapter: { number: { lte: 405 } } }

    for (const model of ['character', 'body', 'consciousness']) {
      const where = (calls[model]?.[0] as { where?: Record<string, unknown> })?.where
      expect(where, `${model} must be bounded`).toMatchObject({ firstVisibleEvent: bound })
    }

    for (const model of ['presence', 'bodyState', 'bodyOccupancy', 'appearanceState']) {
      const where = (calls[model]?.[0] as { where?: Record<string, unknown> })?.where
      expect(where, `${model} must be bounded`).toMatchObject({ fromEvent: bound })
    }
  })

  it('uses the explicit reveal limit rather than the target chapter', async () => {
    const { prisma, calls } = fakePrisma()
    await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3', revealedThroughChapter: 401 })

    const where = (calls['character']?.[0] as { where?: Record<string, unknown> })?.where
    expect(where).toMatchObject({ firstVisibleEvent: { chapter: { number: { lte: 401 } } } })
  })

  it('keeps restricting presences to bodies', async () => {
    const { prisma, calls } = fakePrisma()
    await new TimelineEngine(prisma).getWorldState({ eventId: 'event-3' })

    const where = (calls['presence']?.[0] as { where?: Record<string, unknown> })?.where
    expect(where).toMatchObject({ entityType: 'BODY' })
  })
})
