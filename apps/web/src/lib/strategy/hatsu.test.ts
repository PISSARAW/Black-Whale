import { describe, expect, it } from 'vitest'
import { STRATEGY_ABILITY_IDS_BY_CHARACTER, hasStrategyHatsuAdapter, strategyHatsuResolution } from './hatsu'

const resolve = (abilityId: string, overrides = {}) =>
  strategyHatsuResolution({
    abilityId,
    sourceLocationId: 'room-a',
    targetLocationId: 'room-a',
    confirmedHostilesAtTarget: 0,
    eliminatedAllies: 0,
    targetHasSpider: false,
    ...overrides,
  })!

describe('Strategy Hatsu adapters', () => {
  it('provides individual adapters for every V3 roster Hatsu', () => {
    for (const id of Object.values(STRATEGY_ABILITY_IDS_BY_CHARACTER).flat())
      expect(hasStrategyHatsuAdapter(id), id).toBe(true)
  })

  it('keeps passive and vow-restricted abilities honest', () => {
    expect(resolve('cats-name').accepted).toBe(false)
    expect(resolve('chain-jail').error).toMatch(/Araignée/)
    expect(resolve('chain-jail', { targetHasSpider: true }).effects).toContain('DENIAL')
  })

  it('enforces position, observation and inheritance requirements', () => {
    expect(resolve('biohazard-hinrigh', { targetLocationId: 'room-b' }).accepted).toBe(false)
    expect(resolve('steal-chain').accepted).toBe(false)
    expect(resolve('steal-chain', { confirmedHostilesAtTarget: 1 }).accepted).toBe(true)
    expect(resolve('benjamin-baton').accepted).toBe(false)
    expect(resolve('benjamin-baton', { eliminatedAllies: 1 }).accepted).toBe(true)
  })
})
