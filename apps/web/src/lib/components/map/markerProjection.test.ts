import { describe, expect, it } from 'vitest'
import type { Location, PerspectiveState } from '@black-whale/domain'
import {
  packMarkersForZoom,
  projectFutureMarker,
  projectPresenceMarker,
  type MapMarker,
  type MapNextChapterState,
  type MapPresence,
  type MapWorldState,
} from './markerProjection'

const tier1: Location = {
  id: 'loc-tier-1',
  slug: 'tier-1',
  name: 'Tier 1',
  type: 'TIER',
  firstVisibleEventId: 'e1',
}
const casino: Location = {
  id: 'loc-casino',
  slug: 'casino',
  name: 'Casino',
  type: 'ROOM',
  parentLocationId: 'loc-tier-1',
  firstVisibleEventId: 'e1',
}
const nowhere: Location = {
  id: 'loc-unknown',
  slug: 'unknown',
  name: 'Unknown',
  type: 'UNKNOWN',
  firstVisibleEventId: 'e1',
}

function presence(entityId: string, locationId: string): MapPresence {
  return {
    id: `p-${entityId}`,
    entityType: 'BODY',
    entityId,
    locationId,
    fromEventId: 'e1',
    precision: 'EXACT_ROOM',
    certainty: 'CONFIRMED',
  }
}

function world(overrides: Partial<MapWorldState> = {}): MapWorldState {
  return {
    characters: [
      {
        id: 'char-kurapika',
        slug: 'kurapika',
        canonicalName: 'Kurapika',
        aliases: [],
        narrativeImportance: 'PRIMARY',
        modelingLevel: 1,
        firstVisibleEventId: 'e1',
        factionTags: ['zodiacs'],
        hatsuNames: ['Chain Jail'],
        hatsuIds: ['chain-jail'],
      },
    ],
    bodies: [
      {
        id: 'body-kurapika',
        originalCharacterId: 'char-kurapika',
        label: 'Kurapika body',
        bodyType: 'ORIGINAL',
        firstVisibleEventId: 'e1',
      },
    ],
    consciousnesses: [],
    presences: [presence('body-kurapika', 'loc-casino')],
    occupancies: [],
    appearances: [],
    locations: [tier1, casino, nowhere],
    ...overrides,
  }
}

const readerContext = {
  perspective: null,
  nextChapterState: null,
  followMode: 'consciousness' as const,
  perspectiveIsReader: true,
  currentEvent: null,
  currentSequence: 0,
}

describe('projectPresenceMarker', () => {
  it('places a presence on its tier with the owner it resolves', () => {
    const state = world()
    const marker = projectPresenceMarker(state.presences[0], { world: state, ...readerContext })

    expect(marker).not.toBeNull()
    expect(marker?.tierId).toBe('tier-1')
    expect(marker?.body).toBe('Kurapika')
    expect(marker?.locationLabel).toBe('Casino')
    expect(marker?.factionTags).toEqual(['zodiacs'])
    expect(marker?.hatsuIds).toEqual(['chain-jail'])
  })

  it('drops a presence whose location is unknown rather than inventing coordinates', () => {
    const state = world({ presences: [presence('body-kurapika', 'loc-unknown')] })

    expect(projectPresenceMarker(state.presences[0], { world: state, ...readerContext })).toBeNull()
  })

  it('drops a presence whose body has no world entry', () => {
    const state = world({ presences: [presence('body-ghost', 'loc-casino')] })

    expect(projectPresenceMarker(state.presences[0], { world: state, ...readerContext })).toBeNull()
  })

  it('hides the identity from an observer who neither knows nor suspects', () => {
    const state = world()
    const perspective = {
      observer: {
        characterId: 'char-other',
        consciousnessId: 'cons-other',
        currentBodyId: 'body-other',
      },
      visibleBodies: ['body-kurapika'],
      knownCharacters: [],
      knownLocations: [],
      knownEvents: [],
      knownFacts: [],
      beliefs: [],
      unknownElements: [],
    } as PerspectiveState

    const marker = projectPresenceMarker(state.presences[0], {
      world: state,
      ...readerContext,
      perspective,
      perspectiveIsReader: false,
    })

    expect(marker?.perceivedIdentity).toBe('Unknown individual')
    expect(marker?.knowledgeState).toBe('confirmed')
    // The structural name stays available for the reader-facing axes.
    expect(marker?.body).toBe('Kurapika')
  })

  it('marks an observer holding only a belief as an active suspicion', () => {
    const state = world()
    const perspective = {
      observer: {
        characterId: 'char-other',
        consciousnessId: 'cons-other',
        currentBodyId: 'body-other',
      },
      visibleBodies: ['body-kurapika'],
      knownCharacters: [],
      knownLocations: [],
      knownEvents: [],
      knownFacts: [],
      beliefs: [
        {
          id: 'b1',
          observerCharacterId: 'char-other',
          subjectType: 'CHARACTER',
          subjectId: 'char-kurapika',
          predicate: 'is_aboard',
          believedValue: true,
          fromEventId: 'e1',
          confidence: 0.5,
          sourceEventId: 'e1',
        },
      ],
      unknownElements: [],
    } as PerspectiveState

    const marker = projectPresenceMarker(state.presences[0], {
      world: state,
      ...readerContext,
      perspective,
      perspectiveIsReader: false,
    })

    expect(marker?.perceivedIdentity).toBe('Assumed identity')
    expect(marker?.suspicionLabel).toBe('Active suspicion')
    expect(marker?.knowledgeState).toBe('believed')
    expect(marker?.sourceLabel).toBe('Belief: is_aboard')
  })

  it('reports a contested fact ahead of any other knowledge state', () => {
    const state = world()
    const perspective = {
      observer: {
        characterId: 'char-other',
        consciousnessId: 'cons-other',
        currentBodyId: 'body-other',
      },
      visibleBodies: ['body-kurapika'],
      knownCharacters: ['char-kurapika'],
      knownLocations: [],
      knownEvents: [],
      knownFacts: [
        {
          id: 'f1',
          subjectType: 'CHARACTER',
          subjectId: 'char-kurapika',
          predicate: 'is_alive',
          value: true,
          validFromEventId: 'e1',
          truthStatus: 'CONTESTED',
          firstVisibleEventId: 'e1',
        },
      ],
      beliefs: [],
      unknownElements: [],
    } as PerspectiveState

    const marker = projectPresenceMarker(state.presences[0], {
      world: state,
      ...readerContext,
      perspective,
      perspectiveIsReader: false,
    })

    expect(marker?.knowledgeState).toBe('contradicted')
  })

  it('flags a body whose consciousness came from someone else', () => {
    const state = world({
      consciousnesses: [
        {
          id: 'cons-chrollo',
          originCharacterId: 'char-chrollo',
          label: 'Chrollo',
          consciousnessType: 'ORIGINAL',
          firstVisibleEventId: 'e1',
        },
      ],
      occupancies: [
        {
          id: 'occ-1',
          bodyId: 'body-kurapika',
          consciousnessId: 'cons-chrollo',
          fromEventId: 'e1',
          occupancyType: 'TRANSFERRED',
          certainty: 'CONFIRMED',
        },
      ],
    })

    const marker = projectPresenceMarker(state.presences[0], { world: state, ...readerContext })

    expect(marker?.transferFlag).toBe(true)
  })
})

describe('projectFutureMarker', () => {
  const next: MapNextChapterState = {
    ...world(),
    chapterNumber: 400,
  }

  it('labels the marker with the chapter it is projected into', () => {
    const marker = projectFutureMarker(next.presences[0], next, [])

    expect(marker?.perceivedIdentity).toBe('Kurapika · Ch. 400')
    expect(marker?.temporalLabel).toBe('Parallel future')
  })

  it('omits a body the next chapter reports as destroyed', () => {
    const dead = { ...next, bodyStates: { 'body-kurapika': 'DEAD' } }

    expect(projectFutureMarker(dead.presences[0], dead, [])).toBeNull()
  })
})

describe('packMarkersForZoom', () => {
  const markers = ['a', 'b', 'c'].map(
    (id, index) =>
      ({
        id,
        tierId: index === 2 ? 'tier-2' : 'tier-1',
        x: 50,
        y: 50,
        overviewX: 50,
        overviewY: 21,
        body: id,
        consciousness: id,
        appearance: id,
        perceivedIdentity: id,
        knowledgeState: 'confirmed',
      }) as MapMarker,
  )

  it('leaves tier view on the coordinates the geometry computed', () => {
    expect(packMarkersForZoom(markers, 'TIER')).toEqual(markers)
  })

  it('spreads local view around the centre without overlap', () => {
    const packed = packMarkersForZoom(markers, 'LOCAL')
    const positions = packed.map((marker) => `${marker.x},${marker.y}`)

    expect(new Set(positions).size).toBe(markers.length)
    expect(packed.every((marker) => marker.x > 40 && marker.x < 60)).toBe(true)
  })

  it('packs overview by tier, so a lone tier sits on its own band', () => {
    const packed = packMarkersForZoom(markers, 'OVERVIEW')
    const [first, second, third] = packed

    // Two markers share tier-1 and split its columns; tier-2 keeps a single one.
    expect(first.x).not.toBe(second.x)
    expect(third.x).toBe(38 + 0.5 * 24)
  })

  it('is stable regardless of input order', () => {
    const forward = packMarkersForZoom(markers, 'OVERVIEW')
    const reversed = packMarkersForZoom([...markers].reverse(), 'OVERVIEW')

    for (const marker of forward) {
      const twin = reversed.find((candidate) => candidate.id === marker.id)
      expect(twin?.x).toBe(marker.x)
      expect(twin?.y).toBe(marker.y)
    }
  })
})
