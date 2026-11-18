import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { advanceArenaUtility } from './arenaUtility'
import { advanceArena } from './arenaSimulation'
import { updateEntity } from './preparationWorld'
import { sunMoonBlastPower } from './sunMoonChargeRules'
import { sunMoonChargeOptions } from './sunMoonChargeOptions'
import { sunMoonChargeAi } from './sunMoonChargeAi'
import { bodyPlan } from './fightBodyMotion'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide, moon = false): FightState {
  const state = beginFight(
    createFight('chrollo', 'chrollo', {
      mode: 'versus-local',
      environment: { arenaInteractions: true },
    }),
  )
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [other]: { ...state[other], x: 78 },
    [side]: {
      ...state[side],
      x: 27,
      facing: 1,
      aura: 100,
      chrolloBook: {
        ...state[side].chrolloBook!,
        open: !moon,
        bookmark: moon ? 'sun-and-moon' : null,
      },
    },
  }
}
const command = (moon = false): ArsenalCommand => ({
  action: moon ? 'sun-moon-charge-moon' : 'sun-moon-charge-sun',
  target: 'arena:crate:34',
})
const use = (state: FightState, side: FightSide, cmd: ArsenalCommand) =>
  performArsenalAction({ state, side, command: cmd }, performAuraAttack)
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
const crate = (state: FightState) =>
  state.battlefield!.entities.find((entry) => entry.id === 'arena:crate:34')!

describe('five real seconds of continuous Sun and Moon contact', () => {
  for (const side of ['player', 'opponent'] as const)
    for (const moon of [false, true]) {
      const mark = moon ? 'moon' : 'sun'
      const key = moon ? 'moonCharge' : 'sunCharge'
      it(`${side}/${mark}: marks immediately, reaches full power only after 300 actual simulation steps, and pays once`, () => {
        const start = ready(side, moon)
        const admitted = use(start, side, command(moon))
        expect(crate(admitted).arena![mark]).toBe(side)
        expect(crate(admitted).arena![key] ?? 0).toBe(0)
        expect(admitted[side].aura).toBe(88)
        const almost = frames(admitted, 299)
        expect(crate(almost).arena![key]).toBe(299)
        expect(almost.arena!.pending[side]?.frames).toBe(1)
        const full = frames(almost, 1)
        expect(crate(full).arena![key]).toBe(300)
        expect(full.arena!.pending[side]).toBeUndefined()
        expect(full[side].sunMoonCharging).toBeUndefined()
        expect(crate(start).arena![mark]).toBeUndefined()
      })
      it(`${side}/${mark}: an explicit release retains the attained charge and stops spending time in recovery`, () => {
        const held = frames(use(ready(side, moon), side, command(moon)), 60)
        const released = use(held, side, { action: 'sun-moon-release' })
        expect(released.arena!.pending[side]).toBeUndefined()
        expect(released[side].arenaRecovery).toBe(0)
        expect(crate(released).arena![key]).toBe(60)
        expect(crate(frames(released, 20)).arena![key]).toBe(60)
      })
      it(`${side}/${mark}: moving the actual target away interrupts contact without removing the mark`, () => {
        const held = frames(use(ready(side, moon), side, command(moon)), 30)
        const displaced = updateEntity(held, 'arena:crate:34', { x: 38 })
        const stopped = advanceArenaUtility(displaced, side)
        expect(stopped.arena!.pending[side]).toBeUndefined()
        expect(crate(stopped).arena![key]).toBe(30)
        expect(crate(stopped).arena![mark]).toBe(side)
      })
      it(`${side}/${mark}: the required missing forearm prevents admission and leaves aura unchanged`, () => {
        const start = ready(side, moon)
        const injured: FightState = {
          ...start,
          [side]: {
            ...start[side],
            bodyDamage: { parts: [moon ? 'right-forearm' : 'left-forearm'] },
          },
        }
        expect(use(injured, side, command(moon))).toBe(injured)
      })
    }
  for (const hz of [20, 30, 60, 120])
    it(`requires five simulation seconds at ${hz} host ticks per second`, () => {
      let state = use(ready('player'), 'player', command())
      for (let i = 0; i < hz * 5; i++)
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / hz, opponentInput: EMPTY_INPUT })
      expect(crate(state).arena!.sunCharge).toBe(300)
      expect(state.arena!.pending.player).toBeUndefined()
    })
  it('repeated short contacts do not add up to a continuous five-second contact', () => {
    let state = frames(use(ready('player'), 'player', command()), 60)
    state = use(state, 'player', { action: 'sun-moon-release' })
    state = frames(use(state, 'player', command()), 60)
    expect(crate(state).arena!.sunCharge).toBe(60)
    expect(state.arena!.pending.player?.frames).toBe(240)
  })
  it('losing the page, taking a hit or entering Zetsu interrupts the actual hold', () => {
    const held = frames(use(ready('player'), 'player', command()), 10)
    for (const player of [
      { ...held.player, chrolloBook: { ...held.player.chrolloBook!, open: false } },
      { ...held.player, hitStun: 5 },
      { ...held.player, nen: { ...held.player.nen, mode: 'zetsu' as const } },
    ]) {
      const stopped = advanceArenaUtility({ ...held, player }, 'player')
      expect(stopped.arena!.pending.player).toBeUndefined()
      expect(crate(stopped).arena!.sunCharge).toBe(10)
    }
  })
  it('allows the left-hand Sun with a closed bookmarked book and refuses a right-hand Moon with the book open', () => {
    expect(use(ready('player', true), 'player', command()).arena!.pending.player?.mark).toBe('sun')
    const open = ready('player')
    expect(use(open, 'player', command(true))).toBe(open)
  })
  it('uses charged power in the actual contact explosion, while the quick mark keeps its original damage', () => {
    const quick = use(ready('player'), 'player', command())
    const full = frames(quick, 300)
    const explode = (state: FightState) => {
      state = updateEntity(state, 'arena:crate:34', {
        arena: { ...crate(state).arena!, facing: -1 },
      })
      state = updateEntity(state, 'arena:crate:66', {
        x: 40,
        arena: { width: 3, height: 8, moon: 'player', moonPoint: { x: -3, y: 8 } },
      })
      state = {
        ...state,
        player: { ...state.player, x: 22 },
        opponent: { ...state.opponent, x: 40 },
      }
      const exploded = advanceArena(state)
      expect(exploded.arena!.pending.player).toBeUndefined()
      expect(exploded.player.sunMoonCharging).toBeUndefined()
      return exploded.opponent.health
    }
    expect(explode(full)).toBeLessThan(explode(quick))
    const almost = updateEntity(full, 'arena:crate:34', {
      arena: { ...crate(full).arena!, sunCharge: 299 },
    })
    const moon = full.battlefield!.entities.find((entry) => entry.id === 'arena:crate:66')!
    expect(sunMoonBlastPower(crate(almost), moon).damage).toBe(59)
    expect(sunMoonBlastPower(crate(full), moon).damage).toBe(60)
  })
  it('exposes both polarities and release through the real options and lets AI charge only existing matter', () => {
    const state = ready('opponent')
    expect(
      sunMoonChargeOptions(state, 'opponent').some(
        (entry) => entry.ready && entry.command.action === 'sun-moon-charge-sun',
      ),
    ).toBe(true)
    const held = sunMoonChargeAi(state)
    expect(held.arena!.pending.opponent?.charge).toBe(true)
    expect(held.arsenalTrace?.command.action).toBe('sun-moon-charge-sun')
    expect(sunMoonChargeOptions(held, 'opponent')[0].command.action).toBe('sun-moon-release')
    const empty = { ...state, battlefield: { ...state.battlefield!, entities: [] } }
    expect(sunMoonChargeAi(empty)).toBe(empty)
  })
  it('uses the existing shared body plan and keeps the book arm free during a left-hand Sun', () => {
    const state = use(ready('player'), 'player', command())
    const plan = bodyPlan(state.player, { seconds: 0, progress: 1 })!
    expect(plan.key).toBe('sun-moon-charge-sun')
    expect(plan.pose.rearShoulder?.[0]).toBe(-1.25)
  })
})
