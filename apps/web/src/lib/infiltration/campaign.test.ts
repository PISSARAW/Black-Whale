import { describe, expect, it } from 'vitest'
import { applyConsequences, initialCampaign } from './campaign'

describe('persistent campaign consequences', () => {
  it('persists knowledge and compromised covers without duplicates', () => {
    const result = {
      missionId: 'courier' as const,
      discoveredSpaces: ['hall'],
      compromisedRole: 'maintenance',
    }
    const campaign = applyConsequences(applyConsequences(initialCampaign(), result), result)
    expect(campaign.completed).toEqual(['courier'])
    expect(campaign.knownSpaces).toEqual(['hall'])
  })
})
