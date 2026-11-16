import { beforeEach, describe, expect, it, vi } from 'vitest'
import { beginFight, createFight } from '../engine'

const audio = vi.hoisted(() => {
  const param = () => ({ value: 0, setTargetAtTime: vi.fn() })
  const context = { state: 'running', currentTime: 0, close: vi.fn() }
  const mixes: { dispose: ReturnType<typeof vi.fn>; setActive: ReturnType<typeof vi.fn> }[] = []
  const voices: { stop: ReturnType<typeof vi.fn> }[] = []
  return {
    context,
    mixes,
    voices,
    play: vi.fn(),
    createMix: vi.fn(() => {
      const mix = {
        context,
        effects: { gain: param() },
        ambience: { gain: param() },
        pressure: { gain: param() },
        hearing: [param(), param()],
        profile: { noiseHz: 300, droneHz: 50, air: 0.02 },
        setActive: vi.fn(),
        dispose: vi.fn(),
      }
      mixes.push(mix)
      return mix
    }),
    continuous: vi.fn(() => {
      const voice = { frequency: param(), level: param(), pan: param(), stop: vi.fn() }
      voices.push(voice)
      return voice
    }),
  }
})

vi.mock('$lib/audio/context', () => ({ sharedAudioContext: () => audio.context }))
vi.mock('./mixer', () => ({ createFightMix: audio.createMix, continuousVoice: audio.continuous }))
vi.mock('./play', () => ({ playFightSound: audio.play }))

import { createFightAudioDirector, DEFAULT_FIGHT_AUDIO } from './director'

describe('combat sound lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    audio.mixes.length = 0
    audio.voices.length = 0
  })

  it('does not replay attacks or ticks observed while muted or paused', () => {
    const initial = beginFight(createFight('kurapika', 'hisoka'))
    const director = createFightAudioDirector(initial)!
    const options = { paused: false, settings: DEFAULT_FIGHT_AUDIO }
    director.update(initial, options)
    expect(audio.play).toHaveBeenCalledTimes(2)
    audio.play.mockClear()
    const late = { ...initial, frame: 400, time: 5, remainingFrames: 300 }
    director.update(late, { ...options, paused: true })
    director.update(late, options)
    expect(audio.play).not.toHaveBeenCalled()
    const later = { ...late, frame: 415, remainingFrames: 285, time: 4.75 }
    director.update(later, { ...options, settings: { ...DEFAULT_FIGHT_AUDIO, muted: true } })
    director.update(later, options)
    expect(audio.play).not.toHaveBeenCalled()
    expect(audio.mixes[0].setActive).toHaveBeenCalledWith(false)
    director.dispose()
  })

  it('releases every sustained source on round reset and unmount, retaining the shared context', () => {
    const initial = { ...beginFight(createFight('kurapika', 'hisoka')), frame: 400 }
    const director = createFightAudioDirector(initial)!
    const options = { paused: false, settings: DEFAULT_FIGHT_AUDIO }
    director.update(initial, options)
    const oldVoices = [...audio.voices]
    expect(oldVoices.length).toBeGreaterThan(0)
    director.update({ ...initial, frame: 0, roundNumber: 2 }, options)
    expect(audio.mixes[0].dispose).toHaveBeenCalledOnce()
    oldVoices.forEach((voice) => expect(voice.stop).toHaveBeenCalledOnce())
    director.dispose()
    director.dispose()
    audio.voices.forEach((voice) => expect(voice.stop).toHaveBeenCalledOnce())
    audio.mixes.forEach((mix) => expect(mix.dispose).toHaveBeenCalledOnce())
    expect(audio.context.close).not.toHaveBeenCalled()
  })

  it('stays inert after disposal', () => {
    const state = beginFight(createFight('kurapika', 'hisoka'))
    const director = createFightAudioDirector(state)!
    director.dispose()
    director.update(state, { paused: false, settings: DEFAULT_FIGHT_AUDIO })
    expect(audio.play).not.toHaveBeenCalled()
  })
})
