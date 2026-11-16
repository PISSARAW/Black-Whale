import type { FighterId, FightSide, FightState } from './types'

/** Skill Hunter needs an actual visual observation, not the engine's private source ID. */
export function witnessedHatsu(
  state: FightState,
  cast: {
    side: FightSide
    source: FighterId
    concealed?: boolean
  },
): FighterId | null {
  const observer = state[cast.side === 'player' ? 'opponent' : 'player']
  if (!hasSight(observer)) return observer.hatsuEffects.witnessedHatsu
  const attack = state[cast.side].attack
  const hidden = cast.concealed ?? (attack?.hatsuSource === cast.source && attack.concealed)
  return hidden && !observer.nen.gyo ? observer.hatsuEffects.witnessedHatsu : cast.source
}

function hasSight(observer: FightState['player']): boolean {
  return (
    observer.health > 0 &&
    !observer.parallelEyesClosed &&
    (observer.hatsuEffects.senseSeals & 1) === 0 &&
    (observer.kurapika?.blackoutFrames ?? 0) === 0
  )
}
