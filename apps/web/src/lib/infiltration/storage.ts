import { decodeSave, encodeSave, type InfiltrationSave } from './persistence'
import type { InfiltrationState } from './state'
import type { CampaignState } from './campaign'

const GAME_KEY = 'black-whale:infiltration:v3'
const LEGACY_GAME_KEY = 'black-whale:infiltration:v2'
const CAMPAIGN_KEY = 'black-whale:infiltration:campaign:v1'

/**
 * Local storage can be missing, full or forbidden (private windows, blocked
 * site data). None of that may stop a mission, so every access is guarded
 * and a failure just means nothing was kept.
 */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* Nothing kept: the mission goes on. */
  }
}

export function loadCampaign(): CampaignState | null {
  try {
    const stored = JSON.parse(read(CAMPAIGN_KEY) ?? 'null')
    return stored?.version === 1 ? (stored as CampaignState) : null
  } catch {
    return null
  }
}

export const saveCampaign = (campaign: CampaignState) =>
  write(CAMPAIGN_KEY, JSON.stringify(campaign))

/** The mission left in progress, if there is one worth resuming. */
export function loadGame(): InfiltrationSave | null {
  const saved = decodeSave(read(GAME_KEY) ?? read(LEGACY_GAME_KEY) ?? '')
  return saved?.state.outcome === 'playing' ? saved : null
}

export const saveGame = (state: InfiltrationState) => write(GAME_KEY, encodeSave(state))

/** A finished mission must not come back on the next visit. */
export function clearGame(): void {
  write(GAME_KEY, null)
  write(LEGACY_GAME_KEY, null)
}
