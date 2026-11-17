import { freeDeviceHand, physicalHandOccupancy, physicalHandsBusy } from './deviceHands'
import { canAct } from './fightActorState'
import { updateEntity } from './preparationWorld'
import type { BlackVoiceGear, BlackVoicePiece } from './blackVoiceTypes'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function voiceGear(state: FightState, side: FightSide): BlackVoiceGear {
  return state[side].blackVoiceGear ?? { antennas: [] }
}
export function setVoiceGear(state: FightState, side: FightSide, gear: BlackVoiceGear): FightState {
  return { ...state, [side]: { ...state[side], blackVoiceGear: gear } }
}
export function voiceGearBodyReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return canAct(actor) && !actor.attack && !physicalHandsBusy(actor) && !actor.hanzoProjection
}
/** Drawing a pin never also produces or holds a phone. The open book still occupies the right. */
export function armVoiceAntenna(state: FightState, side: FightSide): FightState {
  const gear = voiceGear(state, side)
  if (gear.armed || !voiceGearBodyReady(state, side)) return state
  const pin = gear.antennas[0]
  const hand = freeDeviceHand(state, side)
  if (!pin || !hand) return state
  return setVoiceGear(state, side, {
    ...gear,
    armed: { ...pin, hand },
    antennas: gear.antennas.slice(1),
  })
}
export function holdVoicePhone(state: FightState, side: FightSide): FightState {
  const gear = voiceGear(state, side)
  if (!gear.phone || gear.phone.hand || !voiceGearBodyReady(state, side)) return state
  const hand = freeDeviceHand(state, side)
  return hand ? setVoiceGear(state, side, { ...gear, phone: { ...gear.phone, hand } }) : state
}
export function voiceAntennaReady(state: FightState, side: FightSide): boolean {
  const pin = voiceGear(state, side).armed
  return Boolean(pin?.hand && !physicalHandsBusy(state[side]))
}
export function voicePhoneReady(state: FightState, side: FightSide, pairId: string): boolean {
  const phone = voiceGear(state, side).phone
  if (!phone?.hand || phone.pairId !== pairId || physicalHandsBusy(state[side])) return false
  // A held phone cannot coexist in the book's right hand or Gallery Fake's contact hand.
  if (phone.hand === 'right' && state[side].chrolloBook?.open) return false
  return !(phone.hand === 'left' && state[side].chrolloHistorical?.galleryFocus)
}
export function performVoiceGearCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!voiceGearBodyReady(state, side)) return state
  if (command.action === 'voice-arm') return armVoiceAntenna(state, side)
  if (command.action === 'voice-phone') return holdVoicePhone(state, side)
  if (command.action === 'voice-pocket') return pocketGear(state, side)
  if (command.action === 'voice-drop') return dropGear(state, side, command.target)
  if (command.action === 'voice-pickup') return pickupGear(state, side, command.target)
  return state
}
function pocketGear(state: FightState, side: FightSide): FightState {
  const gear = voiceGear(state, side)
  if (!gear.armed && !gear.phone?.hand) return state
  return setVoiceGear(state, side, {
    phone: gear.phone ? { ...gear.phone, hand: undefined } : undefined,
    antennas: gear.armed ? [...gear.antennas, { ...gear.armed, hand: undefined }] : gear.antennas,
  })
}
export function dropVoicePiece(
  state: FightState,
  side: FightSide,
  piece: BlackVoicePiece,
): FightState {
  const field = state.battlefield
  if (!field) return state
  const entry = {
    id: piece.id,
    kind: 'black-voice' as const,
    material: 'real' as const,
    owner: 'neutral' as const,
    x: state[side].x,
    y: state[side].y,
    health: 20,
    present: true,
    blackVoicePiece: { ...piece, hand: undefined },
  }
  return {
    ...state,
    battlefield: {
      ...field,
      entities: [...field.entities.filter((e) => e.id !== piece.id), entry],
    },
  }
}
function dropGear(state: FightState, side: FightSide, target?: string): FightState {
  const gear = voiceGear(state, side)
  const piece = target === 'phone' ? gear.phone : (gear.armed ?? gear.antennas[0])
  if (!piece || !state.battlefield) return state
  const next = setVoiceGear(
    state,
    side,
    target === 'phone'
      ? { ...gear, phone: undefined }
      : {
          ...gear,
          armed: gear.armed?.id === piece.id ? undefined : gear.armed,
          antennas: gear.antennas.filter((pin) => pin.id !== piece.id),
        },
  )
  return dropVoicePiece(next, side, piece)
}
function pickupGear(state: FightState, side: FightSide, target?: string): FightState {
  const gear = voiceGear(state, side)
  const entry = state.battlefield?.entities.find(
    (e) =>
      e.id === target &&
      e.present &&
      e.health > 0 &&
      !e.copy &&
      e.blackVoicePiece &&
      Math.hypot(e.x - state[side].x, e.y - state[side].y) <= 4,
  )
  const piece = entry?.blackVoicePiece
  if (!entry || !piece || (piece.part === 'phone' && gear.phone)) return state
  const held =
    piece.part === 'phone'
      ? { ...gear, phone: piece }
      : { ...gear, antennas: [...gear.antennas, piece] }
  return setVoiceGear(updateEntity(state, entry.id, { present: false }), side, held)
}

export function voiceHandConflict(state: FightState, side: FightSide): boolean {
  const gear = voiceGear(state, side)
  const hand = gear.armed?.hand
  if (!hand) return true
  const busy = physicalHandOccupancy(
    { ...state, [side]: { ...state[side], blackVoiceGear: { ...gear, armed: undefined } } },
    side,
  )
  return busy.has(hand)
}
