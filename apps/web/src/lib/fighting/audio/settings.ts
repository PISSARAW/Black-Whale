import { writable } from 'svelte/store'
import { readTrackChoice, type ClashTrackChoice } from './jukebox'

export const fightAudioChanges = writable(0)
export type CombatVoiceStyle = 'original' | 'low' | 'clear'
export const COMBAT_VOICE_RATES: Record<CombatVoiceStyle, number> = {
  original: 1,
  low: 0.86,
  clear: 1.12,
}

export const FIGHT_CHANNELS = [
  'effects',
  'movement',
  'techniques',
  'voices',
  'announcer',
  'commentary',
  'description',
  'interface',
  'music',
  'ambience',
  'tension',
  'cinematics',
] as const
export type FightChannel = (typeof FIGHT_CHANNELS)[number]
export type FightAudioSettings = Record<FightChannel, number> & {
  muted: boolean
  mono: boolean
  captions: boolean
  menuTrack: ClashTrackChoice
  battleTrack: ClashTrackChoice
  voiceStyle: CombatVoiceStyle
}

export const DEFAULT_FIGHT_AUDIO: FightAudioSettings = {
  muted: false,
  mono: false,
  captions: false,
  menuTrack: 'auto',
  battleTrack: 'auto',
  voiceStyle: 'original',
  effects: 0.85,
  movement: 0.85,
  techniques: 0.85,
  voices: 0.85,
  announcer: 0.88,
  commentary: 0,
  description: 0,
  interface: 0.8,
  music: 0.65,
  ambience: 0.65,
  tension: 0.65,
  cinematics: 0.78,
}

export const FIGHT_AUDIO_PRESETS = {
  default: DEFAULT_FIGHT_AUDIO,
  competitive: {
    ...DEFAULT_FIGHT_AUDIO,
    effects: 1,
    movement: 0.8,
    techniques: 0.95,
    voices: 0.4,
    announcer: 0.5,
    ambience: 0.2,
    music: 0.2,
    tension: 0.25,
  },
  accessible: {
    ...DEFAULT_FIGHT_AUDIO,
    captions: true,
    effects: 1,
    movement: 0.95,
    interface: 1,
    announcer: 1,
    description: 0.88,
    techniques: 0.95,
    ambience: 0.15,
    music: 0.1,
    tension: 0.15,
  },
} satisfies Record<string, FightAudioSettings>

const KEY = 'black-whale:fighting-audio'

export function readFightAudioSettings(): FightAudioSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<FightAudioSettings>
    const result: FightAudioSettings = {
      ...DEFAULT_FIGHT_AUDIO,
      muted: stored.muted === true,
      mono: stored.mono === true,
      captions: stored.captions === true,
      menuTrack: readTrackChoice(stored.menuTrack),
      battleTrack: readTrackChoice(stored.battleTrack),
      voiceStyle:
        stored.voiceStyle === 'low' || stored.voiceStyle === 'clear'
          ? stored.voiceStyle
          : 'original',
    }
    const legacy = {
      movement: stored.effects,
      techniques: stored.effects,
      voices: stored.effects,
      interface: stored.effects,
      music: stored.ambience,
      cinematics: stored.effects,
    }
    for (const key of FIGHT_CHANNELS) {
      const value = stored[key] ?? legacy[key as keyof typeof legacy]
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
    fightAudioChanges.update((value) => value + 1)
  } catch {
    /* Storage may be disabled. */
  }
}
