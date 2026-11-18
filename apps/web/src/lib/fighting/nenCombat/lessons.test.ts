import { describe, expect, it } from 'vitest'
import { createLessonFight, initialLessonProgress, observeLesson } from '../fightLessonState'
import { performTrainingAction } from '../trainingAction'
import { tickFight } from '../engine'
import { EMPTY_INPUT, type FightInput } from '../types'
import { NEN_COMBAT_LESSONS, type NenCombatLessonId } from './lessons'
function exercise(id: NenCombatLessonId) {
  let state = createLessonFight(id),
    progress = initialLessonProgress(id)
  return {
    get state() {
      return state
    },
    get progress() {
      return progress
    },
    step(input: Partial<FightInput> = {}) {
      state = tickFight(
        state,
        { ...EMPTY_INPUT, ...input },
        {
          dt: 1 / 60,
          ai: false,
          onFrame: (_before, after) => {
            progress = observeLesson(progress, after)
          },
        },
      )
    },
    move(action: 'light' | 'ranged', input: Partial<FightInput> = {}) {
      state = performTrainingAction({
        state,
        side: 'player',
        action,
        input: { ...EMPTY_INPUT, ...input },
      })
    },
  }
}
describe('six combat exercises require actual Nen and collision outcomes', () => {
  it.each(NEN_COMBAT_LESSONS)('$id never completes by idling', (lesson) => {
    const r = exercise(lesson.id as NenCombatLessonId)
    for (let i = 0; i < 240; i++) r.step()
    expect(r.progress.complete).toBe(false)
  })
  it('uses In on a real emitted projectile which hits the opponent', () => {
    const r = exercise('in-ambush')
    r.step({ conceal: true })
    expect(r.progress.step).toBe(1)
    r.move('ranged', { conceal: true })
    for (let i = 0; i < 100 && !r.progress.complete; i++) r.step({ conceal: true })
    expect(r.progress.complete, JSON.stringify({ p: r.progress, impact: r.state.impact })).toBe(
      true,
    )
  })
  it('uses hand Gyo in an actual strike, not merely a held input', () => {
    const r = exercise('gyo-body'),
      input = { gyo: true, focusHands: true }
    r.step(input)
    expect(r.progress.step).toBe(1)
    r.move('light', input)
    for (let i = 0; i < 50 && !r.progress.complete; i++) r.step(input)
    expect(
      r.progress.complete,
      JSON.stringify({ p: r.progress, impact: r.state.impact, player: r.state.player.gyoFocus }),
    ).toBe(true)
  })
  it('guards a real light with head Ko and does not pay an activation cost each frame', () => {
    const r = exercise('ko-defense'),
      input = { aura: true, guard: true, gyo: true, focusHead: true }
    r.step(input)
    const paid = r.state.player.aura
    for (let i = 0; i < 200 && !r.progress.complete; i++) r.step(input)
    expect(
      r.progress.complete,
      JSON.stringify({ p: r.progress, impact: r.state.impact, ko: r.state.player.nen.ko }),
    ).toBe(true)
    expect(paid - r.state.player.aura).toBeLessThan(20)
  })
  it('switches Ryu from hands to head and then blocks an actual incoming attack', () => {
    const r = exercise('ryu-switch')
    r.step({ focusHands: true })
    expect(r.progress.step).toBe(1)
    r.step({ focusHead: true, guard: true })
    expect(r.progress.step).toBe(1)
    for (let i = 0; i < 10 && r.progress.step === 1; i++) r.step({ focusHead: true, guard: true })
    expect(r.progress.step).toBe(2)
    for (let i = 0; i < 200 && !r.progress.complete; i++) r.step({ focusHead: true, guard: true })
    expect(r.progress.complete, JSON.stringify({ p: r.progress, impact: r.state.impact })).toBe(
      true,
    )
  })
  it('combines real equipped cards, Shu and committed hand Ko before a critical hit', () => {
    const r = exercise('shu-ko'),
      input = { shu: true, aura: true, guard: true, gyo: true, focusHands: true }
    r.step({ shu: true })
    expect(r.progress.step).toBe(1)
    r.step(input)
    expect(r.progress.step).toBe(2)
    r.move('light', input)
    for (let i = 0; i < 60 && !r.progress.complete; i++) r.step({ shu: true })
    expect(r.progress.complete, JSON.stringify({ p: r.progress, impact: r.state.impact })).toBe(
      true,
    )
  })
  it('locates an incoming projectile with En and manually times its parry without eyesight', () => {
    const r = exercise('en-intercept')
    for (let i = 0; i < 180 && r.progress.step === 0; i++) r.step({ en: true })
    expect(r.progress.step, JSON.stringify(r.progress)).toBe(1)
    for (let i = 0; i < 60 && !r.progress.complete; i++) {
      const near = r.state.projectiles.some((p) => Math.abs(p.x - r.state.player.x) < 7)
      r.step({ en: true, guard: near })
    }
    expect(
      r.progress.complete,
      JSON.stringify({ p: r.progress, impact: r.state.impact, projectiles: r.state.projectiles }),
    ).toBe(true)
  })
})
