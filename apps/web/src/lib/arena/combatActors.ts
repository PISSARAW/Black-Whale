import type { FighterState } from '../combat/types'
import type { FighterDefinition } from '../fighting/types'
import type { Apparition } from '../tour/apparitions'
import type { ArenaCombatMotion } from './presentation'

interface OpponentActorOptions {
  fighter: FighterDefinition
  state: FighterState
  motion: ArenaCombatMotion
  intentVisible: boolean
  ground: number
  spaceId: string
  tierId: string
  colour: number
  stage: number
  nen: NonNullable<NonNullable<Apparition['human']>['nen']>
}

/** Projects Arena's deterministic body state into the shared Tour human renderer. */
export function arenaOpponentActor(options: OpponentActorOptions): Apparition {
  const { fighter, state, motion, intentVisible, ground, spaceId, tierId, colour, stage, nen } =
    options
  return {
    id: 'arena-opponent',
    kind: 'combatant',
    spaceId,
    tierId,
    at: state.position,
    heading: state.facing,
    y: ground + state.height,
    size: 1,
    colour,
    stage,
    human: {
      role: fighter.modelRole,
      identity: fighter.modelId,
      pose: opponentPose(state, motion, intentVisible),
      aura: state.mode,
      nen,
    },
    hidden: false,
    pick: true,
  }
}

function opponentPose(
  state: FighterState,
  motion: ArenaCombatMotion,
  intentVisible: boolean,
): NonNullable<Apparition['human']>['pose'] {
  if (state.condition === 'down' || state.condition === 'ko') return 'fallen'
  if (intentVisible || motion === 'attack') return 'attack'
  if (motion === 'guard') return 'guard'
  return motion === 'hit' ? 'held' : 'idle'
}
