import { describe, expect, it } from 'vitest'
import { trajectoryPath } from './trajectory'

describe('reconstruction trajectories', () => {
  it('draws a curved route between different decks', () => {
    expect(trajectoryPath({ x: 20, y: 30 }, { x: 60, y: 70 })).toBe('M 20 30 Q 47.2 50 60 70')
  })

  it('keeps same-deck movement visible as an arc', () => {
    expect(trajectoryPath({ x: 20, y: 30 }, { x: 60, y: 30 })).toBe('M 20 30 Q 40 27 60 30')
  })
})
