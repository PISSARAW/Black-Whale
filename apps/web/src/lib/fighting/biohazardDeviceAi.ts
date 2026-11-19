import { biohazardAuthority } from './biohazard'
import { performBiohazardDevice, touchGun } from './legacyBiohazardDevices'
import { performHinrighCounter } from './hinrighCounter'
import { traceArsenal } from './arsenalTrace'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

export function biohazardDeviceAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const options = {
    state,
    side: 'opponent' as const,
    command: { action: 'bio-axe-counter' as const },
  }
  const counter = performHinrighCounter(options, perform)
  if (counter !== state) return traceArsenal(options, counter)
  if (!biohazardAuthority(state.opponent)) return null
  const command = combatOrder(state) ?? cameraOrder(state)
  if (!command) return null
  const invocation = { state, side: 'opponent' as const, command }
  const next = performBiohazardDevice(invocation)
  return next === state ? null : traceArsenal(invocation, next)
}

function combatOrder(state: FightState): ArsenalCommand | undefined {
  const devices = state.opponent.biohazardDevices ?? []
  const gun = devices.find((item) => item.kind === 'gun' && item.phase === 'active' && item.ammo)
  let command: ArsenalCommand | undefined
  if (gun && state.frame % 45 === 0) command = { action: 'bio-gun-fire', target: gun.id }
  else if (touchGun(state, 'opponent'))
    command = { action: 'bio-transform', target: 'weapon:player' }
  else if (state.frame % 600 === 0) {
    const camera = devices.find((item) => item.kind === 'camera' && item.phase === 'carried')
    if (camera) command = { action: 'bio-transform', target: camera.id }
  }
  return command
}

function cameraOrder(state: FightState): ArsenalCommand | undefined {
  const camera = state.opponent.biohazardDevices?.find(
    (item) => item.kind === 'camera' && item.phase === 'active',
  )
  if (!camera) return undefined
  if (state.frame % 180 === 0 && Math.abs(camera.x - state.opponent.x) < 6)
    return { action: 'bio-camera-read' }
  if (
    state.frame % 120 === 0 &&
    (camera.destinationX === undefined || Math.abs(camera.destinationX - camera.x) < 1)
  )
    return { action: 'bio-camera-move', target: camera.x < 50 ? 'right' : 'left' }
  return undefined
}
