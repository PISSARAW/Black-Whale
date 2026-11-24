import type { FightPad, PadAction } from './fightGamepad'
import type { FightInput } from './types'

export const RIGHT_STICK_ACTIONS = ['ranged', 'throw', 'onIntent', 'context'] as const
export type RightStickLayout = (typeof RIGHT_STICK_ACTIONS)[number][]

const attacks = ['light', 'heavy', 'special', 'finisher'] as const
const utilities = ['call', 'interact', 'coverEars', 'plugWounds'] as const
const techniques = ['en', 'conceal', 'shu', 'gyo'] as const
const zones = ['focusHead', 'focusTorso', 'focusHands', 'focusFeet'] as const
const pressed = (pad: FightPad, button: number) => Boolean(pad.buttons[button]?.pressed)
type StickIntent = RightStickLayout[number] | 'zetsuIntent' | 'seiyakuIntent'
interface PadSample {
  pad: FightPad
  previous: FightPad | null
  input: FightInput
  layout: RightStickLayout
}
type HeldButtons = Map<number, keyof FightInput | null>

function stickDirection(pad: FightPad): number | null {
  const x = pad.axes[2] ?? 0
  const y = pad.axes[3] ?? 0
  if (Math.max(Math.abs(x), Math.abs(y)) < 0.65) return null
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 0 : 1
  return y < 0 ? 2 : 3
}

export function createDirectPadSampler() {
  const faceInputs: HeldButtons = new Map()
  const directions: HeldButtons = new Map()
  let stick: StickIntent | null = null
  return (sample: PadSample): PadAction[] => {
    const { pad, previous, input } = sample
    const actions: PadAction[] = []
    input.directControls = true
    input.kameo = pressed(pad, 5)
    input.aura = pressed(pad, 7)
    input.arena = pressed(pad, 10)
    input.gyo = pressed(pad, 11) && !pressed(pad, 8)
    readFaceButtons(sample, faceInputs, actions)
    readDirectionButtons(sample, directions)
    stick = readRightStick(sample, stick, actions)
    if (previous && pressed(pad, 9) && !pressed(previous, 9)) actions.push('pause')
    return actions
  }
}

function readFaceButtons(sample: PadSample, held: HeldButtons, actions: PadAction[]) {
  const { pad, previous, input } = sample
  const view = pressed(pad, 8)
  attacks.forEach((action, button) => {
    if (!pressed(pad, button)) {
      held.delete(button)
      return
    }
    if (!held.has(button)) {
      held.set(button, view ? utilities[button] : button === 2 ? 'hatsu' : null)
      if (!view && previous && !pressed(previous, button)) actions.push(action)
    }
    const mapped = held.get(button)
    if (mapped) input[mapped] = true
  })
}

function readDirectionButtons({ pad, input }: PadSample, held: HeldButtons) {
  const movement = ['jump', 'down', 'left', 'right'] as const
  const layer = pressed(pad, 8) ? techniques : pressed(pad, 11) ? zones : movement
  layer.forEach((key, index) => {
    const button = index + 12
    if (!pressed(pad, button)) {
      held.delete(button)
      return
    }
    const mapped = held.get(button) ?? key
    held.set(button, mapped)
    input[mapped] = true
  })
}

function chooseStickIntent(sample: PadSample, direction: number): StickIntent {
  if (pressed(sample.pad, 8) && direction >= 2)
    return direction === 2 ? 'seiyakuIntent' : 'zetsuIntent'
  return sample.layout[direction]
}

function readRightStick(sample: PadSample, previous: StickIntent | null, actions: PadAction[]) {
  const { pad, input } = sample
  if (rightStickNeutral(pad)) return null
  const direction = stickDirection(pad)
  const intent = previous ?? (direction === null ? null : chooseStickIntent(sample, direction))
  if (intent === 'ranged' || intent === 'throw') {
    if (!previous && sample.previous) actions.push(intent)
  } else if (intent) input[intent] = true
  return intent
}

export function rightStickNeutral(pad: FightPad): boolean {
  return Math.hypot(pad.axes[2] ?? 0, pad.axes[3] ?? 0) < 0.35
}
