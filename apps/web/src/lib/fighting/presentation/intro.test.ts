import { describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import { PerspectiveCamera } from 'three'
import { createFight, beginFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { createIntroPlayback, introShot, type IntroFrame } from './introPlayback'
import { introBodyPlan } from './introMotion'
import { applyPresentationCamera } from './introCamera'
import { introDialogue, RIVAL_VOICE_ATLAS, RIVAL_VOICE_SAMPLE_RATE } from './introDialogue'
import { introSpeechCue } from '../audio/introSpeech'
import { COMBAT_VOICE_RATES } from '../audio/settings'
import { RIVALS, rivalKey } from './rivals'

const full = { enabled: true, mode: 'full' as const }
const sample = (elapsed: number): IntroFrame => ({
  elapsed,
  duration: 6.4,
  mode: 'full',
  waiting: false,
})

describe('combat entrances', () => {
  it('waits for the first rendered scene, plays both fighters, then starts exactly once', () => {
    const complete = vi.fn()
    const playback = createIntroPlayback(complete)
    const state = createFight('bill', 'hisoka')
    const before = structuredClone(state)
    playback.observe(state, full)
    playback.advance(20)
    expect(get(playback)?.elapsed).toBe(0)
    playback.sceneReady()
    playback.advance(1.2)
    expect(introShot(get(playback)!).side).toBe('player')
    playback.advance(2.4)
    expect(introShot(get(playback)!).side).toBe('opponent')
    playback.advance(1.5)
    expect(introShot(get(playback)!).side).toBeNull()
    playback.advance(2)
    playback.advance(20)
    playback.skip()
    playback.observe(state, full)
    expect(complete).toHaveBeenCalledTimes(1)
    expect(get(playback)).toBeNull()
    expect(state).toEqual(before)
  })

  it('holds the authored speaker and subtitle together when the rivals swap sides', () => {
    const state = createFight('chrollo', 'kurapika')
    const dialogue = introDialogue(state)!
    const playback = createIntroPlayback(vi.fn())
    playback.observe(state, full)
    expect(introSpeechCue(get(playback)!, dialogue, 'fr')).toBeUndefined()
    playback.sceneReady()
    const opening = get(playback)!
    expect(introShot(opening)).toEqual({ side: 'opponent', progress: 0 })
    expect(introSpeechCue(opening, dialogue, 'fr')).toMatchObject({ side: 'opponent', offset: 0 })
    playback.advance(dialogue.shotSeconds[0])
    const response = get(playback)!
    const [offset] = dialogue.spans.fr[1]
    expect(introSpeechCue(response, dialogue, 'fr')).toMatchObject({
      side: 'player',
      elapsed: 0,
      offset: offset / RIVAL_VOICE_SAMPLE_RATE,
    })
  })

  it('fits both takes of every exchange in the matched camera shots at the slowest register', () => {
    expect(Object.keys(RIVAL_VOICE_ATLAS).sort()).toEqual(
      RIVALS.map(({ pair }) => rivalKey(...pair)).sort(),
    )
    for (const { pair } of RIVALS) {
      const state = createFight(...pair)
      const dialogue = introDialogue(state)!
      for (const spans of Object.values(dialogue.spans)) {
        expect(spans[0][0]).toBe(0)
        expect(spans[1][0] - spans[0][1]).toBe(4320)
        for (const [index, [, length]] of spans.entries())
          expect(length / (RIVAL_VOICE_SAMPLE_RATE * COMBAT_VOICE_RATES.low)).toBeLessThan(
            dialogue.shotSeconds[index],
          )
      }
    }
  })

  it('freezes while paused or hidden and ignores invalid time deltas', () => {
    const playback = createIntroPlayback(vi.fn())
    playback.observe(createFight('kurapika', 'hisoka'), full)
    playback.sceneReady()
    playback.advance(1)
    for (const dt of [NaN, Infinity, -4]) playback.advance(dt)
    playback.advance(9, true)
    expect(get(playback)?.elapsed).toBe(1)
  })

  it.each(['brief', 'off'] as const)('honours the %s preference', (mode) => {
    const complete = vi.fn()
    const playback = createIntroPlayback(complete)
    playback.observe(createFight('kurapika', 'hisoka'), { enabled: true, mode })
    expect(complete).not.toHaveBeenCalled()
    playback.sceneReady()
    if (mode === 'brief') {
      expect(introShot(get(playback)!).side).toBeNull()
      playback.advance(1.6)
    }
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('defers skipping until the scene is ready and recovers from rendering failure', () => {
    const complete = vi.fn()
    const playback = createIntroPlayback(complete)
    playback.observe(createFight('kurapika', 'hisoka'), full)
    playback.skip()
    expect(complete).not.toHaveBeenCalled()
    playback.sceneReady()
    expect(complete).toHaveBeenCalledTimes(1)
    playback.sceneLoading()
    playback.observe(createFight('kurapika', 'hisoka'), full)
    playback.sceneFailed()
    expect(complete).toHaveBeenCalledTimes(2)
  })

  it('restarts for a rematch and a new round, and cancels when disabled or combat starts', () => {
    const complete = vi.fn()
    const playback = createIntroPlayback(complete)
    const state = createFight('kurapika', 'hisoka')
    playback.sceneReady()
    playback.observe(state, full)
    playback.skip()
    playback.observe(beginFight(state), full)
    playback.observe({ ...state, roundNumber: 2 }, full)
    expect(get(playback)?.elapsed).toBe(0)
    playback.advance(1)
    playback.observe(createFight('kurapika', 'hisoka'), full)
    expect(get(playback)?.elapsed).toBe(0)
    playback.observe(state, { ...full, enabled: false })
    expect(get(playback)).toBeNull()
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('does not restart or reset playback when observing the same ready state', () => {
    const state = createFight('kurapika', 'hisoka')
    const playback = createIntroPlayback(vi.fn())
    playback.sceneReady()
    playback.observe(state, full)
    playback.advance(1)
    playback.observe(state, full)
    expect(get(playback)?.elapsed).toBe(1)
  })

  it('keeps an interrupted load paused, including disabled intros and renderer failures', () => {
    let paused = true
    const complete = vi.fn()
    const playback = createIntroPlayback(complete, () => paused)
    playback.observe(createFight('kurapika', 'hisoka'), { enabled: true, mode: 'off' })
    playback.sceneReady()
    expect(complete).not.toHaveBeenCalled()
    paused = false
    playback.advance(0)
    expect(complete).toHaveBeenCalledTimes(1)
    playback.sceneLoading()
    paused = true
    playback.observe(createFight('kurapika', 'hisoka'), full)
    playback.sceneFailed()
    expect(complete).toHaveBeenCalledTimes(1)
    paused = false
    playback.advance(0)
    expect(complete).toHaveBeenCalledTimes(2)
  })

  it('gives every selectable fighter a finite preparation pose in either seat without mutation', () => {
    for (const fighter of FIGHTING_ROSTER) {
      const state = createFight(fighter.id, fighter.id)
      const before = structuredClone(state)
      for (const side of ['player', 'opponent'] as const) {
        const frame = sample(side === 'player' ? 1.2 : 3.6)
        const plan = introBodyPlan({
          fighter: state[side],
          seconds: frame.elapsed,
          progress: 0,
          side,
          introFrame: frame,
        })
        expect(plan, fighter.id).toBeDefined()
        expect(Object.values(plan!.pose).flat().every(Number.isFinite)).toBe(true)
        expect(
          introBodyPlan({ fighter: state[side], seconds: 0, progress: 0, side, introFrame: null }),
        ).toBeUndefined()
      }
      expect(state).toEqual(before)
    }
  })

  it.each([16 / 9, 390 / 720, 320 / 720])(
    'fits closeups at aspect %s and respects reduced motion',
    (aspect) => {
      const state = createFight('franklin', 'biscuit')
      const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
      const options = { camera, state, intro: sample(1), reduced: false, intensity: 1 }
      expect(applyPresentationCamera(options)).toBe(true)
      const position = camera.position.clone()
      expect(position.toArray().every(Number.isFinite)).toBe(true)
      expect(applyPresentationCamera({ ...options, reduced: true })).toBe(false)
      expect(applyPresentationCamera({ ...options, intensity: 0 })).toBe(false)
      expect(camera.position.equals(position)).toBe(true)
      expect(applyPresentationCamera({ ...options, intro: sample(5.5) })).toBe(false)
    },
  )
})
