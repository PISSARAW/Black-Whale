import { describe, expect, it } from 'vitest'
import {
  completeCampaignRun,
  initialCampaign,
  loadCampaign,
  saveCampaign,
  type CampaignStorage,
} from './campaign'

function memory(): CampaignStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}

describe('persistent Hunt campaign', () => {
  it('records attempts, mastery, best wins and consequences', () => {
    const campaign = completeCampaignRun(initialCampaign(), {
      contractId: 'royal-apartments',
      hatsu: 'bungee-gum',
      outcome: 'reached',
      seconds: 120,
      wounds: ['left-leg'],
    })
    expect(campaign.contracts['royal-apartments']).toEqual({
      attempts: 1,
      wins: 1,
      bestSeconds: 120,
    })
    expect(campaign.mastery['bungee-gum']).toBe(2)
    expect(campaign.persistentWounds).toEqual(['left-leg'])
  })

  it('round-trips locally and isolates corrupt saves', () => {
    const storage = memory()
    const campaign = { ...initialCampaign(), lastContractId: 'blackout-siege' }
    expect(saveCampaign(storage, campaign)).toBe(true)
    expect(loadCampaign(storage).lastContractId).toBe('blackout-siege')
    storage.setItem('black-whale:hunt-v3-campaign', '{bad')
    expect(loadCampaign(storage)).toEqual(initialCampaign())
  })
})
