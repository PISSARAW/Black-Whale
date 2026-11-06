import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startMelodyConcert } from './melodyConcert'

const held = vi.hoisted(() => ({ graph: null as unknown }))
vi.mock('./mixer', async (original) => ({
  ...(await original<typeof import('./mixer')>()),
  hatsuAudioGraph: () => held.graph,
}))

function gain() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})
afterEach(() => {
  held.graph = null
  vi.useRealTimers()
})

describe('the original concert flute', () => {
  it('cancels its scheduler and pending notes without closing the shared audio context', () => {
    const output = gain()
    const oscillators: Array<{ stop: ReturnType<typeof vi.fn>; onended?: () => void }> = []
    const context = {
      get currentTime() {
        return Date.now() / 1000
      },
      createGain: vi.fn().mockReturnValueOnce(output).mockImplementation(gain),
      createOscillator: vi.fn(() => {
        const oscillator = {
          type: '',
          frequency: { value: 0 },
          detune: { value: 0 },
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }
        oscillators.push(oscillator)
        return oscillator
      }),
      close: vi.fn(),
    }
    const graph = { context, muffle: {}, reverbSend: {} }
    held.graph = graph
    const stop = startMelodyConcert()
    vi.advanceTimersByTime(2500)
    const notes = oscillators.length
    expect(notes).toBeGreaterThan(2)
    expect(output.connect).toHaveBeenCalledWith(graph.muffle)
    stop()
    stop()
    vi.advanceTimersByTime(10000)
    expect(oscillators).toHaveLength(notes)
    expect(vi.getTimerCount()).toBe(0)
    expect(output.disconnect).toHaveBeenCalledOnce()
    for (const oscillator of oscillators) expect(oscillator.stop).toHaveBeenCalledTimes(2)
    expect(context.close).not.toHaveBeenCalled()
  })
})
