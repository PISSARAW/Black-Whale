import { describe, expect, it } from 'vitest'

import type { Doorway } from './types'
import { roomAudioBasisKey, roomAudioKey } from './roomAudioKey'

const door = (a: string, b: string, x: number): Doorway => ({
  tierId: 'test',
  a,
  b,
  start: [x, -0.5],
  end: [x, 0.5],
  width: 1,
})

describe('room audio live-input key', () => {
  it('is stable when the same active doors arrive in another order', () => {
    const doorways = [door('room', 'kitchen', 1), door('room', 'hall', 2)]
    const options = { spaceId: 'room', namedOccupants: { room: 1, kitchen: 2 } }
    expect(roomAudioBasisKey({ ...options, doorways })).toBe(
      roomAudioBasisKey({ ...options, doorways: [...doorways].reverse() }),
    )
  })

  it('changes for local or adjacent occupation, but not for a remote room', () => {
    const doorways = [door('room', 'hall', 1)]
    const key = roomAudioBasisKey({ spaceId: 'room', doorways, namedOccupants: { room: 1 } })
    expect(roomAudioBasisKey({ spaceId: 'room', doorways, namedOccupants: { room: 2 } })).not.toBe(
      key,
    )
    expect(
      roomAudioBasisKey({ spaceId: 'room', doorways, namedOccupants: { room: 1, hall: 1 } }),
    ).not.toBe(key)
    expect(
      roomAudioBasisKey({ spaceId: 'room', doorways, namedOccupants: { room: 1, remote: 8 } }),
    ).toBe(key)
  })

  it('changes when a door closes or another neighbour is selected', () => {
    const doorways = [door('room', 'hall', 1)]
    const basis = { spaceId: 'room', doorways, namedOccupants: {} }
    const hall = roomAudioKey({ ...basis, neighbour: { spaceId: 'hall', at: [1, 0] } })
    expect(roomAudioKey({ ...basis, neighbour: null })).not.toBe(hall)
    expect(roomAudioKey({ ...basis, doorways: [], neighbour: null })).not.toBe(hall)
    expect(roomAudioKey({ ...basis, neighbour: { spaceId: 'kitchen', at: [2, 0] } })).not.toBe(hall)
  })
})
