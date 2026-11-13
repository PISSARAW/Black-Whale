import type { ArenaHandoff } from '../arena/bridge'
import type { FighterCondition } from '../combat/types'
import type { HuntState } from './state'

export const HUNT_ARENA_CHECKPOINT_KEY = 'black-whale:hunt:arena-checkpoint:v1'

export interface HuntArenaCheckpoint<TContext = unknown> {
  version: 1
  handoffId: string
  state: HuntState
  context: TContext
}

interface CheckpointStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function huntArenaHandoff(
  state: HuntState,
  id: string,
  returnHref: string,
): ArenaHandoff | null {
  if (!state.duel || state.duel.outcome !== 'playing') return null
  return {
    version: 1,
    id,
    sourceMode: 'HUNT',
    context: 'CLANDESTINE',
    playerAura: state.duel.player.pool.available,
    opponentAura: state.duel.hunter.pool.available,
    playerCondition: conditionOf(state.duel.player.broken),
    opponentCondition: conditionOf(state.duel.hunter.broken),
    knownOpponentHatsuIds: state.hatsuIntel.confirmedAbilityId
      ? [state.hatsuIntel.confirmedAbilityId]
      : [],
    nenEffects: [],
    returnHref,
  }
}

export function saveHuntArenaCheckpoint<TContext>(
  storage: CheckpointStorage,
  checkpoint: HuntArenaCheckpoint<TContext>,
): void {
  storage.setItem(HUNT_ARENA_CHECKPOINT_KEY, JSON.stringify(checkpoint))
}

export function consumeHuntArenaCheckpoint<TContext>(
  storage: CheckpointStorage,
): HuntArenaCheckpoint<TContext> | null {
  const serialized = storage.getItem(HUNT_ARENA_CHECKPOINT_KEY)
  storage.removeItem(HUNT_ARENA_CHECKPOINT_KEY)
  if (!serialized) return null
  try {
    const checkpoint = JSON.parse(serialized) as HuntArenaCheckpoint<TContext>
    return checkpoint.version === 1 && checkpoint.handoffId && checkpoint.state ? checkpoint : null
  } catch {
    return null
  }
}

function conditionOf(broken: boolean): FighterCondition {
  return broken ? 'down' : 'ready'
}
