import { describe, expect, it } from 'vitest'
import type { Location, PerspectiveState } from '@black-whale/domain'
import locations from '../../../../../../data/locations/locations.json'
import { blueprint, buildShip, spaceForLocation } from '$lib/tour/blueprint'
import {
  anchorFor,
  resolveTierSlug,
  tierOverviewSpan,
  tierOverviewY,
  packMarkersForZoom,
  projectFutureMarker,
  projectPresenceMarker,
  type MapMarker,
  type MapNextChapterState,
  type MapPresence,
  type MapWorldState,
} from './markerProjection'

/** Catalogue rows that hold rooms rather than being one, as blueprint.test names them. */
const CONTAINER_LOCATIONS = new Set([
  'tier-1-queens-living-quarters',
  'tier-1-royal-residential-sector',
  'tier-3-political-ward',
])

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

  it('seats a queen in her own room instead of the shared centre grid', () => {
    const queens = ['unma', 'duazul'].map(
      (id, index) =>
        ({
          ...markers[0],
          id,
          locationId: `tier-1-queens-living-quarters-room-0${index + 1}`,
        }) as MapMarker,
    )
    const [unma, duazul] = packMarkersForZoom([...queens, markers[2]], 'LOCAL')

    // Room 01 is the first of the northern row, room 02 the next one along.
    expect(unma.y).toBeCloseTo(30.83)
    expect(duazul.y).toBeCloseTo(30.83)
    expect(duazul.x - unma.x).toBeCloseTo(18.13)
  })

  it('keeps a roomless marker centred when a roomed one shares the map', () => {
    const queen = {
      ...markers[0],
      locationId: 'tier-1-queens-living-quarters-room-04',
    } as MapMarker
    const [, guard] = packMarkersForZoom([queen, markers[1]], 'LOCAL')

    expect(guard.x).toBe(50)
    expect(guard.y).toBe(50)
  })

  it('sits a passenger on the fixture canon names for him', () => {
    const beyond = {
      ...markers[0],
      id: 'beyond',
      locationId: 'tier-1-vvip-prison-beyond',
      characterSlug: 'beyond-netero',
    } as MapMarker
    const [placed] = packMarkersForZoom([beyond], 'LOCAL')

    // The bed, against the wall his right arm is manacled to.
    expect(placed.x).toBeCloseTo(23.75)
    expect(placed.y).toBeCloseTo(54.17)
  })

  it('drops the rest of the room on its fallback corner, fanned out', () => {
    const cell = ['beyond-netero', 'cleapatro', 'saiyu'].map(
      (slug) =>
        ({
          ...markers[0],
          id: slug,
          locationId: 'tier-1-vvip-prison-beyond',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [beyond, cleapatro, saiyu] = packMarkersForZoom(cell, 'LOCAL')

    // Beyond keeps his bed; the two watching him share the guard side.
    expect(beyond.x).toBeCloseTo(23.75)
    expect(cleapatro.x).toBeCloseTo(65.63)
    expect(saiyu.x).toBeCloseTo(69.63)
    expect(`${cleapatro.x},${cleapatro.y}`).not.toBe(`${saiyu.x},${saiyu.y}`)
  })

  it('leaves a room without a fallback to the centre grid', () => {
    const jail = ['prince-camilla', 'guard'].map(
      (slug) =>
        ({
          ...markers[0],
          id: slug,
          locationId: 'tier-1-vip-jail',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [camilla, guard] = packMarkersForZoom(jail, 'LOCAL')

    expect(camilla.x).toBeCloseTo(27)
    expect(guard.x).toBe(50)
    expect(guard.y).toBe(50)
  })

  it('puts a princess on her own bed rather than her apartment floor', () => {
    const momoze = {
      ...markers[0],
      id: 'momoze',
      locationId: 'tier-1-royal-residential-sector-room-1012',
      characterSlug: 'prince-momoze',
    } as MapMarker
    const [placed] = packMarkersForZoom([momoze], 'LOCAL')

    // The bed the apartment asset draws in the master bedroom.
    expect(placed.x).toBeCloseTo(15)
    expect(placed.y).toBeCloseTo(85.15)
  })

  it('lays the twins side by side on the one bed they share', () => {
    const bedroom = [
      ['fugetsu', 'prince-fugetsu'],
      ['kacho', 'prince-kacho'],
    ].map(
      ([id, slug]) =>
        ({
          ...markers[0],
          id,
          locationId: 'tier-1-royal-residential-sector-room-1011',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [fugetsu, kacho] = packMarkersForZoom(bedroom, 'LOCAL')

    expect(fugetsu.y).toBeCloseTo(kacho.y)
    expect(kacho.x - fugetsu.x).toBeCloseTo(5.5)
  })

  it('holds Longhi in 1014’s master bedroom while the class keeps the living room', () => {
    const room = [
      ['longhi', 'longhi'],
      ['student', 'sakata'],
    ].map(
      ([id, slug]) =>
        ({
          ...markers[0],
          id,
          locationId: 'tier-1-royal-residential-sector-room-1014',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [longhi, student] = packMarkersForZoom(room, 'LOCAL')

    expect(longhi.x).toBeCloseTo(56.25)
    expect(longhi.y).toBeCloseTo(87.07)
    // 1014 declares no fallback, so everyone else keeps the centred grid.
    expect(student.x).toBe(50)
    expect(student.y).toBe(50)
  })

  it('seats each prince on the fixture his own apartment draws', () => {
    const seats = [
      ['tier-1-royal-residential-sector-room-1001', 'prince-benjamin', 75, 63.29],
      ['tier-1-royal-residential-sector-room-1004', 'prince-tserriednich', 74.38, 63.29],
      ['tier-1-royal-residential-sector-room-1007', 'prince-luzurus', 29.38, 65.21],
    ] as const

    for (const [locationId, characterSlug, x, y] of seats) {
      const [placed] = packMarkersForZoom(
        [{ ...markers[0], id: characterSlug, locationId, characterSlug } as MapMarker],
        'LOCAL',
      )
      expect(placed.x).toBeCloseTo(x)
      expect(placed.y).toBeCloseTo(y)
    }
  })

  it('splits 1014 between the class, the cradle and the two bodies on its floors', () => {
    const room = [
      ['kurapika', 'kurapika'],
      ['woble', 'prince-woble'],
      ['oito', 'queen-oito'],
      ['woody', 'woody'],
      ['vincent', 'vincent'],
      ['student', 'sakata'],
    ].map(
      ([id, slug]) =>
        ({
          ...markers[0],
          id,
          locationId: 'tier-1-royal-residential-sector-room-1014',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [kurapika, woble, oito, woody, vincent, student] = packMarkersForZoom(room, 'LOCAL')

    // Oito is beside the cradle, not in it, and both sit right of the class.
    expect(woble.x).toBeCloseTo(75)
    expect(oito.y).toBeCloseTo(woble.y)
    expect(oito.x).toBeLessThan(woble.x)
    expect(kurapika.x).toBeLessThan(oito.x)
    // Kurapika faces the class, which keeps the centred grid above him.
    expect(kurapika.y).toBeGreaterThan(student.y)
    expect(student.x).toBe(50)
    // The bathroom is bottom right of the plan, the entrance top centre.
    expect(woody.y).toBeGreaterThan(kurapika.y)
    expect(vincent.y).toBeLessThan(student.y)
  })

  it('holds the confined inside the safe area the bureau plan draws', () => {
    const safe = ['prince-fugetsu', 'prince-kacho'].map(
      (slug) =>
        ({
          ...markers[0],
          id: slug,
          locationId: 'tier-2-vip-witness-protection-area',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [fugetsu, kacho] = packMarkersForZoom(safe, 'LOCAL')

    // Neither is named on a fixture, so both fan out from the room's corner
    // rather than sitting in the middle of the bureau at large.
    expect(fugetsu.x).toBeCloseTo(28)
    expect(kacho.x).toBeCloseTo(32)
    expect(fugetsu.y).toBeCloseTo(67.86)
  })

  it('gathers a delegation on a shared fixture while naming one of its own', () => {
    const cabin = ['kanzai', 'saiyu', 'pyon', 'prince-fugetsu'].map(
      (slug) =>
        ({
          ...markers[0],
          id: slug,
          locationId: 'tier-3-residential-first-class',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [kanzai, saiyu, pyon, fugetsu] = packMarkersForZoom(cabin, 'LOCAL')

    // The Zodiacs fan out around the strategy table, seated by sorted id so the
    // arrangement does not depend on the order the world state hands them over.
    expect(kanzai.x).toBeCloseTo(55)
    expect(pyon.x).toBeCloseTo(59)
    expect(saiyu.x).toBeCloseTo(63)
    // ...and Fugetsu, who hides in the same block, keeps the bed instead.
    expect(fugetsu.x).toBeCloseTo(45)
  })

  it('puts the two classroom victims on the floor they fell on', () => {
    const room = ['barrigen', 'myuhan', 'kurapika'].map(
      (slug) =>
        ({
          ...markers[0],
          id: slug,
          locationId: 'tier-1-royal-residential-sector-room-1014',
          characterSlug: slug,
        }) as MapMarker,
    )
    const [barrigen, myuhan, kurapika] = packMarkersForZoom(room, 'LOCAL')

    // Both lie on the class floor, either side of the teacher who is below them.
    expect(barrigen.y).toBeCloseTo(myuhan.y)
    expect(barrigen.x).toBeLessThan(kurapika.x)
    expect(myuhan.x).toBeGreaterThan(kurapika.x)
    expect(barrigen.y).toBeLessThan(kurapika.y)
  })

  it('says what each local position in a room is worth', () => {
    const room = [
      ['beyond-netero', 'tier-1-vvip-prison-beyond'],
      ['keeney', 'tier-1-lifeboats'],
      ['danjin', 'tier-1-royal-residential-sector-room-1004'],
    ].map(
      ([characterSlug, locationId]) =>
        ({ ...markers[0], id: characterSlug, locationId, characterSlug }) as MapMarker,
    )
    const [beyond, keeney, danjin] = packMarkersForZoom(room, 'LOCAL')

    // A panel puts Beyond on that bed, so the marker claims it outright.
    expect(beyond.spotLabel).toBeUndefined()
    // Keeney's post is his role, not a panel.
    expect(keeney.spotLabel).toMatch(/inferred/)
    // Danjin is only ever "in 1004": the dot had to go somewhere, and says so.
    expect(danjin.spotLabel).toMatch(/not depicted/)
  })

  it('does not caveat positions outside a local map', () => {
    for (const zoom of ['TIER', 'OVERVIEW'] as const) {
      const [packed] = packMarkersForZoom([markers[0]], zoom)
      expect(packed.spotLabel).toBeUndefined()
    }
  })

  it('packs overview by tier, so a lone tier sits on its own band', () => {
    const packed = packMarkersForZoom(markers, 'OVERVIEW')
    const [first, second, third] = packed

    // Two markers share tier-1 and split its columns; tier-2 keeps a single one,
    // which lands in the middle of the length tier 2 actually has.
    expect(first.x).not.toBe(second.x)
    const [fore, aft] = tierOverviewSpan['tier-2']
    expect(third.x).toBeCloseTo((fore + aft) / 2, 6)
  })

  /**
   * And nobody hangs off either end of the ship.
   *
   * The whale tapers, so the decks are not the same length: tier 5 stops at
   * 73 % of the width where tier 3 runs to 91 %. Fanning every crowd across one
   * fixed band drew the short decks' passengers past their own stern — Tajao,
   * in the Cha-R office, was swimming behind the ship.
   */
  it('keeps every marker between the bow and the stern of its own deck', () => {
    const crowd: MapMarker[] = []
    for (const [deck] of Object.entries(tierOverviewSpan)) {
      for (let n = 0; n < 40; n++) {
        crowd.push({
          ...markers[0],
          id: `${deck}-${n}`,
          tierId: deck,
          overviewY: tierOverviewY[deck],
        })
      }
    }

    for (const packed of packMarkersForZoom(crowd, 'OVERVIEW')) {
      const [fore, aft] = tierOverviewSpan[packed.tierId!]
      expect(packed.x, `${packed.id} is forward of its own bow`).toBeGreaterThan(fore)
      expect(packed.x, `${packed.id} is astern of its own stern`).toBeLessThan(aft)
    }
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

/**
 * A marker has to land on the deck that draws its room.
 *
 * The two are not the same question any more. Tier 1 is a liner of three decks
 * and every room on all three still carries a `tier-1-` slug, so filing a
 * marker by that prefix put the casino, the cells, the court, the barracks and
 * the eight queens on the royal deck — at the coordinates where those blocks
 * used to be drawn and where the royal deck now has the bare floor they left.
 * Eighteen passengers stood in rooms that had moved out from under them, and
 * every test passed.
 *
 * So this walks the catalogue: for every location the reconstruction gives a
 * volume, the deck the projection files it under is the deck the blueprint
 * draws it on. It fails on the next block that moves without its anchors.
 */
describe('the deck a marker is filed under', () => {
  const catalogue = locations as unknown as { id: string; parentLocationId: string | null }[]
  const asLocation = (row: { id: string; parentLocationId: string | null }) =>
    ({ ...row, slug: row.id }) as unknown as Location
  const byId = new Map(catalogue.map((row) => [row.id, asLocation(row)]))
  const ship = buildShip()

  it('is the deck the blueprint draws the room on', () => {
    const wrong: string[] = []
    let checked = 0
    for (const row of catalogue) {
      const space = spaceForLocation(ship, row.id)
      if (!space) continue
      checked++
      const filed = resolveTierSlug(asLocation(row), byId)
      if (filed !== space.tierId)
        wrong.push(`${row.id}: filed on ${filed}, drawn on ${space.tierId}`)
    }
    expect(checked).toBeGreaterThan(50)
    expect(wrong).toEqual([])
  })

  /**
   * And every deck the blueprint holds can anchor someone the archive places on
   * it and no finer, which is what a passenger with a tier and no room gets.
   */
  it('anchors every deck for a passenger placed no finer than one', () => {
    for (const deck of blueprint.tiers.filter((tier) => tier.kind === 'deck')) {
      const anchor = resolveTierSlug(
        { slug: deck.id, parentLocationId: null } as unknown as Location,
        byId,
      )
      expect(anchor, `${deck.id} anchors nobody`).toBe(deck.id)
    }
  })
})

/**
 * And a room the catalogue holds is a room a marker can be put *in*.
 *
 * Without an anchor of its own a marker falls back to the nearest parent, and
 * from there to the middle of the deck — which reads as a passenger loitering
 * in a corridor rather than standing where the page puts them. The two rooms
 * the ch. 380 census added arrived exactly like that: catalogued, reconstructed,
 * and with nowhere on the map to stand.
 */
describe('anchors', () => {
  const catalogue = locations as unknown as { id: string; parentLocationId: string | null }[]
  const byId = new Map(
    catalogue.map((row) => [row.id, { ...row, slug: row.id } as unknown as Location]),
  )
  const ship = buildShip()

  it('gives every reconstructed room a place of its own to stand', () => {
    const homeless: string[] = []
    for (const row of catalogue) {
      const space = spaceForLocation(ship, row.id)
      // A tier and the blocks that only hold rooms are not rooms themselves.
      if (!space || CONTAINER_LOCATIONS.has(row.id)) continue
      const deck = resolveTierSlug(byId.get(row.id)!, byId)
      if (!deck) continue
      if (!anchorFor(deck, row.id)) homeless.push(`${row.id} on ${deck}`)
    }
    expect(homeless).toEqual([])
  })
})
