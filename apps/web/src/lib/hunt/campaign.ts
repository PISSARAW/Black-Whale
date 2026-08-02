import type { HuntHatsuId } from './hatsu'
import type { HuntOutcome } from './outcome'
import type { WoundedLimb } from './nen/advanced'

export const HUNT_CAMPAIGN_VERSION = 1 as const
export const HUNT_CAMPAIGN_KEY = 'black-whale:hunt-v3-campaign'

export interface ContractRecord { attempts: number; wins: number; bestSeconds: number | null }
export interface HuntCampaign {
  schemaVersion: typeof HUNT_CAMPAIGN_VERSION
  contracts: Record<string, ContractRecord>
  mastery: Record<HuntHatsuId, number>
  persistentWounds: WoundedLimb[]
  lastContractId: string | null
}

export interface CampaignStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function initialCampaign(): HuntCampaign {
  return {
    schemaVersion: HUNT_CAMPAIGN_VERSION,
    contracts: {},
    mastery: { 'bungee-gum': 0, 'parallel-future': 0, 'dowsing-chain': 0 },
    persistentWounds: [],
    lastContractId: null,
  }
}

export function completeCampaignRun(
  campaign: HuntCampaign,
  run: { contractId: string; hatsu: HuntHatsuId; outcome: HuntOutcome; seconds: number; wounds: WoundedLimb[] },
): HuntCampaign {
  const previous = campaign.contracts[run.contractId] ?? { attempts: 0, wins: 0, bestSeconds: null }
  const won = run.outcome === 'reached' || run.outcome === 'eliminated'
  const bestSeconds = won && (previous.bestSeconds === null || run.seconds < previous.bestSeconds)
    ? run.seconds
    : previous.bestSeconds
  return {
    ...campaign,
    contracts: {
      ...campaign.contracts,
      [run.contractId]: { attempts: previous.attempts + 1, wins: previous.wins + (won ? 1 : 0), bestSeconds },
    },
    mastery: { ...campaign.mastery, [run.hatsu]: campaign.mastery[run.hatsu] + (won ? 2 : 1) },
    persistentWounds: [...new Set([...campaign.persistentWounds, ...run.wounds])],
    lastContractId: run.contractId,
  }
}

export function loadCampaign(storage: CampaignStorage): HuntCampaign {
  try {
    const raw = storage.getItem(HUNT_CAMPAIGN_KEY)
    if (!raw) return initialCampaign()
    const parsed = JSON.parse(raw) as Partial<HuntCampaign>
    return parsed.schemaVersion === HUNT_CAMPAIGN_VERSION
      ? { ...initialCampaign(), ...parsed } as HuntCampaign
      : initialCampaign()
  } catch {
    return initialCampaign()
  }
}

export function saveCampaign(storage: CampaignStorage, campaign: HuntCampaign): boolean {
  try { storage.setItem(HUNT_CAMPAIGN_KEY, JSON.stringify(campaign)); return true } catch { return false }
}

export function resetCampaign(storage: CampaignStorage): void {
  try { storage.removeItem(HUNT_CAMPAIGN_KEY) } catch { /* storage is optional */ }
}
