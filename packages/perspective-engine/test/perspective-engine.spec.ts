import { describe, expect, it } from 'vitest'
import { PerspectiveEngine } from '../src/index.js'

const EVENT = { id: 'event-3', sequence: 3, ordinal: 30, chapter: { number: 405 } }
const EARLIER = { id: 'event-1', sequence: 1, ordinal: 10, chapter: { number: 401 } }

const KURAPIKA_BODY = {
  id: 'body-kurapika',
  originalCharacterId: 'kurapika',
  label: 'Kurapika',
  bodyType: 'HUMAN',
  firstVisibleEventId: 'event-1',
}

function presence(entityId: string, locationId: string | null, untilEvent: unknown = null) {
  return { entityId, entityType: 'BODY', locationId, fromEvent: EARLIER, untilEvent }
}

function fact(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    subjectType: 'CHARACTER',
    subjectId: 'tserriednich',
    predicate: 'location',
    value: 'tier-1',
    truthStatus: 'TRUE',
    ...overrides,
  }
}

function build(
  options: {
    event?: typeof EVENT | null
    presences?: unknown[]
    trueFacts?: unknown[]
    knowledge?: unknown[]
    beliefs?: unknown[]
    body?: unknown
  } = {},
) {
  const prisma = {
    narrativeEvent: {
      findUnique: async () => (options.event === undefined ? EVENT : options.event),
    },
    consciousness: { findUnique: async () => null },
    body: { findUnique: async () => (options.body === undefined ? KURAPIKA_BODY : options.body) },
    presence: { findMany: async () => options.presences ?? [] },
  } as never

  const identityEngine = {
    resolveIdentity: async () => ({
      body: KURAPIKA_BODY,
      consciousness: null,
      perceivedAs: 'kurapika',
      isDissonant: false,
    }),
    findBodyOf: async () => null,
    track: async () => {
      throw new Error('not used')
    },
  } as never

  const knowledgeEngine = {
    getTrueFacts: async () => options.trueFacts ?? [],
    getKnowledgeOf: async () => options.knowledge ?? [],
    getBeliefsOf: async () => options.beliefs ?? [],
  } as never

  return new PerspectiveEngine(prisma, identityEngine, knowledgeEngine)
}

const request = {
  observerCharacterId: 'kurapika',
  eventId: 'event-3',
  spoilerLimit: Number.POSITIVE_INFINITY,
}

describe('PerspectiveEngine spoiler handling', () => {
  it('refuses to build a perspective past the reader’s limit', async () => {
    await expect(build().buildPerspective({ ...request, spoilerLimit: 402 })).rejects.toThrow(
      /Spoiler limit exceeded/,
    )
  })

  it('builds it when the event is within the limit', async () => {
    const state = await build().buildPerspective({ ...request, spoilerLimit: 405 })
    expect(state.observer.characterId).toBe('kurapika')
  })

  it('refuses an unknown event', async () => {
    await expect(build({ event: null }).buildPerspective(request)).rejects.toThrow(
      /Event event-3 not found/,
    )
  })
})

describe('PerspectiveEngine subjective facts', () => {
  it('hides a true fact the observer does not know', async () => {
    const state = await build({ trueFacts: [fact('f1')] }).buildPerspective(request)
    expect(state.knownFacts).toEqual([])
  })

  it('keeps a fact the observer knows', async () => {
    const state = await build({
      trueFacts: [fact('f1')],
      knowledge: [{ factId: 'f1', epistemicState: 'KNOWN' }],
    }).buildPerspective(request)

    expect(state.knownFacts).toHaveLength(1)
  })

  it('keeps a fact the observer merely believes', async () => {
    const state = await build({
      trueFacts: [fact('f1')],
      knowledge: [{ factId: 'f1', epistemicState: 'BELIEVED' }],
    }).buildPerspective(request)

    expect(state.knownFacts).toHaveLength(1)
  })

  it('hides a fact the observer has rejected', async () => {
    const state = await build({
      trueFacts: [fact('f1')],
      knowledge: [{ factId: 'f1', epistemicState: 'REJECTED' }],
    }).buildPerspective(request)

    expect(state.knownFacts).toEqual([])
  })

  it('replaces a fact with a contradicting belief and marks it contested', async () => {
    // The heart of the perspective model: what Kurapika thinks is true, even
    // when the world says otherwise.
    const state = await build({
      trueFacts: [fact('f1', { value: 'tier-4' })],
      beliefs: [{ subjectId: 'tserriednich', predicate: 'location', believedValue: 'tier-1' }],
    }).buildPerspective(request)

    expect(state.knownFacts[0]).toMatchObject({ value: 'tier-1', truthStatus: 'CONTESTED' })
  })

  it('lets the belief win even over a fact the observer also knows', async () => {
    const state = await build({
      trueFacts: [fact('f1', { value: 'tier-4' })],
      knowledge: [{ factId: 'f1', epistemicState: 'KNOWN' }],
      beliefs: [{ subjectId: 'tserriednich', predicate: 'location', believedValue: 'tier-1' }],
    }).buildPerspective(request)

    expect(state.knownFacts[0]).toMatchObject({ truthStatus: 'CONTESTED' })
  })

  it('ignores a belief about a different predicate', async () => {
    const state = await build({
      trueFacts: [fact('f1')],
      beliefs: [{ subjectId: 'tserriednich', predicate: 'is-alive', believedValue: 'false' }],
    }).buildPerspective(request)

    expect(state.knownFacts).toEqual([])
  })

  it('always counts the observer among the characters they know', async () => {
    const state = await build().buildPerspective(request)
    expect(state.knownCharacters).toEqual(['kurapika'])
  })
})

describe('PerspectiveEngine direct perception', () => {
  it('sees the bodies sharing its location', async () => {
    const state = await build({
      presences: [
        presence('body-kurapika', 'room-1014'),
        presence('body-oito', 'room-1014'),
        presence('body-hisoka', 'tier-4'),
      ],
    }).buildPerspective(request)

    expect(state.visibleBodies).toEqual(['body-kurapika', 'body-oito'])
    expect(state.knownLocations).toEqual(['room-1014'])
  })

  it('stops seeing a body that has left the room', async () => {
    const state = await build({
      presences: [
        presence('body-kurapika', 'room-1014'),
        presence('body-oito', 'room-1014', EVENT),
      ],
    }).buildPerspective(request)

    expect(state.visibleBodies).toEqual(['body-kurapika'])
  })

  it('sees only itself when it has no recorded position', async () => {
    const state = await build({ presences: [presence('body-oito', 'room-1014')] }).buildPerspective(
      request,
    )

    expect(state.visibleBodies).toEqual(['body-kurapika'])
    expect(state.knownLocations).toEqual([])
  })

  it('sees nothing when the observer has no body at all', async () => {
    const state = await build({ body: null }).buildPerspective(request)

    expect(state.visibleBodies).toEqual([])
    expect(state.observer.currentBodyId).toBe('')
  })
})
