import { EMPTY_INPUT, type FightInput, type FightSide, type MoveAction } from './types'

export interface FightPad {
  index: number
  id: string
  connected: boolean
  mapping: string
  axes: readonly number[]
  buttons: readonly { pressed: boolean; value: number }[]
}
export type PadAction = MoveAction | 'ranged' | 'pause'
export interface PadFrame {
  input: FightInput
  actions: PadAction[]
  neutral: boolean
}
const PRESSED_ACTIONS: Record<number, PadAction> = {
  0: 'light',
  1: 'heavy',
  3: 'ranged',
  6: 'throw',
  7: 'finisher',
  9: 'pause',
}
const BUTTON_INPUTS: Record<number, keyof FightInput> = {
  2: 'hatsu',
  4: 'guard',
  5: 'aura',
  8: 'call',
  10: 'arena',
  11: 'gyo',
  12: 'jump',
  13: 'down',
  14: 'left',
  15: 'right',
}
const pressed = (pad: FightPad, button: number) => Boolean(pad.buttons[button]?.pressed)
function axisDirection(value: number, previouslyHeld: boolean, sign: -1 | 1): boolean {
  return value * sign > (previouslyHeld ? 0.3 : 0.5)
}
function stickInput(pad: FightPad, previous: FightInput): FightInput {
  const x = pad.axes[0] ?? 0
  const y = pad.axes[1] ?? 0
  return {
    ...EMPTY_INPUT,
    left: axisDirection(x, previous.left, -1),
    right: axisDirection(x, previous.right, 1),
    jump: axisDirection(y, previous.jump, -1),
    down: axisDirection(y, previous.down, 1),
  }
}
function padActions(pad: FightPad, previous: FightPad | null): PadAction[] {
  if (!previous) return []
  const actions: PadAction[] = []
  for (const [button, action] of Object.entries(PRESSED_ACTIONS)) {
    if (pressed(pad, Number(button)) && !pressed(previous, Number(button))) actions.push(action)
  }
  if (pressed(previous, 2) && !pressed(pad, 2)) actions.push('special')
  return actions
}
export function sampleGamepad(
  pad: FightPad,
  previous: FightPad | null,
  lastInput: FightInput = EMPTY_INPUT,
): PadFrame {
  const buttons: FightInput = { ...EMPTY_INPUT }
  for (const [button, key] of Object.entries(BUTTON_INPUTS))
    buttons[key] = pressed(pad, Number(button))
  const input = mergeFightInput(buttons, stickInput(pad, lastInput))
  return {
    input,
    actions: padActions(pad, previous),
    neutral: !Object.values(input).some(Boolean) && !pad.buttons.some((button) => button.pressed),
  }
}
export function mergeFightInput(keyboard: FightInput, gamepad: FightInput): FightInput {
  const merged = { ...keyboard }
  for (const key of Object.keys(gamepad) as (keyof FightInput)[])
    merged[key] = Boolean(keyboard[key] || gamepad[key])
  return merged
}
interface PadSlot {
  index: number
  id: string
  previous: FightPad | null
  input: FightInput
  armed: boolean
}
const clonePad = (pad: FightPad): FightPad => ({
  ...pad,
  axes: [...pad.axes],
  buttons: pad.buttons.map((button) => ({ pressed: button.pressed, value: button.value })),
})
function syncSlots(slots: Partial<Record<FightSide, PadSlot>>, connected: readonly FightPad[]) {
  for (const side of ['player', 'opponent'] as const) {
    const slot = slots[side]
    if (slot && !connected.some((pad) => pad.index === slot.index && pad.id === slot.id))
      delete slots[side]
  }
  for (const pad of connected) {
    if (Object.values(slots).some((slot) => slot.index === pad.index)) continue
    const side = !slots.player ? 'player' : !slots.opponent ? 'opponent' : null
    if (side)
      slots[side] = {
        index: pad.index,
        id: pad.id,
        previous: null,
        input: { ...EMPTY_INPUT },
        armed: false,
      }
  }
}
function readSlot(slot: PadSlot, pad: FightPad, enabled: boolean): PadFrame {
  const frame = sampleGamepad(pad, slot.previous, slot.input)
  slot.previous = clonePad(pad)
  slot.input = frame.input
  const wasArmed = slot.armed
  if (frame.neutral) slot.armed = true
  const actions = frame.actions.filter((action) => action === 'pause')
  if (!enabled) slot.armed = false
  if (!slot.armed || !wasArmed) return { ...frame, input: { ...EMPTY_INPUT }, actions }
  return frame
}
export function createGamepadReader() {
  const slots: Partial<Record<FightSide, PadSlot>> = {}
  const inputs: Record<FightSide, FightInput> = {
    player: { ...EMPTY_INPUT },
    opponent: { ...EMPTY_INPUT },
  }
  return {
    inputs,
    release() {
      for (const side of ['player', 'opponent'] as const) {
        inputs[side] = { ...EMPTY_INPUT }
        if (slots[side]) slots[side]!.armed = false
      }
    },
    poll(pads: readonly (FightPad | null)[], enabled: boolean) {
      const connected = pads.filter((pad): pad is FightPad =>
        Boolean(pad?.connected && pad.mapping === 'standard'),
      )
      syncSlots(slots, connected)
      const actions: { side: FightSide; action: PadAction }[] = []
      for (const side of ['player', 'opponent'] as const) {
        inputs[side] = { ...EMPTY_INPUT }
        const slot = slots[side]
        const pad = connected.find((candidate) => candidate.index === slot?.index)
        if (!slot || !pad) continue
        const frame = readSlot(slot, pad, enabled)
        inputs[side] = frame.input
        actions.push(...frame.actions.map((action) => ({ side, action })))
      }
      return {
        actions,
        names: (['player', 'opponent'] as const).map((side) => slots[side]?.id ?? ''),
        unsupported: pads.some((pad) => pad?.connected && pad.mapping !== 'standard'),
      }
    },
  }
}
