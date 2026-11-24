import type { FighterState } from '../combat/types'
import type { FighterDefinition } from '../fighting/types'
import type { Apparition } from '../tour/apparitions'
import type { HumanExpression } from '../tour/humanAppearance'
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
  nen: NonNullable<NonNullable<Apparition['human']>['nen']>
  expression: HumanExpression
  heading?: number
}

/** Projects Arena's deterministic body state into the shared Tour human renderer. */
export function arenaOpponentActor(options: OpponentActorOptions): Apparition {
  const {
    fighter,
    state,
    motion,
    intentVisible,
    ground,
    spaceId,
    tierId,
    colour,
    nen,
    expression,
    heading,
  } = options
  return {
    id: 'arena-opponent',
    kind: 'combatant',
    spaceId,
    tierId,
    at: state.position,
    heading: heading ?? state.facing,
    y: ground + state.height,
    size: 1,
    colour,
    stage: arenaActorStage(state, motion, intentVisible),
    human: {
      role: fighter.modelRole,
      identity: fighter.modelId,
      pose: opponentPose(state, motion, intentVisible),
      aura: state.mode,
      nen,
      expression,
    },
    hidden: false,
    pick: true,
  }
}

export function arenaActorStage(
  state: FighterState,
  motion: ArenaCombatMotion,
  intentVisible: boolean,
): number {
  const mode = { ten: 0, ren: 1, zetsu: 2 }[state.mode]
  const fallen = state.condition === 'down' || state.condition === 'ko'
  const pose = fallen ? 'down' : intentVisible ? 'attack' : motion
  const poseIndex: Record<ArenaCombatMotion, number> = {
    idle: 0,
    guard: 1,
    hit: 2,
    down: 3,
    attack: 4,
  }
  return mode + poseIndex[pose] * 3
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
