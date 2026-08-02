import { describe, expect, it } from 'vitest'
import { room1014Case } from './case'
import { ROOM_1014_SIGHT_LINES, sceneNodes, visibleSightLines } from './geometry'

describe('room 1014 geometry', () => {
  it('places every investigation subject on the scene plan', () => {
    expect(sceneNodes(room1014Case)).toHaveLength(room1014Case.subjects.length)
  })

  it('gives only Loberry a visible line to the doll', () => {
    expect(visibleSightLines('doll').map((line) => line.observerId)).toEqual(['loberry'])
    expect(
      ROOM_1014_SIGHT_LINES.find(
        (line) => line.observerId === 'furykov' && line.phenomenon === 'doll',
      )?.visible,
    ).toBe(false)
  })

  it('makes the materialized snakes visible to multiple witnesses', () => {
    expect(visibleSightLines('snakes').length).toBeGreaterThanOrEqual(3)
  })
})
