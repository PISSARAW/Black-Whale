import type { CombatState, FighterCondition, PersistentNenEffect } from '../combat/types'

export const ARENA_HANDOFF_KEY = 'black-whale:arena:handoff:v1'
export const ARENA_HANDOFF_RESULT_KEY = 'black-whale:arena:handoff-result:v1'

export type ArenaSourceMode = 'INVESTIGATION' | 'HUNT' | 'INFILTRATION'

export interface ArenaHandoff {
  version: 1
  id: string
  sourceMode: ArenaSourceMode
  context: 'CLANDESTINE' | 'NARRATIVE'
  playerAura: number
  opponentAura: number
  playerCondition: FighterCondition
  opponentCondition: FighterCondition
  knownOpponentHatsuIds: string[]
  nenEffects: PersistentNenEffect[]
}

export interface ArenaHandoffResult {
  version: 1
  handoffId: string
  outcome: CombatState['outcome']
  playerAura: number
  opponentAura: number
  playerCondition: FighterCondition
  opponentCondition: FighterCondition
  revealedHatsuIds: string[]
  nenEffects: PersistentNenEffect[]
  intervention: boolean
}

interface HandoffStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function saveArenaHandoff(storage: HandoffStorage, handoff: ArenaHandoff): void {
  storage.setItem(ARENA_HANDOFF_KEY, JSON.stringify(handoff))
}

export function consumeArenaHandoff(storage: HandoffStorage): ArenaHandoff | null {
  const serialized = storage.getItem(ARENA_HANDOFF_KEY)
  storage.removeItem(ARENA_HANDOFF_KEY)
  if (!serialized) return null
  try {
    const handoff = JSON.parse(serialized) as ArenaHandoff
    return handoff.version === 1 && handoff.id && handoff.sourceMode ? handoff : null
  } catch {
    return null
  }
}

export function applyArenaHandoff(state: CombatState, handoff: ArenaHandoff): CombatState {
  return {
    ...state,
    player: {
      ...state.player,
      aura: Math.max(0, Math.min(state.player.capacity, handoff.playerAura)),
      condition: handoff.playerCondition,
    },
    opponent: {
      ...state.opponent,
      aura: Math.max(0, Math.min(state.opponent.capacity, handoff.opponentAura)),
      condition: handoff.opponentCondition,
    },
    nenEffects: structuredClone(handoff.nenEffects),
    opponentMemory: {
      ...state.opponentMemory,
      hypothesis: {
        ...state.opponentMemory.hypothesis,
        knownHatsuIds: [...handoff.knownOpponentHatsuIds],
      },
    },
    environment: { ...state.environment, context: handoff.context },
  }
}

export function saveArenaHandoffResult(
  storage: HandoffStorage,
  handoffId: string,
  state: CombatState,
): ArenaHandoffResult {
  const result: ArenaHandoffResult = {
    version: 1,
    handoffId,
    outcome: state.outcome,
    playerAura: state.player.aura,
    opponentAura: state.opponent.aura,
    playerCondition: state.player.condition,
    opponentCondition: state.opponent.condition,
    revealedHatsuIds: [
      ...new Set(Object.values(state.lastHatsuBySide).filter((id): id is string => Boolean(id))),
    ],
    nenEffects: structuredClone(state.nenEffects),
    intervention: state.environment.intervened,
  }
  storage.setItem(ARENA_HANDOFF_RESULT_KEY, JSON.stringify(result))
  return result
}
