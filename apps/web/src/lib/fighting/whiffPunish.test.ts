import { describe, expect, it } from 'vitest'
import { COMBAT_FIGHTERS, COMBAT_ROUTES, combatRoute } from './combatRoutes'
import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { attackPhase } from './frameData'
import { comboChoices } from './comboChoices'
import { selectedGumLink } from './bungeeNetwork'
import { setTrainingDummy } from './trainingSession'
import { whiffPunishReady } from './combatWhiffPractice'
import { routeHitsBefore } from './combatRouteContacts'
import { rosterPhysicalBranch } from './rosterComboBranches'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from './types'

type Inputs = { player?: Partial<FightInput>; opponent?: Partial<FightInput> }

function step(state: FightState, inputs: Inputs = {}) {
  return tickFight(
    state,
    { ...EMPTY_INPUT, ...inputs.player },
    {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, ...inputs.opponent },
    },
  )
}

function move(state: FightState, slot: MoveSlot, side: FightSide = 'player') {
  return performMove({
    state,
    side,
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state[side].facing),
  })
}

function until(state: FightState, done: (state: FightState) => boolean, inputs?: Inputs) {
  for (let i = 0; i < 120 && !done(state); i++) state = step(state, inputs)
  expect(
    done(state),
    JSON.stringify({
      frame: state.frame,
      impact: state.impact,
      gap: state.opponent.x - state.player.x,
    }),
  ).toBe(true)
  return state
}

function practice(id: string, facing: 1 | -1) {
  const state = setTrainingDummy(createCombatRouteFight(combatRoute(id)), { behavior: 'manual' })
  return {
    ...state,
    player: { ...state.player, facing, x: facing === 1 ? state.player.x : 100 - state.player.x },
    opponent: { ...state.opponent, facing: facing === 1 ? (-1 as const) : (1 as const) },
  }
}

function waitForRecovery(state: FightState, player: Partial<FightInput>) {
  return until(
    move(state, 'standingHeavy', 'opponent'),
    (next) => attackPhase(next.opponent) === 'recovery',
    { player },
  )
}

function opening(id: string, facing: 1 | -1) {
  const route = combatRoute(id)
  const initial = practice(id, facing)
  const idle = waitForRecovery(initial, EMPTY_INPUT)
  expect(idle.impact?.attacker).toBe('opponent')
  let retreated = move(initial, 'standingHeavy', 'opponent')
  const retreatFrames = route.whiff?.retreatFrames ?? 30
  for (let i = 0; i < retreatFrames && attackPhase(retreated.opponent) !== 'recovery'; i++)
    retreated = step(retreated, { player: { left: facing === 1, right: facing === -1 } })
  retreated = until(retreated, (state) => attackPhase(state.opponent) === 'recovery')
  expect(retreated.impact).toBeNull()
  expect((initial.player.x - retreated.player.x) * facing).toBeGreaterThan(1)
  const ready = until(retreated, (state) => whiffPunishReady(state, route.whiff!), {
    player: combatRouteInput('forwardLight', facing),
  })
  const hit = until(move(ready, route.moves[0]), (state) => !!state.impact)
  expect(hit.impact).toMatchObject({ punish: true, comboHits: 1, attacker: 'player' })
  expect(hit.player.attack?.comboOpening).toBe('whiff-punish')
  return hit
}

function chain(state: FightState, slot: MoveSlot, target: { hits: number; crouches?: boolean }) {
  const attempted = move(state, slot)
  expect(attempted.player.attack?.moveId).toBe(`${state.player.id}:${slot}`)
  return until(attempted, (next) => next.impact?.comboHits === target.hits, {
    opponent: { guard: true, down: target.crouches ?? true },
  })
}

describe.each([1, -1] as const)('whiff punish facing %s', (facing) => {
  it('lets Kurapika sweep or spend aura on a chain after actually retreating', () => {
    const hit = opening('kurapika:whiff-chain', facing)
    const sweep = chain(hit, 'lowHeavy', { hits: 2 })
    expect(sweep.opponent.knockdownFrames).toBeGreaterThan(0)
    const chainHit = chain(hit, 'forwardSpecial', { hits: 2 })
    expect(chainHit.player.aura).toBeLessThan(hit.player.aura)
  })

  it('requires a real tether for Hisoka’s finisher', () => {
    const hit = opening('hisoka:whiff-gum', facing)
    expect(move(hit, 'finisher').player.attack).toBe(hit.player.attack)
    expect(selectedGumLink(chain(hit, 'neutralSpecial', { hits: 2 }), 'player')).toBeDefined()
    const tethered = opening('hisoka:whiff-tether', facing)
    const confirmed = chain(tethered, 'forwardHeavy', { hits: 2 })
    expect(chain(confirmed, 'finisher', { hits: 3 }).player.aura).toBeLessThan(
      confirmed.player.aura,
    )
  })

  it('lets Franklin keep a crouching defender in the low barrage for all ten bullets', () => {
    const hit = opening('franklin:whiff-low', facing)
    const ended = chain(hit, 'downSpecial', { hits: 11 })
    expect(ended.impact?.blocked).toBe(false)
    const neutral = until(ended, (state) => state.opponent.hitStun === 0)
    const guarded = step(neutral, { opponent: { guard: true } })
    expect(guarded.opponent.blocking).toBe(true)
    const forward = { left: facing === 1, right: facing === -1 }
    const approached = until(
      neutral,
      (state) => facing * (neutral.opponent.x - state.opponent.x) > 1,
      { opponent: forward },
    )
    expect(approached.opponent.hitStun).toBe(0)
  })

  it('keeps Franklin’s short high barrage vulnerable to crouching', () => {
    const hit = opening('franklin:whiff-low', facing)
    expect(chain(hit, 'forwardSpecial', { hits: 11, crouches: false }).impact?.blocked).toBe(false)
    let missed = move(hit, 'forwardSpecial')
    for (let frame = 0; frame < 100; frame++)
      missed = step(missed, { opponent: { guard: true, down: true } })
    expect(missed.impact?.comboHits).toBe(1)
  })
})

it('does not grant the whiff route when the defender’s heavy made contact with guard', () => {
  const initial = practice('kurapika:whiff-chain', 1)
  const blocked = waitForRecovery(initial, { guard: true })
  expect(blocked.impact).toMatchObject({ attacker: 'opponent', blocked: true })
  const ready = until(blocked, (state) => state.player.blockStun === 0 && state.hitstop === 0)
  const first = ready.impact!.sequence
  const hit = until(move(ready, 'forwardLight'), (state) => state.impact?.sequence !== first)
  expect(hit.impact?.attacker).toBe('player')
  expect(hit.player.attack?.comboOpening).not.toBe('whiff-punish')
  expect(comboChoices(hit).every((choice) => choice.opening !== 'whiff-punish')).toBe(true)
})

it('offers at least one whiff lesson to every fighter', () => {
  const fighters = new Set(
    COMBAT_ROUTES.filter((route) => route.whiff).map((route) => route.fighter),
  )
  expect(fighters).toEqual(new Set(COMBAT_FIGHTERS))
})

describe.each([1, -1] as const)('roster whiff conversions facing %s', (facing) => {
  for (const route of COMBAT_ROUTES.filter(({ id }) => id.endsWith(':whiff-punish'))) {
    it(`${route.fighter} has two physical options without spending aura`, () => {
      const hit = opening(route.id, facing)
      const physical = rosterPhysicalBranch(route.fighter, 'whiff-punish')!.slot
      for (const slot of [physical, 'forwardHeavy'] as const) {
        expect(
          comboChoices(hit).find(({ move }) => move.id === `${route.fighter}:${slot}`),
        ).toMatchObject({
          opening: 'whiff-punish',
          cost: 0,
          status: 'ready',
        })
        for (const crouches of [true, false]) {
          const result = chain(hit, slot, { hits: 2, crouches })
          expect(result.player.aura).toBe(hit.player.aura)
          expect(result.impact?.blocked).toBe(false)
        }
      }
    })
  }

  for (const route of COMBAT_ROUTES.filter(({ id }) => id.endsWith(':whiff-variant'))) {
    it(`${route.fighter} confirms their technique against both guard postures`, () => {
      const hit = opening(route.id, facing)
      for (const crouches of [true, false]) {
        const result = route.moves
          .slice(1)
          .reduce(
            (state, slot, index) =>
              chain(state, slot, { hits: routeHitsBefore(route, index + 2), crouches }),
            hit,
          )
        expect(result.impact?.blocked).toBe(false)
      }
    })
  }
})

it('preserves aura, transformation, paper and weapon prerequisites', () => {
  const biscuit = opening('biscuit:whiff-punish', 1)
  const kalluto = opening('kalluto:whiff-punish', 1)
  const benjamin = opening('benjamin:whiff-punish', 1)
  const theta = opening('theta:whiff-punish', 1)
  expect(move(biscuit, 'finisher').player.attack).toBe(biscuit.player.attack)
  expect(move(kalluto, 'forwardSpecial').player.attack).toBe(kalluto.player.attack)
  const drained = { ...benjamin, player: { ...benjamin.player, aura: 0 } }
  const disarmed = { ...theta, player: { ...theta.player, weaponsConfiscated: true } }
  expect(move(drained, 'neutralSpecial').player.attack).toBe(drained.player.attack)
  expect(move(disarmed, 'downSpecial').player.attack).toBe(disarmed.player.attack)
})
