import type { ArenaHandoff } from '../arena/bridge'
import type { InfiltrationState } from './state'
import { objectivesPermitExtraction } from './missions/objectives'

export const INFILTRATION_ARENA_CHECKPOINT_KEY = 'black-whale:infiltration:arena-checkpoint:v1'

export interface InfiltrationArenaCheckpoint<TContext = unknown> {
  version: 1
  handoffId: string
  state: InfiltrationState
  context: TContext
}

interface CheckpointStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function infiltrationArenaHandoff(
  state: InfiltrationState,
  id: string,
  returnHref: string,
): ArenaHandoff | null {
  if (state.outcome !== 'identified' || !objectivesPermitExtraction(state.objectives)) return null
  return {
    version: 1,
    id,
    sourceMode: 'INFILTRATION',
    context: 'NARRATIVE',
    playerAura: state.hatsu.aura,
    opponentAura: 100,
    playerCondition: state.hatsu.aura < 25 ? 'staggered' : 'ready',
    opponentCondition: 'ready',
    knownOpponentHatsuIds: [],
    nenEffects: [],
    returnHref,
  }
}

export function saveInfiltrationArenaCheckpoint<TContext>(
  storage: CheckpointStorage,
  checkpoint: InfiltrationArenaCheckpoint<TContext>,
): void {
  storage.setItem(INFILTRATION_ARENA_CHECKPOINT_KEY, JSON.stringify(checkpoint))
}

export function consumeInfiltrationArenaCheckpoint<TContext>(
  storage: CheckpointStorage,
): InfiltrationArenaCheckpoint<TContext> | null {
  const serialized = storage.getItem(INFILTRATION_ARENA_CHECKPOINT_KEY)
  storage.removeItem(INFILTRATION_ARENA_CHECKPOINT_KEY)
  if (!serialized) return null
  try {
    const checkpoint = JSON.parse(serialized) as InfiltrationArenaCheckpoint<TContext>
    return checkpoint.version === 1 && checkpoint.handoffId && checkpoint.state ? checkpoint : null
  } catch {
    return null
  }
}
