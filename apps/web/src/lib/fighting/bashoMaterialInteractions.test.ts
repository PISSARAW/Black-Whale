import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight, performAuraAttack, performMove } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { updateEntity } from './preparationWorld'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { advanceWeakSpirits } from './bashoWard'
import { composeBashoPoem } from './bashoAction'
import { BASHO_ATTESTED_POEMS, type BashoEffect } from './bashoPoem'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
function setup(player: FighterId = 'chrollo'): FightState {
  const base = beginFight(
    createFight(player, 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['writing'], cohorts: [] } },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 25, aura: 100 },
    opponent: { ...base.opponent, x: 40 },
  }
}
function advance(state: FightState, count = 60): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}
function use(
  state: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  target?: string,
): FightState {
  return performArsenalCommand(state, 'player', { action, target })
}
function write(state: FightState, effect: BashoEffect): FightState {
  const started = composeBashoPoem(
    { state, side: 'player', text: BASHO_ATTESTED_POEMS[effect].fr },
    performAuraAttack,
  )
  expect(started.player.bashoPoem?.writingFrames).toBe(60)
  const completed = advance(started)
  expect(completed.player.bashoPoem?.ready).toBe(true)
  return completed
}
describe('written poems preserve the actual matter and the selected effect', () => {
  it('retains Gallery Fake provenance without cloning Nen marks or a stock identifier', () => {
    const base = setup('chrollo')
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: {
          pages: ['gallery-fake', 'basho'],
          page: 0,
          open: false,
          bookmark: 'gallery-fake',
        },
      },
    }
    state = updateEntity(state, 'player:writing-kit', {
      arena: { width: 1, height: 2, sun: 'player' },
    })
    state = copyHistoricalObject(state, 'player', 'player:writing-kit')
    const copy = state.battlefield!.entities.find((entry) => entry.copy)!
    expect(copy.writingKit?.sourceId).toBe(copy.id)
    expect(copy.writingKit?.copyId).toBe(copy.id)
    expect(copy.arena?.sun).toBeUndefined()
    state = advance({ ...state, player: { ...state.player, x: copy.x } }, 20)
    state = use(state, 'writing-take', copy.id)
    expect(state.player.writingKit?.copyId).toBe(copy.id)
    state = use(state, 'writing-drop')
    expect(state.battlefield!.entities.find((entry) => entry.id === copy.id)?.material).toBe('nen')
    expect(state.battlefield!.entities.find((entry) => entry.id === copy.id)?.copy).toEqual(
      copy.copy,
    )
    state = use(state, 'writing-take', copy.id)
    const changed = {
      ...state,
      player: {
        ...state.player,
        chrolloBook: { ...state.player.chrolloBook!, page: 1, bookmark: 'basho' as const },
      },
    }
    expect(
      composeBashoPoem(
        { state: changed, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
        performAuraAttack,
      ),
    ).toBe(changed)
    expect(advance(changed, 1).player.writingKit).toBeUndefined()
    expect(
      state.battlefield!.entities.find((entry) => entry.id === 'player:writing-kit')?.writingKit
        ?.sheets,
    ).toBe(3)
  })
  it('ignites matter only with the fist poem, including an archived fist composition', () => {
    const base = beginFight(
      createFight('basho', 'hisoka', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { arenaInteractions: true },
      }),
    )
    const positioned: FightState = {
      ...base,
      player: { ...base.player, x: 28.5, aura: 100 },
      opponent: { ...base.opponent, x: 80 },
    }
    const liarOnly = write(positioned, 'ignite-liar')
    const unlit = advance(performMove({ state: liarOnly, side: 'player', action: 'light' }), 20)
    expect(
      unlit.battlefield!.entities.find((e) => e.id === 'arena:crate:34')?.arena?.burning ?? 0,
    ).toBe(0)
    const withFist = write(write(positioned, 'ignite-punched-target'), 'ward-weak-spirits')
    const lit = advance(performMove({ state: withFist, side: 'player', action: 'light' }), 20)
    expect(
      lit.battlefield!.entities.find((e) => e.id === 'arena:crate:34')?.arena?.burning,
    ).toBeGreaterThan(0)
  })
  it('keeps a haunting on the real team member instead of transferring it to the incoming ally', () => {
    let state = beginFight(
      createTeamFight(
        { player: ['bill', 'basho', 'machi'], opponent: ['theta', 'hisoka', 'melody'] },
        { preparation: { mode: 'scenario', resources: ['spirits'], cohorts: [] } },
      ),
    )
    state = { ...state, player: { ...state.player, x: 7 } }
    state = updateEntity(state, 'player:weak-spirit', {
      x: 7,
      weakSpirit: { target: 'player', targetMember: 0, attached: true },
    })
    state = requestTeamAssist(state, 'player', 1)
    expect(state.player.id).toBe('basho')
    state = { ...state, player: { ...state.player, x: 50 } }
    const spirit = advanceWeakSpirits(state).battlefield!.entities.find(
      (entry) => entry.id === 'player:weak-spirit',
    )!
    expect(spirit.x).toBe(7)
    expect(spirit.weakSpirit?.attached).toBe(true)
  })
})
