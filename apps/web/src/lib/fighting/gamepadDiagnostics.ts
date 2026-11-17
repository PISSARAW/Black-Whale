import { sampleGamepad, type FightPad, type PadFrame } from './fightGamepad'
import { EMPTY_INPUT } from './types'

interface PreviousPad {
  pad: FightPad
  input: PadFrame['input']
}
interface PadEvent {
  at: number
  index: number
  actions: string[]
}
const CAPACITY = 600
const XBOX_BUTTONS = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'Back',
  'Start',
  'LS',
  'RS',
  '↑',
  '↓',
  '←',
  '→',
  'Xbox',
]
export const xboxButtonLabel = (index: number) => XBOX_BUTTONS[index] ?? `B${index}`

function snapshot(pad: FightPad): FightPad {
  return { ...pad, axes: [...pad.axes], buttons: pad.buttons.map((button) => ({ ...button })) }
}

function percentile(values: number[], fraction: number) {
  if (!values.length) return null
  const sorted = values.slice().sort((a, b) => a - b)
  return sorted[Math.ceil(sorted.length * fraction) - 1]
}

/** Local browser sampling, deliberately independent of fight state and private Nen. */
export function createGamepadDiagnostics() {
  let previous = new Map<number, PreviousPad>()
  let intervals: number[] = []
  let events: PadEvent[] = []
  let last: number | null = null
  let polls = 0
  let pads: ReturnType<typeof describePad>[] = []

  return {
    observe(connected: readonly (FightPad | null)[], now: number) {
      if (!Number.isFinite(now)) return
      if (last !== null && now > last) intervals = [...intervals, now - last].slice(-CAPACITY)
      last = now
      polls++
      const next = new Map<number, PreviousPad>()
      pads = connected
        .filter((pad): pad is FightPad => Boolean(pad?.connected))
        .slice(0, 4)
        .map((pad) => {
          const held = previous.get(pad.index)
          const old = held?.pad.id === pad.id ? held : undefined
          const frame =
            pad.mapping === 'standard'
              ? sampleGamepad(pad, old?.pad ?? null, old?.input ?? EMPTY_INPUT)
              : { input: { ...EMPTY_INPUT }, actions: [], neutral: true }
          next.set(pad.index, { pad: snapshot(pad), input: frame.input })
          if (frame.actions.length)
            events = [...events, { at: now, index: pad.index, actions: [...frame.actions] }].slice(
              -80,
            )
          return describePad(pad, frame)
        })
      previous = next
    },
    report() {
      return {
        scope: 'browser-gamepad-polling; not physical input-to-display latency',
        polls,
        interval: {
          count: intervals.length,
          p50: percentile(intervals, 0.5),
          p95: percentile(intervals, 0.95),
          max: intervals.length ? Math.max(...intervals) : null,
        },
        pads: structuredClone(pads),
        events: structuredClone(events),
      }
    },
    reset() {
      previous.clear()
      intervals = []
      events = []
      pads = []
      polls = 0
      last = null
    },
  }
}

function describePad(pad: FightPad, frame: PadFrame) {
  return {
    index: pad.index,
    id: pad.id,
    mapping: pad.mapping,
    axes: pad.axes.slice(0, 4).map((value) => (Number.isFinite(value) ? value : 0)),
    buttons: pad.buttons.slice(0, 32).flatMap((button, index) => (button.pressed ? [index] : [])),
    triggers: [6, 7].map((index) => {
      const value = pad.buttons[index]?.value ?? 0
      return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
    }),
    held: Object.entries(frame.input)
      .filter(([, active]) => active)
      .map(([key]) => key),
    neutral: frame.neutral,
  }
}
