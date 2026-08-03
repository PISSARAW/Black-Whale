import { describe, expect, it } from 'vitest'
import { deployScout, inspectForgery, moveScout, recognizesDisguise } from './hatsuSpatial'

describe('spatial Hatsu consequences', () => {
  it('makes Little Eye observable and signal-bound', () => {
    const moved = moveScout(deployScout([0, 0], 'hall'), {
      position: [30, 0],
      spaceId: 'office',
      visibleToGuard: true,
    })
    expect(moved).toMatchObject({ noticed: true, active: false, signal: 0 })
  })
  it('separates visual, tactile and registry forgery checks', () => {
    expect(inspectForgery('visual', false)).toBe('accepted')
    expect(inspectForgery('touch', false)).toBe('revealed')
  })
  it('lets personal knowledge expose behaviour rather than magic vision', () => {
    expect(
      recognizesDisguise({
        knowsModel: true,
        behaviouralMismatch: false,
        usesGyo: false,
        active: true,
      }),
    ).toBe(false)
    expect(
      recognizesDisguise({
        knowsModel: true,
        behaviouralMismatch: true,
        usesGyo: false,
        active: true,
      }),
    ).toBe(true)
  })
})
