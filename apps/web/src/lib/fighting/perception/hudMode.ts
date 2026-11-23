import type { FightState } from '../types'

export type FightHudMode = 'tactical' | 'omniscient'
export type FightHudModePreference = 'auto' | FightHudMode

export interface ResolveHudModeInput {
  state: Pick<FightState, 'mode' | 'spectatorView'>
  replay?: boolean
  preference?: FightHudModePreference
}

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
