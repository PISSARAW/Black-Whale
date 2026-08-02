import { afterEach, describe, expect, it } from 'vitest'
import { configureHuntAudio, huntAudioState, playHuntCue } from './audio'

afterEach(() => configureHuntAudio({ muted: true, volume: 0.35 }))

describe('hunt audio controls', () => {
  it('clamps volume and keeps mute explicit', () => {
    configureHuntAudio({ muted: false, volume: 2 })
    expect(huntAudioState()).toEqual({ muted: false, volume: 1 })
    configureHuntAudio({ volume: -1 })
    expect(huntAudioState().volume).toBe(0)
  })

  it('is safely silent before user activation', () => {
    expect(() => playHuntCue('contact')).not.toThrow()
  })
})
