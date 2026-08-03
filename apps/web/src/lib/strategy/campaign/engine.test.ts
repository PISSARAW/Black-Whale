import { describe, expect, it } from 'vitest'
import { completeCampaignScenario, createStrategyCampaign, currentCampaignScenario } from './engine'

describe('Strategy campaign V3', () => {
  it('progresses deterministically through three scenarios', () => {
    let campaign = createStrategyCampaign('seed-359')
    expect(currentCampaignScenario(campaign)?.id).toBe('succession-guards-359')
    campaign = completeCampaignScenario(campaign, {
      scenarioId: 'succession-guards-359',
      selectedFactionId: 'prince-woble',
      won: true,
      turnsPlayed: 6,
      victoryPoints: 3,
      relationships: {
        'prince-benjamin': { trust: 50, fear: 0, pact: true, betrayed: false },
      },
      unitConditions: { kurapika: 'WOUNDED' },
    })
    expect(currentCampaignScenario(campaign)?.id).toBe('mafia-war-390')
    expect(campaign.reputation).toBe('RELIABLE')
    expect(campaign.unitConditions.kurapika).toBe('WOUNDED')
    expect(campaign.chronicle.at(-1)).toContain('prince-woble remporte')
  })

  it('keeps the most severe condition and remembers betrayal', () => {
    let campaign = createStrategyCampaign('seed-memory')
    campaign = completeCampaignScenario(campaign, {
      scenarioId: 'succession-guards-359',
      selectedFactionId: 'prince-camilla',
      won: false,
      turnsPlayed: 8,
      victoryPoints: 1,
      relationships: { 'prince-woble': { trust: -100, fear: 20, pact: false, betrayed: true } },
      unitConditions: { sarahell: 'ELIMINATED' },
    })
    expect(campaign.reputation).toBe('TREACHEROUS')
    expect(campaign.relationships['prince-woble'].betrayed).toBe(true)
    expect(() =>
      completeCampaignScenario(campaign, {
        scenarioId: 'succession-lockdown-400',
        selectedFactionId: 'prince-camilla',
        won: true,
        turnsPlayed: 1,
        victoryPoints: 3,
        relationships: {},
        unitConditions: {},
      }),
    ).toThrow(/Expected campaign scenario mafia-war-390/)
  })
})
