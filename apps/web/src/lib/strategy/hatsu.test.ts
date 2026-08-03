import { describe, expect, it } from 'vitest'
import { messagesFor } from '$lib/i18n'
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
    // Asserted against the message table rather than a literal: the refusal is
    // localized, and a hard-coded French string here is what hid the fact that
    // the adapters were reading the wrong branch of it.
    expect(resolve('chain-jail').error).toBe(
      messagesFor('en').strategy.hatsu.chainJailRequiresSpider,
    )
    expect(resolve('chain-jail', { locale: 'fr' }).error).toBe(
      messagesFor('fr').strategy.hatsu.chainJailRequiresSpider,
    )
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
