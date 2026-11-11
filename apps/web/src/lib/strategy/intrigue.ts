import type { DiplomacyOrder } from './diplomacy'

export interface FactionPoliticalMemory {
  intelShared: number
  pactsProposed: number
  threatsReceived: number
  betrayals: number
  lastAction: DiplomacyOrder['action'] | null
  lastTurn: number | null
}

export type PoliticalMemory = Record<string, FactionPoliticalMemory>

export function initialFactionPoliticalMemory(): FactionPoliticalMemory {
  return {
    intelShared: 0,
    pactsProposed: 0,
    threatsReceived: 0,
    betrayals: 0,
    lastAction: null,
    lastTurn: null,
  }
}

/** Keep a durable account of how the player treated each faction. */
export function rememberDiplomacy(
  current: PoliticalMemory,
  orders: readonly DiplomacyOrder[],
  turn: number,
): PoliticalMemory {
  const next = Object.fromEntries(
    Object.entries(current).map(([id, memory]) => [id, { ...memory }]),
  )
  for (const order of orders) {
    const memory = next[order.factionId] ?? initialFactionPoliticalMemory()
    next[order.factionId] = {
      ...memory,
      intelShared: memory.intelShared + Number(order.action === 'SHARE_INTEL'),
      pactsProposed: memory.pactsProposed + Number(order.action === 'PROPOSE_PACT'),
      threatsReceived: memory.threatsReceived + Number(order.action === 'THREATEN'),
      betrayals: memory.betrayals + Number(order.action === 'BETRAY'),
      lastAction: order.action,
      lastTurn: turn,
    }
  }
  return next
}
