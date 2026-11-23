import { encodeFightSnapshot } from '../fightReplaySnapshot'
import { fightReplayHash } from '../fightReplayHash'
import { projectFightState } from '../perception/stateProjection'
import type { FightState } from '../types'
declare module '../types' {
  interface FightState {
    spectatorView?: boolean
  }
}

/** Intersection of public manifestations: neither player's private observer can be selected. */
export function spectatorSnapshot(state: FightState) {
  const view = projectFightState(state, { kind: 'spectator' })
  return { snapshot: encodeFightSnapshot(view), snapshotHash: fightReplayHash(view) }
}
