import type { FightPad } from '../fightGamepad'
import type { FightInput } from '../types'
const held = (pad: FightPad, button: number) => Boolean(pad.buttons[button]?.pressed)
const directions = [12, 13, 14, 15] as const
const tools = ['en', 'conceal', 'shu', 'gyo'] as const
const zones = ['focusHead', 'focusTorso', 'focusHands', 'focusFeet'] as const
/** Consume modifiers, keeping the left stick and physical attack buttons free. */
export function nenPadChords(pad: FightPad, input: FightInput): FightInput {
  if (!directions.some((button) => held(pad, button))) return input
  const back = held(pad, 8),
    right = held(pad, 11) || held(pad, 5)
  if (!back && !right && !held(pad, 4)) return input
  const next = {
    ...input,
    call: false,
    jump: false,
    down: false,
    left: false,
    right: false,
    gyo: right,
  }
  if (bodilyBumper(pad)) next.aura = false
  const focused = right || (!back && held(pad, 4))
  directions.forEach((button, index) => {
    if (back) next[tools[index]] = Boolean(next[tools[index]] || held(pad, button))
    if (focused) next[zones[index]] = held(pad, button)
  })
  return next
}

function bodilyBumper(pad: FightPad): boolean {
  return held(pad, 5) && !held(pad, 4) && !held(pad, 11)
}
