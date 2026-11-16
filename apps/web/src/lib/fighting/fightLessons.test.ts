import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { FIXED_STEP } from './fightClock'
import { toggleEmperorTime } from './kurapikaActions'
import { createFightLessons } from './fightLessonController'
import { FIGHT_LESSONS, type LessonId } from './fightLessons'
import { createLessonFight, initialLessonProgress, observeLesson } from './fightLessonState'
import { EMPTY_INPUT, type FightInput, type MoveAction } from './types'

function exercise(id: LessonId) {
  let state = createLessonFight(id)
  let progress = initialLessonProgress(id)
  const frames = (count: number, input: Partial<FightInput> = {}) => {
    for (let frame = 0; frame < count; frame++) {
      state = tickFight(state, { ...EMPTY_INPUT, ...input }, { dt: FIXED_STEP, ai: false })
      progress = observeLesson(progress, state)
    }
  }
  return {
    get state() {
      return state
    },
    get progress() {
      return progress
    },
    frames,
    move(action: MoveAction, input: Partial<FightInput> = {}) {
      state = performTrainingAction({
        state,
        side: 'player',
        action,
        input: { ...EMPTY_INPUT, ...input },
      })
    },
    emperor() {
      state = toggleEmperorTime(state, 'player')
    },
  }
}

describe('practical Nen lessons', () => {
  it.each(FIGHT_LESSONS)('$id cannot be completed by idling', ({ id }) => {
    const run = exercise(id)
    run.frames(180)
    expect(run.progress.complete).toBe(false)
    expect(run.progress.step).toBe(0)
  })
  it('requires a full second of uninterrupted Ren', () => {
    const run = exercise('ren')
    run.frames(40, { aura: true })
    run.frames(1)
    run.frames(59, { aura: true })
    expect(run.progress.complete).toBe(false)
    run.frames(1, { aura: true })
    expect(run.progress.complete).toBe(true)
    expect(run.state.player.aura).toBeLessThan(90)
  })
  it('does not confuse a Ryu concentration with the Ren exercise', () => {
    const run = exercise('ren')
    run.frames(90, { focusHands: true })
    expect(run.progress.complete).toBe(false)
  })
  it('requires Ken to block a real dummy attack', () => {
    const run = exercise('ken')
    run.frames(80, { aura: true, guard: true })
    expect(run.progress.complete).toBe(false)
    run.frames(100, { aura: true, guard: true })
    expect(run.progress.complete).toBe(true)
    expect(run.state.impact?.blocked).toBe(true)
  })
  it('recovers aura through Zetsu rather than an infinite resource setting', () => {
    const run = exercise('zetsu')
    run.frames(37, { aura: true, down: true })
    expect(run.progress.complete).toBe(true)
    expect(run.state.player.aura).toBeGreaterThanOrEqual(26)
  })
  it('does not count aura recovered in Ten as Zetsu recovery', () => {
    const run = exercise('zetsu')
    run.frames(300)
    run.frames(1, { aura: true, down: true })
    expect(run.state.player.aura).toBeGreaterThan(26)
    expect(run.progress.complete).toBe(false)
    run.frames(36, { aura: true, down: true })
    expect(run.progress.complete).toBe(true)
  })
  it('reveals a prepared hidden tether with Gyo without removing it', () => {
    const run = exercise('gyo')
    run.frames(30, { gyo: true })
    expect(run.progress.complete).toBe(true)
    expect(run.state.bungeeGum?.hidden).toBe(true)
  })
  it('requires actual hand concentration for Ryu', () => {
    const run = exercise('ryu')
    run.frames(30, { focusTorso: true })
    expect(run.progress.complete).toBe(false)
    run.frames(30, { focusHands: true })
    expect(run.progress.complete).toBe(true)
  })
  it('lands a critical Ko by releasing Aura during heavy startup', () => {
    const run = exercise('ko')
    run.frames(1, { aura: true })
    run.move('heavy', { aura: true })
    run.frames(60)
    expect(run.progress.complete).toBe(true)
    expect(run.state.impact?.critical).toBe(true)
  })
  it('requires paying Emperor Time cost and explicitly turning it off', () => {
    const run = exercise('emperor')
    run.emperor()
    run.frames(60)
    expect(run.progress.step).toBe(1)
    expect(run.progress.complete).toBe(false)
    run.emperor()
    run.frames(1)
    expect(run.progress.complete).toBe(true)
    expect(run.state.player.kurapika?.lifespanFrames).toBe(60)
  })
  it('attaches, stretches and recalls Bungee Gum using actual combat actions', () => {
    const run = exercise('gum')
    run.move('special')
    run.frames(60)
    expect(run.progress.step).toBe(1)
    run.frames(35, { left: true })
    const x = run.state.opponent.x
    run.move('special', { right: true })
    run.frames(30)
    expect(run.progress.complete).toBe(true)
    expect(run.state.opponent.x).toBeLessThan(x)
  })
  it('does not confuse Hisoka’s rebound with a target recall', () => {
    const run = exercise('gum')
    run.move('special')
    run.frames(60)
    run.frames(35, { left: true })
    run.move('special', { left: true })
    run.frames(30)
    expect(run.progress.step).toBe(1)
    expect(run.progress.complete).toBe(false)
  })
  it('bookmarks Sun and Moon then opens a separate Black Voice page', () => {
    const run = exercise('bookmark')
    run.move('special', { down: true })
    run.frames(60)
    expect(run.progress.step).toBe(1)
    run.move('special', { left: true })
    run.frames(60)
    expect(run.progress.complete).toBe(true)
    expect(run.state.player.chrolloBook?.bookmark).toBe('sun-and-moon')
  })
  it('attaches Secret Window without inflicting damage', () => {
    const run = exercise('window')
    run.move('special', { right: true })
    run.frames(60)
    expect(run.progress.complete).toBe(true)
    expect(run.state.impact).toBeNull()
  })
  it('does not progress on repeated renders, and invalidates reset scenarios', () => {
    const run = exercise('ren')
    run.frames(30, { aura: true })
    let progress = run.progress
    for (let i = 0; i < 100; i++) progress = observeLesson(progress, run.state)
    expect(progress.heldFrames).toBe(run.progress.heldFrames)
    progress = observeLesson(progress, createLessonFight('ren'))
    expect(progress.invalid).toBe(true)
    expect(progress.complete).toBe(false)
  })
  it('locks next until completion and resets progress on retry', () => {
    const lessons = createFightLessons()
    let state = lessons.start('ren')
    expect(lessons.next()).toBeNull()
    for (let frame = 0; frame < 61; frame++) {
      state = tickFight(state, { ...EMPTY_INPUT, aura: true }, FIXED_STEP)
      lessons.observe(state)
    }
    expect(lessons.next()).toBe('ken')
    lessons.start('ren')
    expect(get(lessons)?.complete).toBe(false)
    lessons.exit()
    expect(get(lessons)).toBeNull()
  })
})
