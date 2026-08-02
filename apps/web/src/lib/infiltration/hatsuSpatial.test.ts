import { describe, expect, it } from 'vitest'
import { deployScout, inspectForgery, moveScout, recognizesDisguise } from './hatsuSpatial'

describe('spatial Hatsu consequences', () => {
  it('makes Little Eye observable and signal-bound', () => {
    const moved = moveScout(deployScout([0, 0], 'hall'), [30, 0], 'office', true)
    expect(moved).toMatchObject({ noticed: true, active: false, signal: 0 })
  })
  it('separates visual, tactile and registry forgery checks', () => {
    expect(inspectForgery('visual', false)).toBe('accepted')
    expect(inspectForgery('touch', false)).toBe('revealed')
  })
  it('lets personal knowledge expose behaviour rather than magic vision', () => {
    expect(recognizesDisguise(true, false, false, true)).toBe(false)
    expect(recognizesDisguise(true, true, false, true)).toBe(true)
  })
})
