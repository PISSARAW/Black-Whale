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
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('the recorded Melody concert', () => {
  it('streams through the shared graph and releases its media source when stopped', () => {
    const output = gain()
    const mediaSource = { connect: vi.fn(), disconnect: vi.fn() }
    const recording = {
      preload: '',
      currentTime: 17,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    }
    const Audio = vi.fn(() => recording)
    vi.stubGlobal('Audio', Audio)
    const context = {
      currentTime: 12,
      createGain: vi.fn(() => output),
      createMediaElementSource: vi.fn(() => mediaSource),
      close: vi.fn(),
    }
    const graph = { context, muffle: {} }
    held.graph = graph

    const stop = startMelodyConcert()

    expect(Audio).toHaveBeenCalledWith('/audio/melody-concert.mp3')
    expect(recording.preload).toBe('auto')
    expect(context.createMediaElementSource).toHaveBeenCalledWith(recording)
    expect(mediaSource.connect).toHaveBeenCalledWith(output)
    expect(output.connect).toHaveBeenCalledWith(graph.muffle)
    expect(recording.play).toHaveBeenCalledOnce()

    stop()
    stop()
    expect(output.gain.setTargetAtTime).toHaveBeenCalledWith(0, 12, 0.025)
    vi.advanceTimersByTime(1000)
    expect(recording.pause).toHaveBeenCalledOnce()
    expect(recording.currentTime).toBe(0)
    expect(mediaSource.disconnect).toHaveBeenCalledOnce()
    expect(output.disconnect).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(context.close).not.toHaveBeenCalled()
  })
})
