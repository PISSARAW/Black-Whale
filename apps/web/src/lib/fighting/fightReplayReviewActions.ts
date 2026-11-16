import type { FightMatchRuntime } from './fightMatchRuntime'
import type { ReplayReviewActions } from './fightReplayReview'
import type { FightState } from './types'

/** Page callbacks keep the replay controller independent of UI state and input devices. */
export function createReplayReviewActions(options: {
  match: FightMatchRuntime
  update: (state: FightState) => void
  release: () => void
  onTakeover: () => void
}): ReplayReviewActions {
  function update(state: FightState | null) {
    if (!state) return
    options.update(state)
    options.release()
  }
  return {
    seek: (packet) => update(options.match.seekReplay(packet)),
    takeover() {
      const state = options.match.takeoverReplay()
      if (!state) return
      options.onTakeover()
      update(state)
    },
    repeat: () => update(options.match.repeatReplayPractice()),
    returnToReplay: () => update(options.match.returnToReplay()),
  }
}
