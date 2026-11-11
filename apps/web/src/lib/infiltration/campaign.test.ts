import { describe, expect, it } from 'vitest'
import { applyCampaignContext, applyConsequences, initialCampaign } from './campaign'
import { initialInfiltrationState } from './state'

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

  it('makes a compromised cover measurably harder in the next mission', () => {
    const state = initialInfiltrationState({
      playerAt: { position: [0, 0], spaceId: 'entry' },
      objectiveSpaceId: 'office',
      extractionSpaceId: 'entry',
      witnesses: [
        {
          id: 'steward',
          position: [0, 0],
          heading: 0,
          spaceId: 'entry',
          sight: 8,
          social: true,
          usesEn: false,
          route: ['entry'],
        },
      ],
    })
    const campaign = { ...initialCampaign(), compromisedRoles: ['maintenance'] }
    const prepared = applyCampaignContext(state, campaign)
    expect(prepared.coverIntegrity).toBe(65)
    expect(prepared.alertLevel).toBe('doubt')
    expect(prepared.security.verifyDocuments).toBe(true)
    expect(prepared.witnesses[0].belief.certainty).toBe(15)
  })
})
