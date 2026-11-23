import type { FightState } from '../types'

export type FightHudMode = 'tactical' | 'omniscient'
export type FightHudModePreference = 'auto' | FightHudMode

export interface ResolveHudModeInput {
  state: Pick<FightState, 'mode' | 'spectatorView'>
  replay?: boolean
  preference?: FightHudModePreference
}

const STORAGE_KEY = 'black-whale:clash-hud-mode:v1'
const VALID_PREFERENCES: readonly FightHudModePreference[] = ['auto', 'tactical', 'omniscient']

/**
 * Resolves whether the HUD operates in asymmetric HxH tactical mode (opacity by default,
 * earned clarity) or full omniscient arcade mode (training, replays, local versus).
 */
export function resolveFightHudMode(input: ResolveHudModeInput): FightHudMode {
  if (input.preference === 'tactical' || input.preference === 'omniscient') {
    return input.preference
  }
  if (input.replay || input.state.mode === 'training' || input.state.mode === 'versus-local') {
    return 'omniscient'
  }
  return 'tactical'
}

export function readHudModePreference(
  storage?: Pick<Storage, 'getItem'>,
): FightHudModePreference {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (raw && VALID_PREFERENCES.includes(raw as FightHudModePreference)) {
      return raw as FightHudModePreference
    }
    return 'auto'
  } catch {
    return 'auto'
  }
}

export function saveHudModePreference(
  value: FightHudModePreference,
  storage?: Pick<Storage, 'setItem'>,
): void {
  try {
    storage?.setItem(STORAGE_KEY, value)
  } catch {
    /* Session settings remain usable. */
  }
}

/** One-click toggle between full HUD and tactical HxH HUD. */
export function toggleHudModePreference(resolved: FightHudMode): FightHudMode {
  return resolved === 'omniscient' ? 'tactical' : 'omniscient'
}
