import { devicePosition, touchesDevice, deviceBodyFree } from './physicalDevices'
import { deviceBiohazardActive } from './biohazardDevices'
import { perceivedOpponentGap } from './opponentAwareness'
import { steerFighter } from './fighterMovement'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

/** Walk to known scenario equipment through normal movement, after defensive reactions. */
export function deviceNavigation(state: FightState, actor: ArcadeFighter): ArcadeFighter | null {
  const current = { ...state, opponent: actor }
  if (!deviceBodyFree(current, 'opponent') || !deviceBiohazardActive(current, 'opponent'))
    return null
  if (perceivedOpponentGap(current) < 16) return null
  const target = current.battlefield?.entities.find((entry) => needsDeviceVisit(current, entry))
  if (!target) return null
  const position = devicePosition(current, target)
  if (Math.abs(position.x - actor.x) > 18 || touchesDevice(current, 'opponent', target)) return null
  const direction = Math.sign(position.x - actor.x)
  const input = { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 }
  const tracked = actor.motion
    ? { ...actor, motion: { ...actor.motion, tapWindow: 0, tapDirection: 0 as const } }
    : actor
  return steerFighter({ ...tracked, blocking: false }, { input, mobile: true, jumpable: false })
}
function needsDeviceVisit(state: FightState, entry: PreparedEntity): boolean {
  const device = entry.device
  if (!device || entry.owner !== 'opponent' || !entry.present || entry.health <= 0) return false
  if (device.carrier || device.form || device.transforming) return false
  return deviceNeeded(state, entry)
}
function deviceNeeded(state: FightState, entry: PreparedEntity): boolean {
  const device = entry.device!
  if (device.kind === 'camera')
    return state.frame - (state.opponent.devicePlayback?.viewedAt ?? -600) >= 600
  if (device.kind === 'firearm') return (device.ammunition ?? 0) > 0
  if (device.kind === 'transmitter') return device.batteryFrames > 0
  return (
    device.kind === 'receiver' &&
    Boolean(
      state.battlefield?.entities.some(
        (e) => e.device?.form?.kind === 'oyster' && e.device.carrier === 'opponent',
      ),
    )
  )
}
