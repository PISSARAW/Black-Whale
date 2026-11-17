import type { PvpStatus } from '$lib/fighting/pvp/types'
import type { FightSide } from '$lib/fighting/types'
export interface ClashPvpTerminal {
  id: string
  status: PvpStatus
  winner: FightSide | null
  disconnected: FightSide | null
  voluntary: boolean
  connected: Record<FightSide, boolean>
  started: boolean
}
