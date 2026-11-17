import { freeDeviceHand } from './deviceHands'
import { historicalCopyExpired } from './historicalCopyLifetime'
import { liveEntity, updateEntity } from './preparationWorld'
import { sleepingBody } from './hanzoProjection'
import { canAct } from './fightActorState'
import { DEVICE_BATTERY_FRAMES, DEVICE_TOUCH_RANGE } from './deviceTypes'
import type { PhysicalDevice, PhysicalDeviceKind } from './deviceTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function scenarioDevices(side: FightSide): PreparedEntity[] {
  const x = side === 'player' ? 25 : 75
  const kinds: readonly PhysicalDeviceKind[] = ['camera', 'firearm', 'transmitter', 'receiver']
  return kinds.map((kind, index) => ({
    id: `${side}:device:${kind}`,
    kind: 'device',
    owner: side,
    x: x + index,
    y: 0,
    present: true,
    material: 'real',
    health: 24,
    device: {
      kind,
      batteryFrames: DEVICE_BATTERY_FRAMES,
      facing: side === 'player' ? 1 : -1,
      ...(kind === 'firearm' ? { ammunition: 6 } : {}),
      ...(['transmitter', 'receiver'].includes(kind) ? { channel: `${side}:radio` } : {}),
    },
  }))
}
export function deviceEntity(state: FightState, id?: string): PreparedEntity | undefined {
  return state.battlefield?.entities.find(
    (entry) =>
      entry.id === id &&
      entry.kind === 'device' &&
      entry.device &&
      liveEntity(entry) &&
      (!entry.copy || !historicalCopyExpired(state, entry)),
  )
}
export function devicePosition(state: FightState, entry: PreparedEntity): { x: number; y: number } {
  const body = deviceCarrierBody(state, entry)
  if (!body) return { x: entry.x, y: entry.y }
  const point = sleepingBody(body)
  return {
    x: point.x + (entry.device!.swallowed ? 0 : body.facing * 2.5),
    y: point.y + (entry.device!.swallowed ? 6 : 8),
  }
}
export function deviceCarrierBody(state: FightState, entry: PreparedEntity) {
  const device = entry.device!,
    side = device.carrier
  if (!side) return undefined
  const seat = state.teamMatch?.seats[side],
    index = device.carrierMember
  if (!seat || index === undefined || index === seat.active) return state[side]
  const body = seat.members[index]
  return { ...body, x: side === 'player' ? 7 : 93, y: 0 }
}
export function holdsDevice(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  if (entry.device!.carrier !== side) return false
  const seat = state.teamMatch?.seats[side]
  return (
    !seat ||
    entry.device!.carrierMember === undefined ||
    entry.device!.carrierMember === seat.active
  )
}
export function touchesDevice(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  if (entry.device!.swallowed) return false
  if (holdsDevice(state, side, entry)) return true
  const position = devicePosition(state, entry),
    body = sleepingBody(state[side])
  return (
    Math.abs(position.x - (body.x + state[side].facing * 2.5)) <= DEVICE_TOUCH_RANGE &&
    Math.abs(position.y - (body.y + 8)) <= 9
  )
}
export function deviceBodyFree(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    canAct(fighter) &&
    !fighter.attack &&
    !fighter.hanzoProjection &&
    !fighter.arsenalSleep &&
    !fighter.coveringEars &&
    !fighter.melodyPerformance &&
    (fighter.bashoPoem?.writingFrames ?? 0) === 0 &&
    ![
      fighter.hatsuEffects.manipulatedFrames,
      fighter.hatsuEffects.possessedFrames,
      fighter.hatsuEffects.momozeFrames,
    ].some((frames) => frames > 0)
  )
}
export function changeDevice(
  state: FightState,
  entry: PreparedEntity,
  change: Partial<PhysicalDevice>,
): FightState {
  return updateEntity(state, entry.id, { device: { ...entry.device!, ...change } })
}
export function pickDevice(state: FightState, side: FightSide, id?: string): FightState {
  const entry = deviceEntity(state, id)
  if (!entry || !deviceBodyFree(state, side) || !touchesDevice(state, side, entry)) return state
  if (entry.device!.carrier || entry.device!.form || entry.device!.transforming) return state
  const hand = freeDeviceHand(state, side)
  if (!hand) return state
  return changeDevice(state, entry, {
    carrier: side,
    hand,
    carrierMember: state.teamMatch?.seats[side].active,
  })
}
export function dropDevice(state: FightState, side: FightSide, id?: string): FightState {
  const entry = deviceEntity(state, id)
  if (
    !entry ||
    !deviceBodyFree(state, side) ||
    !holdsDevice(state, side, entry) ||
    entry.device!.swallowed
  )
    return state
  const position = devicePosition(state, entry),
    dropped = changeDevice(state, entry, { carrier: undefined, carrierMember: undefined })
  return {
    ...dropped,
    battlefield: {
      ...dropped.battlefield!,
      entities: dropped.battlefield!.entities.map((held) =>
        held.id === entry.id ? { ...held, x: position.x, y: 0 } : held,
      ),
    },
  }
}
