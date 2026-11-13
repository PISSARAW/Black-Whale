import type { CombatSide } from '../../combat/types'
import type { ArenaServerSnapshot, NetworkAction } from './serverMatch'

export interface ArenaPvpSession {
  matchId: string
  playerToken: string
  side: CombatSide
  inviteHref: string
}

export interface ArenaPvpView {
  matchId: string
  status: 'waiting' | 'playing' | 'finished'
  side: CombatSide
  nextSequence: number
  snapshot: ArenaServerSnapshot | null
}

export interface ArenaPvpCommand {
  sequence: number
  action: NetworkAction
}

export function pvpSessionKey(matchId: string): string {
  return `black-whale:arena:pvp:${matchId}`
}
