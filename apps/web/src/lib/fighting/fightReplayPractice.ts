import type { FightState } from './types'

declare module './types' {
  interface FightState {
    /** A local rehearsal is never a career result or an authoritative PvP match. */
    replayPractice?: { source: string; packet: number }
  }
}

export function canPracticeReplay(state: FightState): boolean {
  return (
    state.phase === 'fighting' &&
    !state.forecastSimulation &&
    !state.pvpSeat &&
    !state.spectatorView &&
    !state.teamMatch
  )
}

/** Clone the real simulation, including commitments and RNG; never copy the displayed vision. */
export function practiceReplay(
  state: FightState,
  source: string,
  packet: number,
): FightState | null {
  if (!canPracticeReplay(state)) return null
  return {
    ...structuredClone(state),
    mode: 'versus-local',
    training: undefined,
    replayPractice: { source, packet },
  }
}
