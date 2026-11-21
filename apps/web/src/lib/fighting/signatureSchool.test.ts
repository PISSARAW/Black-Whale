import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createCombatSchool, advanceCombatSchool } from './combatSchool'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { ACADEMY_SIGNATURES } from './signatureSchool'
import { EMPTY_INPUT, type FightState } from './types'

function lesson(id: string, demo: boolean) {
  const school = createCombatSchool()
  const match = createFightMatchRuntime(undefined, { record: false })
  match.observeFrames(school.observe)
  const state = school.start(id, demo)
  match.begin(state)
  return { school, match, state }
}

for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.05])
  describe(`signature demonstrations at ${Math.round(1 / dt)} render batches/s`, () => {
    for (const combo of ACADEMY_SIGNATURES)
      it(combo.id, () => {
        const { school, match } = lesson(combo.id, true)
        let { state } = lesson(combo.id, true)
        state = school.start(combo.id, true)
        match.begin(state)
        for (let i = 0; i < 1200 && !get(school)?.complete && !get(school)?.failed; i++)
          state = advanceCombatSchool({
            school,
            match,
            state,
            dt,
            input: EMPTY_INPUT,
            opponentInput: EMPTY_INPUT,
          })
        expect(get(school), JSON.stringify(get(school))).toMatchObject({
          complete: true,
          failed: false,
          step: combo.steps.length,
        })
      })
  })

it('offers every signature in the Academy', () => {
  expect(ACADEMY_SIGNATURES.map((combo) => combo.id)).toEqual(
    expect.arrayContaining([
      'kurapika:scarlet-verdict',
      'kurapika:scarlet-verdict-troupe',
      'hisoka:elastic-murder',
      'chrollo:double-page',
      'benjamin:absolute-command',
    ]),
  )
})

describe('signature exercises judge the player’s own commands', () => {
  function play(id: string, action: 'light' | 'heavy', input = EMPTY_INPUT) {
    const { school, match } = lesson(id, false)
    let state: FightState = school.start(id, false)
    match.begin(state)
    match.enqueue(state, { kind: 'move', side: 'player', action, input: 0 })
    for (
      let i = 0;
      i < 30 && !(get(school) as { hits?: number })?.hits && !get(school)?.failed;
      i++
    )
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input,
        opponentInput: EMPTY_INPUT,
      })
    return get(school)
  }

  it('fails an opening that is not the first step', () => {
    expect(play('kurapika:scarlet-verdict', 'heavy')).toMatchObject({ failed: true, cue: 'wrong' })
  })

  it('advances on the real first step and its hit', () => {
    expect(play('hisoka:elastic-murder', 'light')).toMatchObject({
      failed: false,
      step: 1,
      hits: 1,
    })
  })
})
