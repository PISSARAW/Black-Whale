import { resolvePadChords } from './combatChords'
import { nenPadChords } from './nenCombat/padChords'
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
const BUTTON_INPUTS: Record<number, keyof FightInput> = {
  2: 'hatsu',
  3: 'kameo',
  4: 'guard',
  5: 'aura',
  6: 'burst',
  7: 'context',
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
function padActions(pad: FightPad, previous: FightPad | null): {
  actions: PadAction[]
  burst: boolean
} {
  if (!previous) return { actions: [], burst: false }
  const chord = resolvePadChords({
    light: pressed(pad, 0),
    heavy: pressed(pad, 1),
    special: pressed(pad, 2),
    guard: pressed(pad, 4),
    prevLight: pressed(previous, 0),
    prevHeavy: pressed(previous, 1),
    prevSpecial: pressed(previous, 2),
  })
  const actions: PadAction[] = [...chord.actions]
  if (pressed(pad, 9) && !pressed(previous, 9)) actions.push('pause')
  return { actions, burst: chord.burst }
}
export function sampleGamepad(
  pad: FightPad,
  previous: FightPad | null,
  lastInput: FightInput = EMPTY_INPUT,
): PadFrame {
  const buttons: FightInput = { ...EMPTY_INPUT }
  for (const [button, key] of Object.entries(BUTTON_INPUTS))
    buttons[key] = pressed(pad, Number(button))
  const protection =
    pressed(pad, 8) &&
    (pressed(pad, 4) || pressed(pad, 5)) &&
    ![12, 13, 14, 15].some((button) => pressed(pad, button))
  if (protection) {
    buttons.coverEars = pressed(pad, 4)
    buttons.plugWounds = !buttons.coverEars && pressed(pad, 5)
    buttons.call = buttons.guard = buttons.aura = false
  }
  const { actions, burst } = padActions(pad, previous)
  applyActionInputs(buttons, actions, burst)
  const input = mergeFightInput(nenPadChords(pad, buttons), stickInput(pad, lastInput))
  return {
    input,
    actions,
    neutral: !Object.values(input).some(Boolean) && !pad.buttons.some((button) => button.pressed),
  }
}
function applyActionInputs(buttons: FightInput, actions: PadAction[], burst: boolean): void {
  if (burst) buttons.burst = true
  if (actions.includes('ranged')) buttons.hatsu = false
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
