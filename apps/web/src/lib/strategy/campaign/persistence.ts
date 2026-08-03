import { strategyChecksum } from '../replay/checksum'
import type { StrategySaveV2 } from '../replay/types'
import { createStrategyCampaign } from './engine'
import type { StrategyCampaignV3 } from './types'

export const STRATEGY_CAMPAIGN_KEY = 'black-whale:strategy:campaign:v3'
export const MAX_STRATEGY_CAMPAIGN_BYTES = 250_000

export interface StrategyCampaignSaveV3 {
  version: 3
  savedAt: string
  campaign: StrategyCampaignV3
  legacyScenario?: StrategySaveV2
  checksum: string
}

function payload(save: Omit<StrategyCampaignSaveV3, 'checksum'> | StrategyCampaignSaveV3) {
  const { checksum: _checksum, ...content } = save as StrategyCampaignSaveV3
  return content
}

export function createCampaignSave(
  campaign: StrategyCampaignV3,
  savedAt: string,
  legacyScenario?: StrategySaveV2,
): StrategyCampaignSaveV3 {
  const content = {
    version: 3 as const,
    savedAt,
    campaign,
    ...(legacyScenario ? { legacyScenario } : {}),
  }
  return { ...content, checksum: strategyChecksum(content) }
}

export function migrateStrategySaveV2(save: StrategySaveV2): StrategyCampaignSaveV3 {
  const campaign = createStrategyCampaign(save.seed)
  return createCampaignSave(campaign, save.savedAt, save)
}

export function encodeCampaignSave(save: StrategyCampaignSaveV3): string {
  return JSON.stringify(save)
}

function validCampaign(campaign: unknown): campaign is StrategyCampaignV3 {
  if (!campaign || typeof campaign !== 'object') return false
  const value = campaign as StrategyCampaignV3
  return (
    value.version === 3 &&
    typeof value.id === 'string' &&
    typeof value.seed === 'string' &&
    Number.isInteger(value.currentScenarioIndex) &&
    Array.isArray(value.scenarioIds) &&
    Array.isArray(value.outcomes) &&
    Array.isArray(value.chronicle) &&
    typeof value.relationships === 'object' &&
    typeof value.unitConditions === 'object' &&
    typeof value.completed === 'boolean'
  )
}

export function decodeCampaignSave(serialized: string | null): StrategyCampaignSaveV3 | null {
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_STRATEGY_CAMPAIGN_BYTES)
    return null
  try {
    const parsed = JSON.parse(serialized) as StrategyCampaignSaveV3
    if (parsed.version !== 3 || !parsed.savedAt || !validCampaign(parsed.campaign)) return null
    if (parsed.campaign.currentScenarioIndex < 0) return null
    if (parsed.campaign.currentScenarioIndex > parsed.campaign.scenarioIds.length) return null
    return strategyChecksum(payload(parsed)) === parsed.checksum ? parsed : null
  } catch {
    return null
  }
}
