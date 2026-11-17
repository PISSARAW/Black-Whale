import { sleepingBody } from './hanzoProjection'
import { battleAppearance } from './battleCantabileRules'
import { devicePosition, changeDevice } from './physicalDevices'
import { DEVICE_CAMERA_RANGE, DEVICE_MEMORY_LIMIT } from './deviceTypes'
import type { PreparedEntity } from './preparationTypes'
import type { RecordedBody } from './deviceTypes'
import type { FightSide, FightState } from './types'

/** Flat-arena view cone; its numeric reach and sampling rate are scenario tuning. */
export function cameraSees(state: FightState, camera: PreparedEntity, side: FightSide): boolean {
  const point = devicePosition(state, camera),
    body = sleepingBody(state[side]),
    direction = camera.device?.facing ?? 1
  if (state[side].clothCapture) return false
  return (
    Math.hypot(point.x - body.x, point.y - body.y) <= DEVICE_CAMERA_RANGE &&
    (body.x - point.x) * direction >= 0
  )
}
export function captureDeviceSpeech(
  state: FightState,
  utterance: { side: FightSide; text: string; deliberateLie?: boolean },
): FightState {
  let next = state
  for (const camera of state.battlefield?.entities ?? []) {
    if (!cameraIsRecording(camera)) continue
    const point = devicePosition(state, camera),
      body = sleepingBody(state[utterance.side])
    if (Math.hypot(point.x - body.x, point.y - body.y) > 18) continue
    const words = [
      ...(camera.device!.words ?? []),
      {
        frame: state.frame,
        subject: utterance.side,
        appearance: recordedAppearance(state, utterance.side),
        text: utterance.text,
        deliberateLie: utterance.deliberateLie,
        visibleBody: cameraSees(state, camera, utterance.side),
      },
    ].slice(-DEVICE_MEMORY_LIMIT)
    next = changeDevice(next, camera, { words })
  }
  return next
}
export function advanceDeviceRecordings(state: FightState): FightState {
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.device && entry.present && entry.health > 0)
    .reduce(advancePoweredDevice, state)
}
function advancePoweredDevice(state: FightState, entry: PreparedEntity): FightState {
  const device = entry.device!,
    batteryFrames = Math.max(0, device.batteryFrames - 1)
  if (device.kind === 'receiver' || device.kind === 'transmitter')
    return changeDevice(state, entry, { batteryFrames })
  if (!device.recording || device.kind !== 'camera') return state
  if (!batteryFrames) return changeDevice(state, entry, { recording: false, batteryFrames })
  const pictures =
    state.frame % 15 === 0
      ? [...(device.pictures ?? []), ...pictureBodies(state, entry)].slice(-DEVICE_MEMORY_LIMIT)
      : device.pictures
  return changeDevice(state, entry, { pictures, batteryFrames })
}
function cameraIsRecording(entry: PreparedEntity): boolean {
  return Boolean(
    entry.present &&
    entry.health > 0 &&
    entry.device?.kind === 'camera' &&
    entry.device.recording &&
    entry.device.batteryFrames > 0,
  )
}
function pictureBodies(state: FightState, camera: PreparedEntity): RecordedBody[] {
  return (['player', 'opponent'] as const)
    .filter((side) => cameraSees(state, camera, side))
    .map((side) => {
      const body = sleepingBody(state[side])
      return {
        frame: state.frame,
        subject: side,
        appearance: recordedAppearance(state, side),
        x: body.x,
        y: body.y,
      }
    })
}

function recordedAppearance(state: FightState, side: FightSide) {
  const body = state[side]
  return battleAppearance({ ...body, id: body.nenOwner ?? body.id })
}
