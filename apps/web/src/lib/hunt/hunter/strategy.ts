import type { HunterBelief } from './belief'
import type { SealedExit } from '../environment'

export type HunterDoctrineV3 = 'pursuit' | 'containment' | 'deception'

export interface PerceivedExit {
  from: string
  to: string
  sealed: boolean
}

/** Deliberately contains no player position: invariant I5 is structural. */
export interface HunterPerceptionV3 {
  selfSpaceId: string | null
  belief: HunterBelief
  visibleExits: PerceivedExit[]
  sealedExits: SealedExit[]
  aura: number
  sinceSweep: number
}

export type HunterStrategicIntent =
  | { kind: 'search'; spaceId: string }
  | { kind: 'seal'; exit: SealedExit }
  | { kind: 'sweep' }
  | { kind: 'patrol' }
  | { kind: 'wait' }

export interface HunterPlanner {
  plan(perception: HunterPerceptionV3): HunterStrategicIntent
}

export function strategicPlanner(doctrine: HunterDoctrineV3): HunterPlanner {
  return { plan: (perception) => plan(doctrine, perception) }
}

function plan(doctrine: HunterDoctrineV3, perception: HunterPerceptionV3): HunterStrategicIntent {
  if (perception.belief.spaceId && perception.belief.age < 8) {
    return { kind: 'search', spaceId: perception.belief.spaceId }
  }
  if (doctrine === 'containment') {
    const exit = perception.visibleExits.find((candidate) => !candidate.sealed)
    if (exit) return { kind: 'seal', exit: { a: exit.from, b: exit.to } }
  }
  if (perception.aura >= 15 && perception.sinceSweep >= sweepCadence(doctrine)) {
    return { kind: 'sweep' }
  }
  if (doctrine === 'deception' && perception.aura < 20) return { kind: 'wait' }
  return { kind: 'patrol' }
}

function sweepCadence(doctrine: HunterDoctrineV3): number {
  if (doctrine === 'pursuit') return 14
  if (doctrine === 'deception') return 28
  return 22
}
