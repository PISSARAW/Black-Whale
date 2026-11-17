import { commitProjectileNen } from './nenProjectiles'
import {
  changeDevice,
  pickDevice,
  dropDevice,
  holdsDevice,
  deviceBodyFree,
  deviceEntity,
  devicePosition,
  deviceCarrierBody,
  touchesDevice,
} from './physicalDevices'
import {
  deviceAnimalCommand,
  deviceBiohazardActive,
  transformDevice,
  cancelDeviceTransformation,
} from './biohazardDevices'
import { watchDevice } from './devicePlayback'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightProjectile, FightSide, FightState } from './types'

export function performDeviceCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'biohazard-device-cancel')
    return cancelDeviceTransformation(state, side, command.target)
  if (command.action === 'biohazard-device') return transformDevice(state, side, command.target)
  if (command.action.startsWith('biohazard-')) return deviceAnimalCommand(state, side, command)
  const entry = deviceEntity(state, command.target)
  if (!entry || !deviceBodyFree(state, side)) return state
  if (command.action === 'device-fire') return fireDevice(state, side, entry)
  if (command.action === 'device-signal') return receiveDeviceSignal(state, side, entry)
  if (!touchesDevice(state, side, entry)) return state
  return contactDeviceCommand(state, side, { entry, action: command.action })
}
function contactDeviceCommand(
  state: FightState,
  side: FightSide,
  options: { entry: PreparedEntity; action: string },
): FightState {
  const { entry, action } = options
  if (action === 'device-pickup') return pickDevice(state, side, entry.id)
  if (action === 'device-drop') return dropDevice(state, side, entry.id)
  if (action === 'device-watch') return watchDevice(state, side, entry)
  return cameraDeviceCommand(state, entry, action)
}

function cameraDeviceCommand(state: FightState, entry: PreparedEntity, action: string): FightState {
  const device = entry.device!
  if (device.kind !== 'camera' || device.batteryFrames <= 0) return state
  if (action === 'device-face-left' || action === 'device-face-right')
    return changeDevice(state, entry, { facing: action === 'device-face-left' ? -1 : 1 })
  return action === 'device-record'
    ? changeDevice(state, entry, { recording: !device.recording })
    : state
}

function receiveDeviceSignal(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): FightState {
  const device = entry.device!
  if (device.kind !== 'receiver' || device.batteryFrames <= 0 || !touchesDevice(state, side, entry))
    return state
  const transmitter = state.battlefield?.entities.find(
    (held) =>
      held.present &&
      held.health > 0 &&
      held.device?.kind === 'transmitter' &&
      held.device.batteryFrames > 0 &&
      held.device.channel === device.channel,
  )
  if (!transmitter) return state
  const point = devicePosition(state, transmitter)
  return {
    ...state,
    [side]: {
      ...state[side],
      receiverReading: { frame: state.frame, transmitterId: transmitter.id, ...point },
    },
  }
}
function fireDevice(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  const device = entry.device!
  if (!canFireDevice(state, side, entry)) return state
  const point = devicePosition(state, entry),
    direction = fireDirection(state, side, entry)
  const projectile: FightProjectile = {
    id: state.nextProjectileId,
    deviceOrigin: { id: entry.id, owner: side },
    owner: side,
    fighterId: state[side].id,
    x: point.x + direction * 0.5,
    y: point.y + 3,
    velocityX: direction * 76,
    width: 0.5,
    height: 0.2,
    damage: 10,
    hitstun: 12,
    blockstun: 7,
    hitstop: 4,
    knockback: 3,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#d8c7a0',
    matter: entry.material === 'nen' ? 'nen' : 'object',
    age: 0,
    lifetime: 120,
    guard: 'mid',
    canHitDowned: false,
  }
  const fired = changeDevice(state, entry, { ammunition: device.ammunition! - 1 })
  return {
    ...fired,
    projectiles: [
      ...fired.projectiles,
      holdsDevice(state, side, entry)
        ? { ...commitProjectileNen(projectile, state[side]), hatsuPower: 1 }
        : projectile,
    ],
    nextProjectileId: state.nextProjectileId + 1,
    [side]: { ...fired[side], arenaRecovery: 12 },
  }
}

function canFireDevice(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  const device = entry.device!
  if (
    device.kind !== 'firearm' ||
    (device.ammunition ?? 0) <= 0 ||
    device.swallowed ||
    device.transforming
  )
    return false
  if (!device.form) return holdsDevice(state, side, entry)
  return (
    device.form.kind === 'snake' && device.form.owner === side && deviceBiohazardActive(state, side)
  )
}

function fireDirection(state: FightState, side: FightSide, entry: PreparedEntity): -1 | 1 {
  const device = entry.device!
  if (device.form && device.carrier && device.carrier !== side) {
    const body = deviceCarrierBody(state, entry)!,
      point = devicePosition(state, entry)
    return (Math.sign(body.x - point.x) || state[side].facing) as -1 | 1
  }
  return holdsDevice(state, side, entry)
    ? state[side].facing
    : (device.facing ?? state[side].facing)
}
