import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { beginFight, createFight, performMove, tickFight } from '../engine'
import { createCombatSchool, advanceCombatSchool } from '../combatSchool'
import { createFightMatchRuntime } from '../fightMatchRuntime'
import { FIGHTING_ROSTER } from '../roster'
import { EMPTY_INPUT, type FightSide, type FightState } from '../types'
import { KAMEO_IDS } from './catalogue'
import { KAMEO_COMBO_LESSONS, comboSupportLanded } from './comboLessons'
import { withKameos } from './state'
import { kameoBadge } from './hud'
import { canAct } from '../fightActorState'

function step(state: FightState, side: FightSide = 'player', call = false) {
  const input = { ...EMPTY_INPUT, kameo: call, right: call }
  return tickFight(state, side === 'player' ? input : EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: side === 'opponent' ? input : EMPTY_INPUT,
  })
}

describe('combo support calls through a real impact freeze', () => {
  for (const fighter of FIGHTING_ROSTER)
    for (const side of ['player', 'opponent'] as const)
      it(`${fighter.id}, ${side}: retains one call and freezes all support clocks`, () => {
        let state = beginFight(
          withKameos(createFight(fighter.id, fighter.id, { mode: 'versus-local' }), {
            [side]: 'luzurus',
          }),
        )
        state = {
          ...state,
          player: { ...state.player, x: 44 },
          opponent: { ...state.opponent, x: 50 },
        }
        state = performMove({ state, side, action: 'light' })
        for (let f = 0; f < 40 && !state.hitstop; f++) state = step(state)
        expect(state[side].attack?.confirmedHit).toBe(true)
        expect(state.hitstop).toBeGreaterThan(0)
        const slot = state.kameos![side]!
        state = step(state, side, true)
        expect(state.kameos![side]).toEqual({
          ...slot,
          bufferedCall: side === 'player' ? 'forward' : 'back',
        })
        expect(kameoBadge(state, side, 'fr')).toMatchObject({
          ready: false,
          status: 'Appel mémorisé',
        })
        while (state.hitstop) state = step(state)
        state = step(state)
        expect(state.kameos![side]).toMatchObject({ phase: 'entering', phaseFrames: 0 })
        expect(state.kameos![side]).not.toHaveProperty('bufferedCall')
        for (let f = 0; f < 140; f++) state = step(state)
        expect(state.kameos![side]).toMatchObject({ phase: 'reserve' })
        expect(state.kameos![side]!.cooldownFrames).toBeGreaterThan(0)
      })

  for (const id of KAMEO_IDS)
    it(`${id}: cannot buffer a call while stunned, cooling down, dead or out of aura`, () => {
      const base = beginFight(
        withKameos(createFight('hisoka', 'kurapika', { mode: 'versus-local' }), { player: id }),
      )
      const slot = base.kameos!.player!
      const cases: FightState[] = [
        { ...base, player: { ...base.player, hitStun: 10 } },
        { ...base, kameos: { player: { ...slot, cooldownFrames: 1 } } },
        {
          ...base,
          kameos: {
            player: { ...slot, phase: 'eliminated', fighter: { ...slot.fighter, health: 0 } },
          },
        },
        { ...base, kameos: { player: { ...slot, fighter: { ...slot.fighter, aura: 0 } } } },
      ]
      for (const state of cases) {
        const next = step({ ...state, hitstop: 2 }, 'player', true)
        expect(next.kameos!.player).not.toHaveProperty('bufferedCall')
      }
    })

  it('rechecks the leader when thawing and discards an invalidated call', () => {
    let state = beginFight(
      withKameos(createFight('hisoka', 'kurapika', { mode: 'versus-local' }), {
        player: 'luzurus',
      }),
    )
    state = step({ ...state, hitstop: 1 }, 'player', true)
    state = step({ ...state, player: { ...state.player, hitStun: 10 } })
    expect(state.kameos!.player!.phase).toBe('reserve')
    expect(state.kameos!.player).not.toHaveProperty('bufferedCall')
    for (let f = 0; f < 20; f++) state = step(state)
    expect(state.kameos!.player!.phase).toBe('reserve')
  })
})

describe('six support lessons use real effects, costs and continuous contacts', () => {
  for (const position of ['centre', 'corner'] as const)
    it(`a late Luzurus call gives the defender a real reply at ${position}`, () => {
      const school = createCombatSchool()
      const match = createFightMatchRuntime(undefined, { record: false })
      match.observeFrames(school.observe)
      let state = school.start('hisoka:kameo-luzurus', true, {
        position,
        reaction: 'guard',
        followup: 'strike',
      })
      match.begin(state)
      let opening = -1
      let recovery = -1
      let reply = false
      for (let f = 0; f < 130 && !reply; f++) {
        const command = school.command(state)
        if (command) match.enqueue(state, command)
        if (state.impact?.attacker === 'player' && opening < 0) opening = state.frame
        if (opening >= 0 && !state.hitstop && canAct(state.opponent) && recovery < 0) {
          recovery = state.frame
          match.enqueue(state, { kind: 'move', side: 'opponent', action: 'light', input: 0 })
        }
        const input =
          opening >= 0 && state.frame >= opening + 30
            ? school.input(state, EMPTY_INPUT)
            : EMPTY_INPUT
        state = match.advance(state, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
        reply =
          state.impact?.attacker === 'opponent' && !state.impact.blocked && state.impact.damage > 0
      }
      expect(recovery).toBeGreaterThan(opening)
      expect(reply).toBe(true)
      expect(get(school)).toMatchObject({ complete: false, failed: true })
    })

  for (const route of KAMEO_COMBO_LESSONS)
    for (const position of ['centre', 'corner'] as const)
      for (const mirrored of [false, true])
        it(`${route.id}, ${position}, mirrored=${mirrored}`, () => {
          const school = createCombatSchool()
          const match = createFightMatchRuntime(undefined, { record: false })
          match.observeFrames(school.observe)
          let state = school.start(route.id, true, {
            position,
            reaction: 'guard',
            followup: 'strike',
          })
          if (mirrored)
            state = {
              ...state,
              player: { ...state.player, x: 100 - state.player.x, facing: -1 },
              opponent: { ...state.opponent, x: 100 - state.opponent.x, facing: 1 },
            }
          match.begin(state)
          const hits: number[] = []
          let last = 0
          let escaped = false
          for (let f = 0; f < 160 && !get(school)?.complete && !get(school)?.failed; f++) {
            state = advanceCombatSchool({
              school,
              match,
              state,
              dt: 1 / 60,
              input: EMPTY_INPUT,
              opponentInput: EMPTY_INPUT,
            })
            if (hits.length && !state.hitstop && state.opponent.hitStun === 0) escaped = true
            if (state.impact && state.impact.sequence !== last) {
              last = state.impact.sequence
              expect(state.impact.blocked).toBe(false)
              hits.push(state.impact.comboHits!)
            }
          }
          expect(get(school)).toMatchObject({ complete: true, failed: false, supportLanded: true })
          expect(comboSupportLanded(state, route.kameo!.id)).toBe(true)
          expect(escaped).toBe(false)
          const expected = route.kameo!.id === 'luzurus' ? 3 : 12
          expect(hits).toEqual(Array.from({ length: expected }, (_, i) => i + 1))
          expect(state.kameos!.player!.fighter.aura).toBeLessThan(40)
        })

  it('does not award the exercise when the player omits the call', () => {
    const route = KAMEO_COMBO_LESSONS.find((entry) => entry.kameo!.id === 'zhanglei')!
    const school = createCombatSchool()
    const match = createFightMatchRuntime(undefined, { record: false })
    match.observeFrames(school.observe)
    let state = school.start(route.id, true)
    match.begin(state)
    for (let f = 0; f < 130 && !get(school)?.failed; f++) {
      const command = school.command(state)
      if (command) match.enqueue(state, command)
      state = match.advance(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    }
    expect(get(school)).toMatchObject({ complete: false, failed: true, supportLanded: false })
    expect(state.impact?.comboHits).toBe(12)
  })
})
