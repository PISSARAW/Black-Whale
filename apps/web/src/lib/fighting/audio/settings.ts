import { DEFAULT_FIGHT_AUDIO, type FightAudioSettings } from './director'

const KEY = 'black-whale:fighting-audio'

export function readFightAudioSettings(): FightAudioSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<FightAudioSettings>
    const result = { ...DEFAULT_FIGHT_AUDIO, muted: stored.muted === true }
    for (const key of ['effects', 'ambience', 'tension'] as const) {
      const value = stored[key]
      if (typeof value === 'number' && Number.isFinite(value))
        result[key] = Math.max(0, Math.min(1, value))
    }
    return result
  } catch {
    return { ...DEFAULT_FIGHT_AUDIO }
  }
}

export function saveFightAudioSettings(settings: FightAudioSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* Storage may be disabled. */
  }
}
