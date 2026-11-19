import { freeDeviceHand } from './deviceHands'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { chainAbilitySealed } from './kurapika'
import { voluntaryNenAvailable } from './nenAccess'
import { triggerHatsuAction } from './hatsu'
import { judgmentActionBreach } from './judgmentAction'
import {
  changeDevice,
  holdsDevice,
  deviceBodyFree,
  deviceEntity,
  devicePosition,
  touchesDevice,
} from './physicalDevices'
import {
  DEVICE_FORM_FRAMES,
  DEVICE_TRANSFORM_COST,
  DEVICE_TRANSFORM_FRAMES,
  OYSTER_AURA_FRAMES,
} from './deviceTypes'
import type { BiohazardDeviceForm, PhysicalDeviceKind } from './deviceTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export const BIOHAZARD_DEVICE_MOVE = 'hinrigh:neutralSpecial'
const FORMS: Partial<Record<PhysicalDeviceKind, BiohazardDeviceForm>> = {
  camera: 'cat',
  firearm: 'snake',
  transmitter: 'oyster',
}
export function ownsDeviceBiohazard(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  if (chainAbilitySealed(fighter, BIOHAZARD_DEVICE_MOVE)) return false
  if (fighter.id === 'hinrigh') return true
  if (fighter.id === 'chrollo') return chrolloAbilityActive(fighter, BIOHAZARD_DEVICE_MOVE)
  return Boolean(
    fighter.kurapika?.held?.loaded &&
    fighter.kurapika.held.source === 'hinrigh' &&
    fighter.kurapika.emperorTime,
  )
}
export function deviceBiohazardActive(state: FightState, side: FightSide): boolean {
  return (
    ownsDeviceBiohazard(state, side) && voluntaryNenAvailable(state[side], { requireReserve: true })
  )
}
export function transformDevice(state: FightState, side: FightSide, id?: string): FightState {
  const entry = deviceEntity(state, id)
  if (!entry || !FORMS[entry.device!.kind] || !ownsDeviceBiohazard(state, side)) return state
  const breach = judgmentActionBreach({
    state,
    side,
    kind: 'special',
    moveId: BIOHAZARD_DEVICE_MOVE,
    auraCharged: false,
  })
  if (breach) return breach
  if (!canTransformDevice(state, side, entry)) return state
  const witnessed = triggerHatsuAction({
    state,
    side,
    source: 'hinrigh',
    moveId: BIOHAZARD_DEVICE_MOVE,
  })
  const spent = spendDeviceUse(witnessed, side)
  const paid = { ...spent, [side]: { ...spent[side], deviceTouchId: entry.id } }
  return changeDevice(paid, entry, {
    transforming: { owner: side, frames: DEVICE_TRANSFORM_FRAMES, originX: state[side].x },
  })
}
function canTransformDevice(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  if (!deviceBodyFree(state, side) || !deviceBiohazardActive(state, side)) return false
  if (!holdsDevice(state, side, entry) && !freeDeviceHand(state, side)) return false
  if (entry.device!.form || entry.device!.transforming || !touchesDevice(state, side, entry))
    return false
  return state[side].aura >= DEVICE_TRANSFORM_COST && !deviceLoanUsed(state, side)
}
function deviceLoanUsed(state: FightState, side: FightSide): boolean {
  const held = state[side].kurapika?.held
  return held?.source === 'hinrigh' && held.used
}
function spendDeviceUse(state: FightState, side: FightSide): FightState {
  const fighter = state[side],
    chain = fighter.kurapika,
    held = chain?.held
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: fighter.aura - DEVICE_TRANSFORM_COST,
      kurapika:
        held?.source === 'hinrigh'
          ? { ...chain!, held: { ...held, used: true, sustainedKeys: ['biohazard-device'] } }
          : chain,
    },
  }
}

export function advanceBiohazardDevices(state: FightState): FightState {
  const advanced = (state.battlefield?.entities ?? [])
    .filter((entry) => entry.device)
    .reduce(advanceOneDevice, state)
  return clearMissingDeviceTouch(clearMissingDeviceTouch(advanced, 'player'), 'opponent')
}
function advanceOneDevice(state: FightState, entry: PreparedEntity): FightState {
  if (!entry.present || entry.health <= 0)
    return changeDevice(clearDeviceTouch(state, entry), entry, {
      form: undefined,
      transforming: undefined,
      recording: false,
    })
  if (entry.device!.transforming) return advanceDeviceTouch(state, entry)
  return entry.device!.form ? advanceDeviceForm(state, entry) : state
}
/** Hitstop pauses touching and walking; the aura already stored in an oyster still ages. */
export function advanceBiohazardDeviceClocks(state: FightState): FightState {
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.device?.form)
    .reduce((next, entry) => expireDeviceForm(next, entry), state)
}
function expireDeviceForm(state: FightState, entry: PreparedEntity): FightState {
  const form = entry.device!.form!,
    remainingFrames = form.remainingFrames - 1
  return changeDevice(state, entry, {
    form:
      remainingFrames > 0 && deviceBiohazardActive(state, form.owner)
        ? { ...form, remainingFrames }
        : undefined,
  })
}
function advanceDeviceTouch(state: FightState, entry: PreparedEntity): FightState {
  const preparation = entry.device!.transforming!,
    side = preparation.owner
  if (
    !deviceTouchBodyFree(state, side) ||
    !deviceBiohazardActive(state, side) ||
    !touchesDevice(state, side, entry)
  )
    return changeDevice(clearDeviceTouch(state, entry), entry, { transforming: undefined })
  if (state[side].x !== preparation.originX)
    return changeDevice(clearDeviceTouch(state, entry), entry, { transforming: undefined })
  const frames = preparation.frames - 1
  if (frames > 0) return changeDevice(state, entry, { transforming: { ...preparation, frames } })
  const kind = FORMS[entry.device!.kind]!
  return changeDevice(clearDeviceTouch(state, entry), entry, {
    transforming: undefined,
    form: {
      kind,
      owner: side,
      remainingFrames: kind === 'oyster' ? OYSTER_AURA_FRAMES : DEVICE_FORM_FRAMES,
      sourceMoveId: BIOHAZARD_DEVICE_MOVE,
    },
  })
}
function advanceDeviceForm(state: FightState, entry: PreparedEntity): FightState {
  const form = entry.device!.form!,
    remainingFrames = form.remainingFrames - 1
  if (!deviceBiohazardActive(state, form.owner) || remainingFrames <= 0)
    return changeDevice(state, entry, { form: undefined })
  let next = changeDevice(state, entry, { form: { ...form, remainingFrames } })
  if (form.targetX === undefined || entry.device!.carrier || form.kind !== 'cat') return next
  const x =
    entry.x + Math.sign(form.targetX - entry.x) * Math.min(0.12, Math.abs(form.targetX - entry.x))
  next = {
    ...next,
    battlefield: {
      ...next.battlefield!,
      entities: next.battlefield!.entities.map((held) =>
        held.id === entry.id ? { ...held, x } : held,
      ),
    },
  }
  return next
}
export function deviceAnimalCommand(
  state: FightState,
  side: FightSide,
  options: { action: string; target?: string },
): FightState {
  const entry = deviceEntity(state, options.target),
    form = entry?.device?.form
  if (!entry || !form || !deviceBodyFree(state, side)) return state
  if (options.action === 'biohazard-swallow') return swallowDevice(state, side, entry)
  if (options.action === 'biohazard-place') return placeDevice(state, side, entry)
  return ownedAnimalCommand(state, side, { entry, action: options.action })
}
function ownedAnimalCommand(
  state: FightState,
  side: FightSide,
  options: { entry: PreparedEntity; action: string },
): FightState {
  const { entry, action } = options
  if (entry.device!.form!.owner !== side || !deviceBiohazardActive(state, side)) return state
  if (action === 'biohazard-device-end') return changeDevice(state, entry, { form: undefined })
  return walkCameraCat(state, entry, action)
}
function swallowDevice(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  if (
    entry.device!.form?.kind !== 'oyster' ||
    !touchesDevice(state, side, entry) ||
    (!holdsDevice(state, side, entry) && !freeDeviceHand(state, side))
  )
    return state
  return changeDevice(state, entry, {
    carrier: side,
    carrierMember: state.teamMatch?.seats[side].active,
    swallowed: true,
    hand: undefined,
  })
}
function placeDevice(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  if (!holdsDevice(state, side, entry) || !entry.device!.swallowed) return state
  const position = devicePosition(state, entry),
    placed = changeDevice(state, entry, {
      carrier: undefined,
      carrierMember: undefined,
      hand: undefined,
      swallowed: false,
      depositedAt: state.frame,
    })
  return {
    ...placed,
    battlefield: {
      ...placed.battlefield!,
      entities: placed.battlefield!.entities.map((held) =>
        held.id === entry.id ? { ...held, x: position.x, y: 0 } : held,
      ),
    },
  }
}
function walkCameraCat(state: FightState, entry: PreparedEntity, action: string): FightState {
  const form = entry.device!.form!
  if (form.kind !== 'cat' || entry.device!.carrier) return state
  const targetX =
    action === 'biohazard-cat-recall'
      ? state[form.owner].x
      : action === 'biohazard-cat-left'
        ? 7
        : action === 'biohazard-cat-right'
          ? 93
          : entry.x
  return form.targetX === targetX
    ? state
    : changeDevice(state, entry, { form: { ...form, targetX } })
}

function deviceTouchBodyFree(state: FightState, side: FightSide): boolean {
  return deviceBodyFree({ ...state, [side]: { ...state[side], deviceTouchId: undefined } }, side)
}
function clearDeviceTouch(state: FightState, entry: PreparedEntity): FightState {
  const side = (['player', 'opponent'] as const).find(
    (owner) => state[owner].deviceTouchId === entry.id,
  )
  if (!side) return state
  return { ...state, [side]: { ...state[side], deviceTouchId: undefined } }
}
export function cancelDeviceTransformation(
  state: FightState,
  side: FightSide,
  id?: string,
): FightState {
  const entry = deviceEntity(state, id)
  if (entry?.device?.transforming?.owner !== side) return state
  return changeDevice(clearDeviceTouch(state, entry), entry, { transforming: undefined })
}

function clearMissingDeviceTouch(state: FightState, side: FightSide): FightState {
  const id = state[side].deviceTouchId
  if (!id || deviceEntity(state, id)?.device?.transforming?.owner === side) return state
  return { ...state, [side]: { ...state[side], deviceTouchId: undefined } }
}
