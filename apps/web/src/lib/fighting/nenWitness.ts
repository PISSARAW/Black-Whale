import type { FighterId, FightSide, FightState } from './types'
import { gyoSight } from './nenCombat/sight'

/** Skill Hunter needs an actual visual observation, not the engine's private source ID. */
export function witnessedHatsu(
  state: FightState,
  cast: {
    side: FightSide
    source: FighterId
    concealed?: boolean
    moveId?: string
  },
): FighterId | null {
  const observer = state[cast.side === 'player' ? 'opponent' : 'player']
  return canWitness(state, cast) ? cast.source : observer.hatsuEffects.witnessedHatsu
}

export function witnessedHatsuState(state: FightState, cast: Parameters<typeof witnessedHatsu>[1]) {
  const observer = state[cast.side === 'player' ? 'opponent' : 'player']
  return canWitness(state, cast)
    ? {
        witnessedHatsu: cast.source,
        witnessedAt: state.frame,
        witnessedMoveId: manifestedMove(state, cast),
      }
    : {
        witnessedHatsu: observer.hatsuEffects.witnessedHatsu,
        witnessedAt: observer.hatsuEffects.witnessedAt,
        witnessedMoveId: observer.hatsuEffects.witnessedMoveId,
      }
}

function manifestedMove(state: FightState, cast: Parameters<typeof witnessedHatsu>[1]): string {
  const own = cast.moveId ?? state[cast.side].attack?.moveId
  if (own?.startsWith(`${cast.source}:`)) return own
  const prepared: Partial<Record<FighterId, string>> = {
    biscuit: 'biscuit:cookie',
    sayird: 'sayird:littleEye',
    cluck: 'cluck:birdManipulation',
  }
  return prepared[cast.source] ?? `${cast.source}:neutralSpecial`
}

function canWitness(state: FightState, cast: Parameters<typeof witnessedHatsu>[1]): boolean {
  const observer = state[cast.side === 'player' ? 'opponent' : 'player']
  if (!hasSight(observer)) return false
  const attack = state[cast.side].attack
  const hidden = cast.concealed ?? (attack?.hatsuSource === cast.source && attack.concealed)
  const inspects = gyoSight(observer)
  return !hidden || inspects
}

function hasSight(observer: FightState['player']): boolean {
  return (
    observer.health > 0 &&
    !observer.parallelEyesClosed &&
    (observer.hatsuEffects.senseSeals & 1) === 0 &&
    (observer.kurapika?.blackoutFrames ?? 0) === 0
  )
}
