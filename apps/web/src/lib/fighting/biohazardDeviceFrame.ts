import { witnessedHatsuState } from './nenWitness'
import { activeHitbox, attackPhase, boxesOverlap } from './frameData'
import { biohazardAuthority, biohazardNen, BIOHAZARD_TRANSFORM } from './biohazard'
import {
  cameraSees,
  releaseDeviceGun,
  storeBioDevice,
  type BiohazardDevice,
} from './biohazardDevices'
import type { FightSide, FightState } from './types'
import { priorityLineOfSight } from './priorityOptics'

export function advanceBiohazardDevices(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if (next[side].biohazardRecovery)
      next = {
        ...next,
        [side]: { ...next[side], biohazardRecovery: next[side].biohazardRecovery! - 1 },
      }
    for (const item of next[side].biohazardDevices ?? []) next = advance(next, side, item)
  }
  return next
}

function advance(state: FightState, side: FightSide, item: BiohazardDevice): FightState {
  if (item.phase === 'broken') return state
  if (['carried', 'dropped'].includes(item.phase)) {
    const physical = followDeviceBody(state, side, item)
    return storeBioDevice(state, side, recordCameraFrame(state, side, physical))
  }
  const actor = state[side]
  const broken = struckDevice(state, side, item)
  if (broken || cannotMaintain(actor, item)) return endDevice(state, side, { item, broken })
  const updated = tickDevice(state, side, item)
  const next = storeBioDevice(state, side, updated)
  if (item.phase !== 'preparing' || updated.phase !== 'active') return next
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...next,
    [other]: {
      ...next[other],
      hatsuEffects: {
        ...next[other].hatsuEffects,
        ...witnessedHatsuState(next, { side, source: 'hinrigh', moveId: 'hinrigh:neutralSpecial' }),
      },
    },
  }
}

function endDevice(
  state: FightState,
  side: FightSide,
  options: { item: BiohazardDevice; broken: boolean },
): FightState {
  const { item, broken } = options
  const ended = storeBioDevice(state, side, {
    ...item,
    phase: broken ? 'broken' : 'dropped',
    destinationX: undefined,
    swallowed: broken ? false : item.swallowed,
  })
  return releaseDeviceGun(ended, side, item)
}

function cannotMaintain(actor: FightState['player'], item: BiohazardDevice): boolean {
  const interrupted = item.phase === 'preparing' && (actor.hitStun > 0 || actor.knockdownFrames > 0)
  if (item.phase === 'preparing')
    return interrupted || !biohazardAuthority(actor) || !biohazardNen(actor)
  // Ch. 399: Hinrigh cannot use Biohazard again that day, but the charged oyster remains.
  return item.life <= 0 || (actor.id !== 'hinrigh' && !biohazardAuthority(actor))
}

function tickDevice(state: FightState, side: FightSide, item: BiohazardDevice): BiohazardDevice {
  const frames = item.frames + 1
  const active = item.phase === 'active' || frames >= BIOHAZARD_TRANSFORM
  const next: BiohazardDevice = {
    ...item,
    frames,
    life: item.life - 1,
    phase: active ? 'active' : 'preparing',
  }
  if (item.kind === 'transmitter' && item.phase === 'preparing') next.swallowed = active
  return recordCameraFrame(state, side, walkCamera(state, followDeviceBody(state, side, next)))
}

function followDeviceBody(
  state: FightState,
  side: FightSide,
  item: BiohazardDevice,
): BiohazardDevice {
  if (item.kind !== 'gun' && !item.swallowed && item.phase !== 'carried') return item
  const body = state[item.weaponSide ?? side]
  return { ...item, x: body.x, y: body.y + (item.kind === 'gun' ? 6 : 4) }
}

function walkCamera(state: FightState, item: BiohazardDevice): BiohazardDevice {
  if (item.kind !== 'camera' || item.phase !== 'active' || item.destinationX === undefined)
    return item
  const dx = item.destinationX - item.x
  const x = item.x + Math.sign(dx) * Math.min(Math.abs(dx), 0.15)
  const clear = priorityLineOfSight(state, {
    x: item.x,
    y: item.y + 2,
    targetX: x,
    targetY: item.y + 2,
  })
  return clear ? { ...item, x } : { ...item, destinationX: undefined }
}

function recordCameraFrame(
  state: FightState,
  side: FightSide,
  item: BiohazardDevice,
): BiohazardDevice {
  if (
    !['active', 'dropped'].includes(item.phase) ||
    item.kind !== 'camera' ||
    state.frame % 30 !== 0
  )
    return item
  const sample = cameraSees(state, item, side)
  return sample ? { ...item, recordings: [...(item.recordings ?? []), sample].slice(-120) } : item
}

function struckDevice(state: FightState, side: FightSide, item: BiohazardDevice): boolean {
  if (item.swallowed || item.kind === 'gun') return false
  const enemy = state[side === 'player' ? 'opponent' : 'player']
  if (!enemy.attack || attackPhase(enemy) !== 'active') return false
  const hitbox = activeHitbox(enemy)
  return Boolean(
    hitbox &&
    boxesOverlap(hitbox, { left: item.x - 1, right: item.x + 1, bottom: item.y, top: item.y + 3 }),
  )
}
