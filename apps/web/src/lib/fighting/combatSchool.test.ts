import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { COMBAT_SCHOOL_ROUTES, COMBAT_FIGHTERS } from './combatRoutes'
import { createCombatSchool, advanceCombatSchool } from './combatSchool'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT } from './types'
import { INPUT_BUFFER_FRAMES } from './fightClock'

for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.05]) {
  describe(`combat demonstrations at ${Math.round(1 / dt)} render batches/s`, () => {
    for (const route of COMBAT_SCHOOL_ROUTES)
      it(route.id, () => {
        const school = createCombatSchool()
        const match = createFightMatchRuntime(undefined, { record: false })
        match.observeFrames(school.observe)
        let state = school.start(route.id, true)
        match.begin(state)
        for (let i = 0; i < 1000 && !get(school)?.complete && !get(school)?.failed; i++)
          state = advanceCombatSchool({
            school,
            match,
            state,
            dt,
            input: EMPTY_INPUT,
            opponentInput: EMPTY_INPUT,
          })
        expect(
          get(school),
          JSON.stringify({ lastAttack: state.player.attack, progress: get(school) }),
        ).toMatchObject({ complete: true, failed: false, step: route.moves.length })
      })
  })
}
describe('defense training follows actual block and recovery events', () => {
  for (const fighter of COMBAT_FIGHTERS)
    it(`${fighter}: block then punish`, () => {
      const school = createCombatSchool()
      const match = createFightMatchRuntime(undefined, { record: false })
      match.observeFrames(school.observe)
      let state = school.start(`${fighter}:defense`)
      match.begin(state)
      let buffered = false
      for (let i = 0; i < 180 && !get(school)?.complete && !get(school)?.failed; i++) {
        const ready = state.hitstop === 0 && state.player.blockStun <= INPUT_BUFFER_FRAMES
        if (get(school)?.step === 1 && !ready) expect(get(school)?.cue).toBe('defend-wait')
        if (get(school)?.step === 1 && ready && !buffered) {
          match.enqueue(state, { kind: 'move', side: 'player', action: 'light', input: 0 })
          buffered = true
        }
        state = advanceCombatSchool({
          school,
          match,
          state,
          dt: 1 / 60,
          input: { ...EMPTY_INPUT, guard: !buffered },
          opponentInput: EMPTY_INPUT,
        })
      }
      expect(get(school)).toMatchObject({ complete: true, failed: false, step: 2 })
      expect(state.impact?.punish).toBe(true)
    })
  it('explains when the real punish opening has expired', () => {
    const school = createCombatSchool()
    const match = createFightMatchRuntime(undefined, { record: false })
    match.observeFrames(school.observe)
    let state = school.start('kurapika:defense')
    match.begin(state)
    for (let i = 0; i < 180 && !get(school)?.failed; i++)
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input: { ...EMPTY_INPUT, guard: true },
        opponentInput: EMPTY_INPUT,
      })
    expect(get(school)).toMatchObject({
      step: 1,
      failed: true,
      complete: false,
      cue: 'defense-late',
    })
  })
  it('does not award a route for a different move or a broken combo', () => {
    const school = createCombatSchool()
    let state = school.start('hisoka:confirm')
    state = performTrainingAction({ state, side: 'player', action: 'heavy' })
    const match = createFightMatchRuntime(undefined, { record: false })
    match.begin(state)
    match.observeFrames(school.observe)
    for (let i = 0; i < 30; i++) state = match.advance(state, EMPTY_INPUT, { dt: 1 / 60 })
    expect(get(school)).toMatchObject({ failed: true, complete: false, cue: 'wrong' })
  })
})

describe('combat school remains reproducible after queue release and replay', () => {
  for (const route of COMBAT_SCHOOL_ROUTES)
    it(`replays ${route.id}`, async () => {
      const school = createCombatSchool()
      const match = createFightMatchRuntime()
      match.observeFrames(school.observe)
      let state = school.start(route.id, true)
      match.begin(state)
      for (let i = 0; i < 240 && !get(school)?.complete; i++)
        state = advanceCombatSchool({
          school,
          match,
          state,
          dt: 0.05,
          input: EMPTY_INPUT,
          opponentInput: EMPTY_INPUT,
        })
      expect(get(school)?.complete).toBe(true)
      const entry = await match.replays.save()
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(entry!.replay)))
      while (!replay.done) replay.advance(0.1, 2)
      expect(replay.error).toBe('')
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    })
  it('resends a demonstration command cancelled before the next simulation tick', () => {
    const school = createCombatSchool()
    const match = createFightMatchRuntime(undefined, { record: false })
    match.observeFrames(school.observe)
    let state = school.start('hisoka:confirm', true)
    match.begin(state)
    state = advanceCombatSchool({
      school,
      match,
      state,
      dt: 0.001,
      input: EMPTY_INPUT,
      opponentInput: EMPTY_INPUT,
    })
    match.clear()
    school.release()
    for (let i = 0; i < 120 && !get(school)?.complete; i++)
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input: EMPTY_INPUT,
        opponentInput: EMPTY_INPUT,
      })
    expect(get(school)).toMatchObject({ complete: true, failed: false })
  })
})
