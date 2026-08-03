import { describe, expect, it } from 'vitest'
import { en } from '$lib/i18n/messages/en'
import { fr } from '$lib/i18n/messages/fr'
import { theShip } from './blueprint'
import { examine, solidExhibit, spaceExhibit, type ExhibitWords } from './exhibit'

const ship = theShip()

/** English, and every field marked so a test can see which one it read. */
const words: ExhibitWords = {
  nameOf: (entity) => entity.name,
  sourceOf: (entity) => entity.source,
  badge: (provenance) => `badge:${provenance}`,
  claim: (kind) => `claim:${kind}`,
  roomClaim: 'claim:room',
  measured: (long, wide, height) => `${long}x${wide}x${height}`,
  standingIn: (room) => `in:${room}`,
}

const throne = ship.structures.find((structure) => structure.kind === 'casket')!
const hall = ship.spaces.get('tier-1-banquet-hall')!

describe('the exhibit for a solid', () => {
  it('carries the badge, the chapter and the claim of its kind', () => {
    const card = solidExhibit(ship, throne, words)
    expect(card.id).toBe(throne.id)
    expect(card.provenance).toBe(throne.provenance)
    expect(card.badge).toBe(`badge:${throne.provenance}`)
    expect(card.claim).toBe(`claim:${throne.kind}`)
    expect(card.source).toBe(throne.source)
  })

  it('names the room it stands in', () => {
    const room = ship.spaces.get(throne.spaceId)!
    expect(solidExhibit(ship, throne, words).standingIn).toBe(`in:${room.name}`)
  })

  it('measures it to one decimal and no further', () => {
    // The blueprint holds centimetres because doorways are derived from wall
    // geometry; none of that precision is a measurement the manga gave.
    const card = solidExhibit(ship, throne, words)
    for (const figure of card.measured!.split('x')) {
      expect(Number(figure)).toBeCloseTo(Math.round(Number(figure) * 10) / 10, 10)
      expect(figure).not.toMatch(/\.\d\d/)
    }
  })

  it('reads the footprint after rotation, not the raw size', () => {
    // A solid turned 90° is as long across the ship as it was along it, and the
    // card is a measurement of the thing as it stands.
    const turned = { ...throne, rotation: 90, size: [4, 1] as [number, number] }
    const flat = { ...throne, rotation: 0, size: [4, 1] as [number, number] }
    expect(solidExhibit(ship, turned, words).measured).toBe(
      solidExhibit(ship, flat, words).measured,
    )
  })
})

describe('the exhibit for a room', () => {
  it('says what a room asserts, and gives its ceiling as the third figure', () => {
    const card = spaceExhibit(ship, hall, words)
    expect(card.claim).toBe('claim:room')
    expect(card.standingIn).toBeNull()
    expect(card.measured).toMatch(/^\d/)
  })
})

describe('what the visitor is handed for asking', () => {
  it('prefers the solid: aiming at a thing is how you say which you meant', () => {
    const card = examine(ship, { solid: throne, space: hall }, words)
    expect(card?.id).toBe(throne.id)
  })

  it('falls back to the room, which has a chapter behind it too', () => {
    expect(examine(ship, { solid: null, space: hall }, words)?.id).toBe(hall.id)
  })

  it('offers nothing out in the hull, where the blueprint has no footprint', () => {
    expect(examine(ship, { solid: null, space: null }, words)).toBeNull()
  })
})

describe('the claims table covers the ship', () => {
  it('states what every kind of solid actually on board asserts', () => {
    // The guard against a card headed "what this asserts" and left blank: a new
    // kind in the blueprint has to arrive with the statement it makes, in both
    // catalogues, before it can be aimed at.
    for (const kind of new Set(ship.structures.map((structure) => structure.kind))) {
      expect(en.tour.examine.claims[kind], `English claim for ${kind}`).toBeTruthy()
      expect(fr.tour.examine.claims[kind], `French claim for ${kind}`).toBeTruthy()
    }
  })
})
