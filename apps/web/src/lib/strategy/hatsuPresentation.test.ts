import { describe, expect, it } from 'vitest'
import { STRATEGY_ABILITY_IDS_BY_CHARACTER } from './hatsu'
import { strategyHatsuPresentation } from './hatsuPresentation'

describe('Strategy Hatsu audiovisual presentation', () => {
  it('gives every playable Hatsu a manifestation, sound and lifetime', () => {
    for (const abilityId of Object.values(STRATEGY_ABILITY_IDS_BY_CHARACTER).flat()) {
      const presentation = strategyHatsuPresentation(abilityId)
      expect(presentation, abilityId).not.toBeNull()
      expect(presentation?.kind).toBeTruthy()
      expect(presentation?.sound).toBeTypeOf('function')
      expect(presentation?.durationMs).toBeGreaterThan(1000)
    }
  })
})
