import { afterEach, describe, expect, it, vi } from 'vitest'
import { continuousVoice, type FightMix } from './mixer'

function fakeNode() {
  const param = { value: 0, setTargetAtTime: vi.fn() }
  return {
    connect: vi.fn(function (this: object) {
      return this
    }),
    disconnect: vi.fn(),
    frequency: { ...param },
    gain: { ...param },
    pan: { ...param },
    type: '',
  }
}

describe('sustained combat noise', () => {
  afterEach(() => vi.restoreAllMocks())

  it('starts shared noise layers at independent positions in the buffer', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const source = {
      buffer: null as AudioBuffer | null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }
    const samples = new Float32Array(96_000)
    const context = {
      currentTime: 0,
      sampleRate: 48_000,
      createBiquadFilter: () => fakeNode(),
      createGain: () => fakeNode(),
      createStereoPanner: () => fakeNode(),
      createBufferSource: () => source,
      createOscillator: () => fakeNode(),
      createBuffer: () => ({
        duration: 2,
        getChannelData: () => samples,
      }),
    } as unknown as AudioContext
    const target = fakeNode() as unknown as AudioNode
    const mix = { context } as FightMix

    continuousVoice(mix, { target, hz: 780, noise: true, level: 0.004 })

    expect(source.loop).toBe(true)
    expect(source.start).toHaveBeenCalledWith(0, 1)
  })
})
