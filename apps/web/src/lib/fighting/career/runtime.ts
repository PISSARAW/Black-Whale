import { REPLAY_RULESET } from '../fightReplayTypes'
import type { FightState } from '../types'
import { createMatchPractice } from './practice'
import type { CareerMatch } from './types'

export function createCareerTracker(record: (match: CareerMatch) => void, now = Date.now) {
  let id = '',
    initial: FightState | null = null,
    done = false
  let practice = createMatchPractice()
  return {
    begin(state: FightState | null) {
      initial = state?.mode !== 'training' ? state : null
      id = crypto.randomUUID()
      done = false
      practice = createMatchPractice()
    },
    observe(before: FightState, after: FightState) {
      if (!initial || done || after.mode === 'training') return
      practice.observe(before, after)
      if (!after.matchWinner || after.phase !== 'finished') return
      done = true
      record({
        id,
        at: now(),
        source: initial.mode as CareerMatch['source'],
        player: initial.player.id,
        opponent: initial.opponent.id,
        stage: initial.environment.stageId,
        format: initial.formatId,
        winner: after.matchWinner,
        rounds: { ...after.roundsWon },
        practice: practice.snapshot(),
        ruleset: REPLAY_RULESET,
      })
    },
  }
}
export type CareerTracker = ReturnType<typeof createCareerTracker>
