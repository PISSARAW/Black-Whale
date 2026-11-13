import { describe, expect, it } from 'vitest'

import type { RoomSoundProfile } from '$lib/tour/roomSound'

import { buildRoomAmbience, orientRoomAmbience, settleRoomAmbience } from './roomAmbience'

function fakeContext() {
  const connect = () => undefined
  const param = (value = 0) => ({
    value,
    cancelScheduledValues: () => undefined,
    setTargetAtTime(next: number) {
      this.value = next
    },
  })
  const context = {
    sampleRate: 8000,
    currentTime: 4,
    createGain: () => ({ connect, gain: param(0) }),
    createBiquadFilter: () => ({ connect, type: '', frequency: param(0), Q: param(0) }),
    createOscillator: () => ({ connect, start: connect, type: '', frequency: param(0) }),
    createBufferSource: () => ({ connect, start: connect, buffer: null, loop: false }),
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createPanner: () => ({
      connect,
      panningModel: '',
      distanceModel: '',
      refDistance: 0,
      rolloffFactor: 0,
      maxDistance: 0,
      positionX: param(0),
      positionY: param(0),
      positionZ: param(0),
    }),
  }
  return context as unknown as AudioContext
}

const profile: RoomSoundProfile = {
  kind: 'laundry',
  ventilation: { level: 0.06, cutoff: 1700, resonance: 1.2, wobble: 0.7 },
  crowd: { level: 0.04, cutoff: 620 },
  accent: { level: 0.05, frequency: 54, rate: 0.42, cutoff: 720 },
}

describe('persistent room ambience', () => {
  it('settles nodes already built instead of replacing the graph', () => {
    const context = fakeContext()
    const ambience = buildRoomAmbience(context, {} as AudioNode, {} as AudioNode)
    const current = ambience.current
    settleRoomAmbience(ambience, profile, null)

    expect(ambience.current).toBe(current)
    expect(ambience.current.ventilation.gain.gain.value).toBe(profile.ventilation.level)
    expect(ambience.current.crowd.gain.gain.value).toBe(profile.crowd.level)
    expect(ambience.current.accent.oscillator.frequency.value).toBe(profile.accent.frequency)
  })

  it('places the filtered neighbour at its doorway and follows a turn', () => {
    const ambience = buildRoomAmbience(fakeContext(), {} as AudioNode, {} as AudioNode)
    settleRoomAmbience(ambience, profile, { profile, at: [5, 0] })
    orientRoomAmbience(ambience, { at: [0, 0], heading: 0, pitch: 0 })
    const before = ambience.neighbourPanner.positionX.value
    orientRoomAmbience(ambience, { at: [0, 0], heading: Math.PI, pitch: 0 })

    expect(before).not.toBe(0)
    expect(ambience.neighbourPanner.positionX.value).toBeCloseTo(-before)
    expect(ambience.neighbourWall.frequency.value).toBe(760)
  })
})
