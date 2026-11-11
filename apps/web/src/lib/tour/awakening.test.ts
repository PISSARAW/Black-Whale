import { describe, expect, it } from 'vitest'
import { awakeningAvailability, awakensWith, NODES_SHUT, refusedBeforeAwakening } from './awakening'

describe('opening the nodes', () => {
  it('is done by Ten or Ren, and by nothing else', () => {
    expect(awakensWith({ type: 'TEN' })).toBe(true)
    expect(awakensWith({ type: 'REN' })).toBe(true)
    expect(awakensWith({ type: 'GYO', on: true })).toBe(false)
    expect(awakensWith({ type: 'ZETSU' })).toBe(false)
  })

  it('refuses every other press while the nodes are shut', () => {
    expect(refusedBeforeAwakening(false, { type: 'GYO', on: true })).toBe(true)
    expect(refusedBeforeAwakening(false, { type: 'EN', radius: 8 })).toBe(true)
    expect(refusedBeforeAwakening(false, { type: 'TEN' })).toBe(false)
  })

  it('refuses nothing once awake', () => {
    expect(refusedBeforeAwakening(true, { type: 'GYO', on: true })).toBe(false)
  })

  it('greys out everything but Ten and Ren before awakening, and nothing after', () => {
    const shut = awakeningAvailability(false)
    expect(shut.gyo).toBe(NODES_SHUT)
    expect(shut.ten).toBeUndefined()
    expect(shut.ren).toBeUndefined()
    expect(awakeningAvailability(true)).toEqual({})
  })
})
