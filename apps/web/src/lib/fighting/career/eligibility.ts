import type { FightState } from '../types'

/** Optional practice/team markers may be supplied by an extended match state. */
export function isCareerDuel(state: FightState): boolean {
  return (
    state.mode !== 'training' &&
    !state.soloSession &&
    !('replayPractice' in state && state.replayPractice) &&
    !('teamMatch' in state && state.teamMatch)
  )
}
