import { describe, expect, it } from 'vitest'
import { createGamepadDiagnostics, xboxButtonLabel } from './gamepadDiagnostics'
import type { FightPad } from './fightGamepad'

function pad(buttons: number[] = [], axes = [0, 0]): FightPad {
  return {
    index: 0,
    id: 'Xbox standard',
    connected: true,
    mapping: 'standard',
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: buttons.includes(i),
      value: Number(buttons.includes(i)),
    })),
  }
}

describe('local Xbox hardware diagnostics', () => {
  it('shows analog trigger travel without guessing a digital press', () => {
    const capture = createGamepadDiagnostics()
    const xbox = pad()
    xbox.buttons[6].value = 0.75
    capture.observe([xbox], 0)
    expect(capture.report().pads[0].triggers).toEqual([0.75, 0])
    expect(capture.report().pads[0].buttons).not.toContain(6)
    expect(capture.report().events).toEqual([])
  })
  it('measures browser polling gaps, including stalls, with bounded memory', () => {
    const capture = createGamepadDiagnostics()
    for (let i = 0; i <= 700; i++) capture.observe([], i * 16)
    capture.observe([], 700 * 16 + 250)
    expect(capture.report().interval).toEqual({ count: 600, p50: 16, p95: 16, max: 250 })
    expect(capture.report().scope).toContain('not physical')
  })
  it('recognizes Xbox presses once and commits X only on release', () => {
    const capture = createGamepadDiagnostics()
    const mutable = pad()
    capture.observe([mutable], 0)
    mutable.buttons[0].pressed = true
    capture.observe([mutable], 16)
    capture.observe([mutable], 32)
    capture.observe([pad([2])], 48)
    capture.observe([pad()], 64)
    expect(capture.report().events.map(({ actions }) => actions)).toEqual([['light'], ['special']])
    expect([0, 1, 2, 3, 4, 5, 6, 7, 9].map(xboxButtonLabel)).toEqual([
      'A',
      'B',
      'X',
      'Y',
      'LB',
      'RB',
      'LT',
      'RT',
      'Start',
    ])
  })
  it('retains hysteresis and never guesses a nonstandard controller layout', () => {
    const capture = createGamepadDiagnostics()
    capture.observe([pad([], [0.6, 0])], 0)
    capture.observe([pad([], [0.4, 0])], 16)
    expect(capture.report().pads[0].held).toContain('right')
    capture.observe([{ ...pad([0]), mapping: '' }], 32)
    expect(capture.report().pads[0].held).toEqual([])
    expect(capture.report().events).toEqual([])
  })
  it('does not invent an edge on reconnection and reports are detached snapshots', () => {
    const capture = createGamepadDiagnostics()
    capture.observe([pad()], 0)
    capture.observe([], 16)
    capture.observe([pad([0])], 32)
    const report = capture.report()
    expect(report.events).toEqual([])
    report.pads[0].axes[0] = 999
    expect(capture.report().pads[0].axes[0]).toBe(0)
    capture.reset()
    expect(capture.report()).toMatchObject({
      polls: 0,
      pads: [],
      events: [],
      interval: { count: 0, p95: null },
    })
  })
})
