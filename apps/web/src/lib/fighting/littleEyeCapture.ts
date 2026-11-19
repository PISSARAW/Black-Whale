import { emitLittleEyeBall } from './littleEyeBall'
import { animalTarget } from './preparationRequirements'
import { littleEyeTarget, type LittleEyeShot } from './littleEyeTypes'
import { updateEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function launchLittleEye(state: FightState, side: FightSide): FightState {
  const target = animalTarget(state, side, 'animal')
  return target
    ? emitLittleEyeBall(state, {
        owner: side,
        member: state.teamMatch?.seats[side].active ?? 0,
        from: state[side],
        target,
      })
    : state
}
export function advanceLittleEyeShots(state: FightState): FightState {
  if (!state.battlefield?.littleEyeShots?.length) return state
  let next = state
  const kept: LittleEyeShot[] = []
  for (const shot of state.battlefield.littleEyeShots) {
    const moved = {
      ...shot,
      x: shot.x + shot.velocityX / 60,
      y: shot.y + shot.velocityY / 60,
      age: shot.age + 1,
    }
    const target = firstContact(next, shot, moved)
    if (target)
      next = updateEntity(next, target.id, {
        controller: {
          side: shot.owner,
          source: 'sayird',
          member: shot.member,
          person: shot.person,
        },
        littleEye: { facing: shot.velocityX < 0 ? -1 : 1 },
      })
    else if (shotInScene(moved)) kept.push(moved)
  }
  return { ...next, battlefield: { ...next.battlefield!, littleEyeShots: kept } }
}
function firstContact(state: FightState, from: LittleEyeShot, to: LittleEyeShot) {
  return (state.battlefield?.entities ?? [])
    .filter(littleEyeTarget)
    .filter((entry) => intersectsAnimal(from, to, entry))
    .sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))[0]
}
function intersectsAnimal(from: LittleEyeShot, to: LittleEyeShot, animal: PreparedEntity): boolean {
  const dx = to.x - from.x,
    dy = to.y - from.y
  const fraction = Math.max(
    0,
    Math.min(1, ((animal.x - from.x) * dx + (animal.y + 0.2 - from.y) * dy) / (dx * dx + dy * dy)),
  )
  return (
    Math.hypot(animal.x - from.x - dx * fraction, animal.y + 0.2 - from.y - dy * fraction) <= 0.7
  )
}
export function littleEyeShotBusy(state: FightState, side: FightSide): boolean {
  const member = state.teamMatch?.seats[side].active ?? 0
  return Boolean(
    state.battlefield?.littleEyeShots?.some(
      (shot) => !shot.person && shot.owner === side && shot.member === member,
    ),
  )
}

function shotInScene(shot: LittleEyeShot): boolean {
  return shot.age < 120 && shot.x >= 0 && shot.x <= 100 && shot.y >= 0
}
