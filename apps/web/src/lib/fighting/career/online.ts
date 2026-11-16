import { clashCareer } from './profile'
import { decodeFightSnapshot } from '../fightReplaySnapshot'
import type { PvpView } from '../pvp/types'
import { validPractice } from './storage'

/** Called only after the network client has verified the seat-specific snapshot. */
export function recordOnlineCareer(view: PvpView) {
  if (
    typeof window === 'undefined' ||
    view.status !== 'finished' ||
    !view.practice ||
    !validPractice(view.practice)
  )
    return
  const local = view.side === 'player'
  const state = decodeFightSnapshot(view.snapshot, {
    ...view.setup,
    mode: 'versus-ai',
    player: local ? view.setup.player : view.setup.opponent,
    opponent: local ? view.setup.opponent : view.setup.player,
  })
  if (!state.matchWinner) return
  clashCareer.record({
    id: `pvp:${view.matchId}`,
    at: Date.now(),
    source: 'pvp',
    player: state.player.id,
    opponent: state.opponent.id,
    stage: view.setup.environment.stageId,
    format: view.setup.formatId,
    winner: state.matchWinner,
    rounds: state.roundsWon,
    ruleset: view.ruleset,
    practice: {
      frames: view.practice.frames,
      player: view.practice[view.side],
      opponent: view.practice[local ? 'opponent' : 'player'],
    },
  })
}
