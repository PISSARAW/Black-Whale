import { describe, expect, it } from 'vitest'
import { createStrategyCampaign } from './engine'
import { createCampaignSave, decodeCampaignSave, encodeCampaignSave } from './persistence'

describe('Strategy campaign persistence V3', () => {
  it('round-trips a checksummed campaign', () => {
    const save = createCampaignSave(createStrategyCampaign('stable'), '2026-08-02T00:00:00.000Z')
    expect(decodeCampaignSave(encodeCampaignSave(save))).toEqual(save)
  })

  it('rejects tampering and impossible progress', () => {
    const save = createCampaignSave(createStrategyCampaign('stable'), '2026-08-02T00:00:00.000Z')
    expect(decodeCampaignSave(JSON.stringify({ ...save, savedAt: 'tampered' }))).toBeNull()
    const impossible = createCampaignSave({ ...save.campaign, currentScenarioIndex: 99 }, save.savedAt)
    expect(decodeCampaignSave(encodeCampaignSave(impossible))).toBeNull()
  })
})
