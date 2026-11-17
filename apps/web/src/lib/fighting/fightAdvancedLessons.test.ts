import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createLessonFight, initialLessonProgress, observeLesson } from './fightLessonState'
import { FIGHT_LESSONS, FIGHT_CURRICULUM } from './fightLessons'
import { ADVANCED_FIGHT_LESSONS, type AdvancedLessonId } from './fightAdvancedLessons'
import { createFightLessons } from './fightLessonController'
import { performTrainingAction } from './trainingAction'
import { tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { attackPhase } from './frameData'
import { EMPTY_INPUT, type FightInput, type MoveAction } from './types'

function run(id: AdvancedLessonId) {
  let state = createLessonFight(id),
    progress = initialLessonProgress(id)
  const step = (input: Partial<FightInput> = {}) => {
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
  }
  return {
    get state() {
      return state
    },
    get progress() {
      return progress
    },
    step,
    move(action: MoveAction) {
      state = performTrainingAction({ state, side: 'player', action })
    },
    until(condition: () => boolean, input: Partial<FightInput> = {}) {
      for (let i = 0; i < 240 && !condition(); i++) step(input)
    },
  }
}
describe('five advanced practical exercises use real engine outcomes', () => {
  it('extends the curriculum while preserving the fifteen existing lesson identities', () => {
    expect(FIGHT_LESSONS).toHaveLength(15)
    expect(FIGHT_CURRICULUM).toHaveLength(20)
    expect(new Set(FIGHT_CURRICULUM.map((x) => x.id)).size).toBe(20)
    expect(FIGHT_CURRICULUM.slice(0, 15)).toEqual(FIGHT_LESSONS)
    expect(
      ADVANCED_FIGHT_LESSONS.every((x) =>
        x.steps.every((pair) => pair.every((s) => s.length > 20)),
      ),
    ).toBe(true)
  })
  it.each(ADVANCED_FIGHT_LESSONS)('$id is not completed by idling', (lesson) => {
    const r = run(lesson.id as AdvancedLessonId)
    for (let i = 0; i < 240; i++) r.step()
    expect(r.progress.complete).toBe(false)
  })
  it('validates an actual anti-air collision', () => {
    const r = run('anti-air')
    r.until(() => r.state.opponent.y > 2)
    r.move('heavy')
    r.until(() => r.progress.complete)
    expect(r.state.impact).toMatchObject({ attacker: 'player', antiAir: true, blocked: false })
    expect(r.progress.complete).toBe(true)
  })
  it('validates an actual throw tech with no impact damage', () => {
    const r = run('throw-escape'),
      health = r.state.player.health
    r.until(() => r.state.opponent.attack?.variant === 'throw')
    r.move('throw')
    r.until(() => r.progress.complete)
    expect(r.state.throwTech).toBeDefined()
    expect(r.state.player.health).toBe(health)
    expect(r.progress.complete).toBe(true)
  })
  it('requires a real two-hit confirmation and resets a dropped attempt', () => {
    const r = run('hit-confirm')
    r.move('light')
    r.until(() => r.progress.step === 1)
    r.until(() => canStartFighterAttack(r.state.player, 'heavy', 'kurapika:standingHeavy'))
    r.move('heavy')
    r.until(() => r.progress.complete)
    expect(r.state.impact?.comboHits).toBe(2)
    expect(r.progress.complete).toBe(true)
    const dropped = run('hit-confirm')
    dropped.move('light')
    dropped.until(() => dropped.progress.step === 1)
    dropped.until(() => dropped.progress.step === 0)
    expect(dropped.progress.complete).toBe(false)
  })
  it('lets Hisoka block at the wall and punish using an ordinary light', () => {
    const r = run('corner-defense')
    expect(r.state.player.x).toBe(7)
    r.until(() => r.progress.step === 1, { guard: true })
    expect(r.progress.step).toBe(1)
    r.until(() => r.state.hitstop === 0 && r.state.player.blockStun === 0, { guard: true })
    expect(attackPhase(r.state.opponent)).toBe('recovery')
    r.move('light')
    r.until(() => r.progress.complete)
    expect(r.state.impact).toMatchObject({ attacker: 'player', punish: true })
    expect(r.state.player.attack?.kind).toBe('light')
    expect(r.progress.complete).toBe(true)
  })
  it('interrupts Phinks before a rotation completes without supplying a new power', () => {
    const r = run('interrupt-setup')
    r.step()
    expect(r.progress.step).toBe(1)
    r.move('light')
    r.until(() => r.progress.complete)
    expect(r.state.opponent.cyclotronWindup).toBeUndefined()
    expect(r.state.opponent.hatsuEffects.cyclotronTurns).toBe(0)
    expect(r.state.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(r.progress.complete).toBe(true)
  })
  it('uses the normal controller and does not advance from a repeated render', () => {
    const lessons = createFightLessons()
    const state = lessons.start('interrupt-setup')
    lessons.observe(state)
    lessons.observe(state)
    expect(get(lessons)?.step).toBe(0)
    const after = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false })
    lessons.observe(after)
    lessons.observe(after)
    expect(get(lessons)?.step).toBe(1)
    lessons.exit()
    expect(get(lessons)).toBeNull()
  })
})
