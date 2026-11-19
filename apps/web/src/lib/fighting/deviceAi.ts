import { performDeviceCommand } from './deviceActions'
import { deviceBodyFree, touchesDevice, holdsDevice } from './physicalDevices'
import { ownsDeviceBiohazard } from './biohazardDevices'
import { perceivedOpponentGap } from './opponentAwareness'
import { DEVICE_FORM_FRAMES } from './deviceTypes'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { PhysicalDeviceKind } from './deviceTypes'
import type { FightState } from './types'

/** Plans use their own carried equipment, elapsed time and accessible playback only. */
export function deviceAi(state: FightState): FightState | null {
  if (!deviceBodyFree(state, 'opponent')) return null
  const plans = [cameraPlan(state), gunPlan(state), transmitterPlan(state)]
  for (const plan of plans) {
    if (!plan) continue
    const next = performDeviceCommand(state, 'opponent', plan)
    if (next !== state) return next
  }
  return null
}
function ownDevice(state: FightState, kind: PhysicalDeviceKind): PreparedEntity | undefined {
  return state.battlefield?.entities.find(
    (entry) =>
      entry.owner === 'opponent' &&
      entry.present &&
      entry.health > 0 &&
      entry.device?.kind === kind,
  )
}
function cameraPlan(state: FightState): ArsenalCommand | null {
  const camera = ownDevice(state, 'camera')
  if (!camera || camera.device!.batteryFrames <= 0) return null
  if (touchesDevice(state, 'opponent', camera)) {
    const preparation = prepareCameraPlan(state, camera)
    if (preparation) return preparation
  }
  return walkCameraPlan(state, camera)
}
function walkCameraPlan(state: FightState, camera: PreparedEntity): ArsenalCommand | null {
  const device = camera.device!
  if (device.form?.owner !== 'opponent' || !ownsDeviceBiohazard(state, 'opponent')) return null
  if (DEVICE_FORM_FRAMES - device.form.remainingFrames > 300)
    return { action: 'biohazard-cat-recall', target: camera.id }
  return device.form.targetX === undefined
    ? {
        action: state.opponent.facing < 0 ? 'biohazard-cat-left' : 'biohazard-cat-right',
        target: camera.id,
      }
    : null
}
function prepareCameraPlan(state: FightState, camera: PreparedEntity): ArsenalCommand | null {
  const device = camera.device!
  const recovered = recoverCameraPlan(state, camera)
  if (recovered) return recovered
  if (!device.recording) return { action: 'device-record', target: camera.id }
  if (!device.form && state.frame - (state.opponent.devicePlayback?.viewedAt ?? -600) < 600)
    return null
  if (!device.form && !device.transforming && ownsDeviceBiohazard(state, 'opponent'))
    return { action: 'biohazard-device', target: camera.id }
  return null
}
function recoverCameraPlan(state: FightState, camera: PreparedEntity): ArsenalCommand | null {
  const form = camera.device!.form
  if (!form || DEVICE_FORM_FRAMES - form.remainingFrames <= 300) return null
  return {
    action:
      (state.opponent.devicePlayback?.viewedAt ?? -1) < state.frame - 300
        ? 'device-watch'
        : 'biohazard-device-end',
    target: camera.id,
  }
}
function gunPlan(state: FightState): ArsenalCommand | null {
  const gun = ownDevice(state, 'firearm')
  if (!gun || (gun.device!.ammunition ?? 0) <= 0 || !Number.isFinite(perceivedOpponentGap(state)))
    return null
  if (gun.device!.form?.owner === 'opponent' || holdsDevice(state, 'opponent', gun))
    return { action: 'device-fire', target: gun.id }
  if (!touchesDevice(state, 'opponent', gun)) return null
  return {
    action: ownsDeviceBiohazard(state, 'opponent') ? 'biohazard-device' : 'device-pickup',
    target: gun.id,
  }
}
function transmitterPlan(state: FightState): ArsenalCommand | null {
  const transmitter = ownDevice(state, 'transmitter')
  if (!transmitter || !ownsDeviceBiohazard(state, 'opponent')) return null
  if (!transmitter.device!.form && touchesDevice(state, 'opponent', transmitter))
    return { action: 'biohazard-device', target: transmitter.id }
  const oyster = oysterPlan(state, transmitter)
  if (oyster) return oyster
  return receiverPlan(state)
}
function oysterPlan(state: FightState, transmitter: PreparedEntity): ArsenalCommand | null {
  const device = transmitter.device!
  if (device.form?.kind !== 'oyster' || device.depositedAt !== undefined) return null
  if (!device.swallowed) return { action: 'biohazard-swallow', target: transmitter.id }
  return Math.abs(state.opponent.x - transmitter.x) >= 18
    ? { action: 'biohazard-place', target: transmitter.id }
    : null
}
function receiverPlan(state: FightState): ArsenalCommand | null {
  const receiver = ownDevice(state, 'receiver')
  if (!receiver) return null
  if (!holdsDevice(state, 'opponent', receiver))
    return { action: 'device-pickup', target: receiver.id }
  return state.frame - (state.opponent.receiverReading?.frame ?? -60) >= 60
    ? { action: 'device-signal', target: receiver.id }
    : null
}
