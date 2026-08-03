import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { EMPTY_WORLD } from '../hatsu'
import { DISMISSAL_CARD, hostileRooms } from './hostility'

const ship = theShip()
const world = EMPTY_WORLD
const ROOM = 'tier-1-royal-residential-sector-room-1014'

describe('which rooms are dangerous to stand in', () => {
  it('finds none in a ship nothing has been done to', () => {
    expect(hostileRooms(ship, world)).toEqual([])
  })

  it('counts a room the serpents are loose in, fed or not', () => {
    for (const fed of [false, true]) {
      const loose = { ...world, snakes: { rooms: [ROOM], fed } }
      expect(hostileRooms(ship, loose)).toEqual([ROOM])
    }
  })

  it('counts a room whose bait is still uneaten', () => {
    expect(hostileRooms(ship, { ...world, trap: ROOM })).toEqual([ROOM])
  })

  it('counts a room dismissed by the red card and no other stage of it', () => {
    for (const stage of [1, 2]) {
      expect(hostileRooms(ship, { ...world, cards: { [ROOM]: stage } })).toEqual([])
    }
    const red = { ...world, cards: { [ROOM]: DISMISSAL_CARD } }
    expect(hostileRooms(ship, red)).toEqual([ROOM])
  })

  it('counts the room a solid the third contact changed is standing in', () => {
    const solid = ship.structures[0]!
    const changed = { ...world, solids: { [solid.id]: { monster: true, gone: true } } }
    expect(hostileRooms(ship, changed)).toEqual([solid.spaceId])
  })

  it('says nothing about a solid the aura has merely moved', () => {
    const solid = ship.structures[0]!
    expect(hostileRooms(ship, { ...world, solids: { [solid.id]: { gone: true } } })).toEqual([])
  })

  it('names each room once however many things are standing in it', () => {
    const crowded = { ...world, trap: ROOM, snakes: { rooms: [ROOM], fed: false } }
    expect(hostileRooms(ship, crowded)).toEqual([ROOM])
  })

  /**
   * The three refusals, as a test rather than as a paragraph: being watched is
   * not being endangered, and a dormant beast is furniture.
   */
  it('leaves a room that is only being watched, listened to or shared with a beast alone', () => {
    const watched = {
      ...world,
      owl: ROOM,
      eye: ROOM,
      watched: [{ spaceId: ROOM, visits: 3 }],
      medusa: ROOM,
      chimera: ROOM,
    }
    expect(hostileRooms(ship, watched)).toEqual([])
  })
})
