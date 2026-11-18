import { physicalBodyKey } from './fightBodyIdentity'
import type { LittleEyeShot } from './littleEyeTypes'
import type { FightSide, FightState } from './types'

interface BallOrigin {
  owner: FightSide
  member?: number
  person?: string
  from: { x: number; y: number }
  target: { x: number; y: number }
}
/** Travel speed is scenario tuning; a non-user supplies no fictitious fighter statistics. */
export function emitLittleEyeBall(state: FightState, origin: BallOrigin): FightState {
  if (!state.battlefield) return state
  const dx = origin.target.x - origin.from.x,
    dy = origin.target.y + 0.2 - (origin.from.y + 1),
    length = Math.hypot(dx, dy) || 1
  const identity = origin.person ?? physicalBodyKey(state, origin.owner)
  const shot: LittleEyeShot = {
    id: `little-eye:${state.roundNumber}:${state.frame}:${identity}`,
    owner: origin.owner,
    member: origin.member,
    person: origin.person,
    x: origin.from.x,
    y: origin.from.y + 1,
    velocityX: (dx / length) * 54,
    velocityY: (dy / length) * 54,
    age: 0,
  }
  return {
    ...state,
    battlefield: {
      ...state.battlefield,
      littleEyeShots: [...(state.battlefield.littleEyeShots ?? []), shot],
    },
  }
}
