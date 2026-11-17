import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { createLessonFight, initialLessonProgress, observeLesson } from './fightLessonState'
import { FIGHT_LESSONS, type LessonId } from './fightLessons'
import {
  FIGHT_CHALLENGES,
  createChallengeFight,
  initialChallengeProgress,
  observeChallenge,
  type ChallengeId,
} from './fightChallenges'
import {
  ARCADE_ENCOUNTERS,
  arcadeFight,
  initialArcade,
  nextArcade,
  observeArcade,
} from './clashArcade'
import { createClashPractice } from './clashPractice'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { attackPhase } from './frameData'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function lesson(id: LessonId) {
  let state = createLessonFight(id)
  let progress = initialLessonProgress(id)
  return {
    get state() {
      return state
    },
    get progress() {
      return progress
    },
    frames(count: number, input: Partial<FightInput> = {}) {
      for (let i = 0; i < count; i++) {
        state = tickFight(state, { ...EMPTY_INPUT, ...input }, { dt: 1 / 60, ai: false })
        progress = observeLesson(progress, state)
      }
    },
    attack(action: 'light' | 'throw', input: Partial<FightInput> = {}) {
      state = performTrainingAction({
        state,
        side: 'player',
        action,
        input: { ...EMPTY_INPUT, ...input },
      })
    },
  }
}
function challenge(id: ChallengeId) {
  let state = createChallengeFight(id)
  let progress = initialChallengeProgress(id, state)
  return {
    get state() {
      return state
    },
    get progress() {
      return progress
    },
    frames(count: number, partial: Partial<FightInput> = {}) {
      for (let i = 0; i < count; i++) {
        state = tickFight(
          state,
          { ...EMPTY_INPUT, ...partial },
          { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false },
        )
        progress = observeChallenge(progress, state)
      }
    },
    attack(action: 'light' | 'special' | 'ranged') {
      state = performTrainingAction({ state, side: 'player', action })
    },
    edit(run: (state: FightState) => FightState) {
      state = run(state)
    },
  }
}

describe('foundation lessons complement the ten Nen lessons', () => {
  it('keeps fifteen unique, bilingual practical exercises', () => {
    expect(FIGHT_LESSONS).toHaveLength(15)
    expect(new Set(FIGHT_LESSONS.map(({ id }) => id)).size).toBe(15)
    expect(
      FIGHT_LESSONS.every((entry) =>
        entry.steps.every(([fr, en]) => fr.length > 20 && en.length > 20),
      ),
    ).toBe(true)
  })
  it('learns Ten by returning to neutral, without counting held Ren', () => {
    const run = lesson('ten')
    run.frames(70, { aura: true })
    expect(run.progress.complete).toBe(false)
    run.frames(60)
    expect(run.progress.complete).toBe(true)
  })
  it('requires actual spacing, not just elapsed time', () => {
    const run = lesson('spacing')
    run.frames(60)
    expect(run.progress.complete).toBe(false)
    run.frames(10, { left: true })
    run.frames(30)
    expect(run.progress.complete).toBe(true)
  })
  it('requires an actual guarded impact for ordinary defense', () => {
    const run = lesson('guard')
    run.frames(180, { guard: true })
    expect(run.progress.complete).toBe(true)
    expect(run.state.player.health).toBe(300)
  })
  it('requires a throw to connect after approaching', () => {
    const run = lesson('throw')
    run.attack('throw')
    run.frames(45)
    expect(run.progress.complete).toBe(false)
    run.frames(5, { right: true })
    run.attack('throw')
    run.frames(40)
    expect(run.progress.complete).toBe(true)
  })
  it('completes a punishment only on a real recovery hit', () => {
    const run = lesson('punish')
    run.frames(10, { left: true })
    for (let i = 0; !run.state.opponent.attack && i < 120; i++) run.frames(1)
    for (let i = 0; attackPhase(run.state.opponent) !== 'recovery' && i < 90; i++) run.frames(1)
    expect(run.state.opponent.attack?.confirmedHit).toBe(false)
    expect(run.state.player.hitStun).toBe(0)
    run.frames(10, { right: true })
    run.attack('light', { right: true })
    run.frames(12)
    expect(run.progress.complete).toBe(true)
    expect(run.state.impact?.punish).toBe(true)
  })
})

describe('short Nen challenges measure real counterplay', () => {
  it('observes interruption on individual simulation frames inside a slower render batch', () => {
    const practice = createClashPractice()
    let state = practice.challenge('interrupt-preparation')
    const runtime = createFightMatchRuntime(() => 0)
    runtime.observeFrames(practice.observe)
    runtime.begin(state)
    for (let i = 0; i < 5; i++)
      state = runtime.advance(
        state,
        { ...EMPTY_INPUT, right: true },
        { dt: 0.05, opponentInput: EMPTY_INPUT },
      )
    runtime.enqueue(state, { kind: 'move', side: 'player', action: 'light', input: 0 })
    for (let i = 0; i < 5; i++)
      state = runtime.advance(state, EMPTY_INPUT, { dt: 0.05, opponentInput: EMPTY_INPUT })
    expect(get(practice).challenge?.complete).toBe(true)
  })
  it.each(FIGHT_CHALLENGES)(
    '$id does not pass by idling or by repeated observation of one frame',
    ({ id }) => {
      const state = createChallengeFight(id)
      let progress = initialChallengeProgress(id, state)
      for (let i = 0; i < 50; i++) progress = observeChallenge(progress, state)
      expect(progress.complete).toBe(false)
      expect(progress.held).toBe(0)
    },
  )
  it('interrupts a real Phinks windup through physical contact', () => {
    const run = challenge('interrupt-preparation')
    expect(run.state.opponent.cyclotronWindup).toBeDefined()
    run.frames(14, { right: true })
    run.attack('light')
    run.frames(15)
    expect(run.progress.complete).toBe(true)
    expect(run.state.opponent.cyclotronWindup).toBeUndefined()
  })
  it('does not credit an unrelated hit after preparation was already abandoned', () => {
    const run = challenge('interrupt-preparation')
    run.edit((s) => ({ ...s, opponent: { ...s.opponent, cyclotronWindup: undefined } }))
    run.frames(8, { right: true })
    run.attack('light')
    run.frames(15)
    expect(run.progress.complete).toBe(false)
  })
  it('allows a ranged interruption of an elastic pull without dispelling the gum', () => {
    const run = challenge('interrupt-tether')
    run.attack('ranged')
    run.frames(90)
    expect(run.progress.complete).toBe(true)
    expect(run.state.bungeeGum).not.toBeNull()
    expect(run.state.bungeeGum?.retracting).toBe(false)
  })
  it('returns to the paid projection’s body and guards the actual incoming shot', () => {
    const run = challenge('protect-body')
    expect(run.state.player.aura).toBeLessThan(100)
    const bodyX = run.state.player.hanzoProjection!.bodyX
    for (let i = 0; Math.abs(run.state.player.x - bodyX) > 3 && i < 30; i++)
      run.frames(1, { left: true })
    run.attack('special')
    expect(run.state.player.hanzoProjection).toBeUndefined()
    run.frames(60, { guard: true, down: true })
    expect(run.progress.complete).toBe(true)
    expect(run.progress.failed).toBe(false)
  })
  it('fails protecting the body when a real shot reaches the sleeping body', () => {
    const run = challenge('protect-body')
    run.frames(90)
    expect(run.progress.failed).toBe(true)
    expect(run.progress.complete).toBe(false)
  })
  it('reveals In through available Gyo without erasing the tether', () => {
    const run = challenge('reveal-in')
    run.frames(40, { gyo: true })
    expect(run.progress.complete).toBe(true)
    expect(run.state.bungeeGum?.hidden).toBe(true)
  })
  it('does not grant sight to sealed eyes or count reset progress', () => {
    const run = challenge('reveal-in')
    run.edit((s) => ({
      ...s,
      player: { ...s.player, hatsuEffects: { ...s.player.hatsuEffects, senseSeals: 1 } },
    }))
    run.frames(60, { gyo: true })
    expect(run.progress.complete).toBe(false)
    const reset = observeChallenge(run.progress, createChallengeFight('reveal-in'))
    expect(reset.failed).toBe(true)
  })
})

describe('five-encounter Arcade progression', () => {
  it('requires match victory before advancing and resets the next encounter’s body and conditions', () => {
    const progress = initialArcade('kurapika')
    const state = arcadeFight(progress)
    expect(nextArcade(progress, state)).toBe(progress)
    const won = {
      ...state,
      phase: 'finished' as const,
      matchWinner: 'player' as const,
      roundsWon: { player: 2, opponent: 0 },
    }
    const next = nextArcade(progress, won)
    const fresh = arcadeFight(next)
    expect(next.index).toBe(1)
    expect(fresh.opponent.id).toBe('franklin')
    expect(fresh.player.health).toBe(300)
    expect(fresh.player.equipment).toEqual([])
    expect(fresh.bungeeGum).toBeNull()
    expect(fresh.rng).toBe(arcadeFight(next).rng)
  })
  it('preserves the loss for retry and completes only the final match', () => {
    const initial = initialArcade('hisoka')
    expect(
      observeArcade(initial, { ...arcadeFight(initial), matchWinner: 'opponent' }).failed,
    ).toBe(true)
    const final = { ...initial, index: ARCADE_ENCOUNTERS.length - 1 }
    const completed = observeArcade(final, { ...arcadeFight(final), matchWinner: 'player' })
    expect(completed.complete).toBe(true)
    expect(nextArcade(completed, { ...arcadeFight(final), matchWinner: 'player' })).toBe(completed)
  })
  it('keeps an authored challenge isolated from P2 inputs and retries its actual scenario', () => {
    const practice = createClashPractice()
    const state = practice.challenge('reveal-in')
    expect(practice.opponentInput({ ...EMPTY_INPUT, left: true })).toBe(EMPTY_INPUT)
    practice.observe({ ...state, frame: state.frame + 1201 })
    expect(get(practice).challenge?.failed).toBe(true)
    practice.challenge('reveal-in')
    expect(get(practice).challenge?.failed).toBe(false)
    practice.exit()
    expect(practice.active).toBe(false)
  })
})
