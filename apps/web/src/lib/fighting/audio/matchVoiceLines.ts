import { fightFormat } from '../formats'
import type { FightState } from '../types'

const FINISH_LINES = {
  knockout: 'knockout',
  'technical-knockout': 'technical',
  hits: 'points',
  expulsion: 'expulsion',
} as const

export type BoardLine =
  | 'start'
  | 'decisive'
  | 'time'
  | 'draw'
  | 'player'
  | 'opponent'
  | 'player-match'
  | 'opponent-match'
  | (typeof FINISH_LINES)[keyof typeof FINISH_LINES]

export function matchVoiceLines(before: FightState | null, after: FightState): BoardLine[] {
  if (after.mode === 'training') return []
  if (after.phase === 'fighting') return startsRound(before, after) ? [startLine(after)] : []
  if (before?.phase === 'fighting' && after.phase === 'finished') return verdictLines(after)
  return []
}

function startsRound(before: FightState | null, after: FightState) {
  if (!before) return after.frame <= 1
  return (
    before.phase !== 'fighting' ||
    before.roundNumber !== after.roundNumber ||
    after.frame < before.frame
  )
}

function startLine(state: FightState): BoardLine {
  const tied = state.roundsWon.player === 1 && state.roundsWon.opponent === 1
  return state.roundNumber >= 3 && tied && !state.teamMatch ? 'decisive' : 'start'
}

function verdictLines(state: FightState): BoardLine[] {
  const { winner, finishReason, matchWinner } = state
  const lines: BoardLine[] = []
  if (finishReason === 'time') lines.push('time')
  if (!winner || winner === 'draw') return [...lines, 'draw']
  if (finishReason && finishReason !== 'time') lines.push(FINISH_LINES[finishReason])
  if (finishReason === 'time' && decidedOnScore(state)) lines.push('points')
  lines.push(matchWinner === winner ? `${winner}-match` : winner)
  return lines
}

function decidedOnScore(state: FightState) {
  return (
    fightFormat(state.formatId).victory !== 'health' && state.score.player !== state.score.opponent
  )
}
