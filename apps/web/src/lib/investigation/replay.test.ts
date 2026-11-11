import { describe, expect, it } from 'vitest'
import { frameAt } from './replay'

describe('eleven-second replay', () => {
  it('clamps the replay to the canonical window', () => {
    expect(frameAt(-2).second).toBe(0)
    expect(frameAt(20).second).toBe(11)
  })

  it('materializes four attackers after the diversion', () => {
    expect(frameAt(1).snakes).toBe(0)
    expect(frameAt(2).snakes).toBe(4)
  })

  it('ends with Barrigen exsanguinated', () => {
    expect(frameAt(11)).toMatchObject({ stage: 'death', bloodLevel: 0 })
  })

  it('opens on the doll in the visitor’s language', () => {
    expect(frameAt(0, 'fr').title).toBe('La poupée apparaît')
    expect(frameAt(0, 'en').title).toBe('Doll appears')
  })
})
