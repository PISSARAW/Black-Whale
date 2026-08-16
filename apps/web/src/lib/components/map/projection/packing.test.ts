import { describe, expect, it } from 'vitest'

import { packMarkersForZoom } from './packing'
import { tierOverviewSpan, tierOverviewY } from './overview'
import type { MapMarker } from './types'

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

    // The bed in the left-hand private room of the ch. 368 cutaway.
    expect(placed.x).toBeCloseTo(21)
    expect(placed.y).toBeCloseTo(35)
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
    expect(kacho.x - fugetsu.x).toBeCloseTo(6)
  })

  it('holds Longhi in 1014’s private wing while the class keeps the open room', () => {
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

    expect(longhi.x).toBeCloseTo(37)
    expect(longhi.y).toBeCloseTo(78)
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

    // Woble and Oito keep the guarded side of the ch. 368 cutaway, left of
    // Kurapika's teaching position rather than in the open classroom grid.
    expect(woble.x).toBeCloseTo(29)
    expect(woble.y).toBeCloseTo(27)
    expect(oito.x).toBeCloseTo(37)
    expect(oito.y).toBeCloseTo(39)
    expect(kurapika.x).toBeGreaterThan(oito.x)
    // Kurapika faces the class, which keeps the centred grid below him.
    expect(kurapika.y).toBeLessThan(student.y)
    expect(student.x).toBe(50)
    // The cutaway's entrance is on the lower face; both bodies remain on the
    // lower half of the apartment instead of using the old generic topology.
    expect(woody.y).toBeGreaterThan(kurapika.y)
    expect(vincent.y).toBeGreaterThan(student.y)
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

    // Both lie on the class floor, either side of the teacher and deeper into
    // the open room in the ch. 368 orientation.
    expect(barrigen.y).toBeCloseTo(myuhan.y)
    expect(barrigen.x).toBeLessThan(kurapika.x)
    expect(myuhan.x).toBeGreaterThan(kurapika.x)
    expect(barrigen.y).toBeGreaterThan(kurapika.y)
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

  it('stages every chapter 416 event inside VIP detention and room 1004', () => {
    const vipJail = 'tier-1-vip-jail'
    const room1004 = 'tier-1-royal-residential-sector-room-1004'
    const scenarios = [
      {
        title: 'Benjamin confronts Camilla under special martial law',
        room: vipJail,
        slugs: ['prince-camilla', 'prince-benjamin', 'furykov', 'butch', 'mozbe', 'fukataki'],
      },
      {
        title: 'Moswana sacrifices herself and curses Benjamin',
        room: vipJail,
        slugs: [
          'prince-camilla',
          'moswana',
          'prince-benjamin',
          'furykov',
          'butch',
          'mozbe',
          'fukataki',
        ],
      },
      {
        title: 'Tserriednich prepares Salkov to witness his false death',
        room: room1004,
        slugs: ['prince-tserriednich', 'salkov', 'danjin'],
      },
      {
        title: 'Benjamin breaches room 1004 and shoots Tserriednich',
        room: room1004,
        slugs: ['prince-benjamin', 'prince-tserriednich', 'furykov', 'butch', 'salkov', 'danjin'],
      },
    ]

    for (const scenario of scenarios) {
      const placed = packMarkersForZoom(
        scenario.slugs.map(
          (characterSlug) =>
            ({
              ...markers[0],
              id: characterSlug,
              locationId: scenario.room,
              characterSlug,
              currentEventTitle: scenario.title,
            }) as MapMarker,
        ),
        'LOCAL',
      )
      expect(new Set(placed.map(({ x, y }) => `${x},${y}`)).size).toBe(placed.length)
      expect(placed.every((marker) => marker.spotLabel === undefined)).toBe(true)
    }
  })

  it('places Benjamin and Tserriednich face-to-face for the chapter 416 shot', () => {
    const title = 'Benjamin breaches room 1004 and shoots Tserriednich'
    const [benjamin, tserriednich] = packMarkersForZoom(
      [
        ['prince-benjamin', 'prince-benjamin'],
        ['prince-tserriednich', 'prince-tserriednich'],
      ].map(
        ([id, characterSlug]) =>
          ({
            ...markers[0],
            id,
            locationId: 'tier-1-royal-residential-sector-room-1004',
            characterSlug,
            currentEventTitle: title,
          }) as MapMarker,
      ),
      'LOCAL',
    )

    expect(benjamin.y).toBeCloseTo(tserriednich.y)
    expect(benjamin.x).toBeLessThan(tserriednich.x)
    expect(tserriednich.x - benjamin.x).toBeCloseTo(9)
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
