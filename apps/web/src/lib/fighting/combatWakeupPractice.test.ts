import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createCombatSchool, advanceCombatSchool } from './combatSchool'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { DEFAULT_WAKEUP, type WakeupSettings } from './combatWakeupPractice'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { selectedGumLink } from './bungeeNetwork'
import { WAKEUP_LESSONS } from './wakeupLessons'
import { COMBAT_FIGHTERS } from './combatRoutes'
import { canStartFighterAttack } from './fighterAttacks'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { packReplayInput } from './fightReplayInput'
import { moveForSlot } from './movesets'
import { EMPTY_INPUT } from './types'
import type { MoveSlot } from './types'

function run(
  id: string,
  settings: Partial<WakeupSettings>,
  options: { stopAtCombo?: boolean; record?: boolean } = {},
) {
  const school = createCombatSchool()
  const match = createFightMatchRuntime(undefined, { record: options.record ?? false })
  match.observeFrames(school.observe)
  let state = school.start(id, true, { ...DEFAULT_WAKEUP, ...settings })
  match.begin(state)
  const times = [0.012, 0.031, 0.05, 0.007, 1 / 60]
  for (let frame = 0; frame < 400; frame++) {
    state = advanceCombatSchool({
      school,
      match,
      state,
      dt: times[frame % times.length],
      input: EMPTY_INPUT,
      opponentInput: EMPTY_INPUT,
    })
    const current = get(school)
    if (current?.wakeup?.result || (options.stopAtCombo && current?.complete)) break
  }
  const progress = get(school)!
  expect(progress).toMatchObject({ complete: true, failed: false })
  return { state, match, wakeup: progress.wakeup! }
}

describe.each(['centre', 'corner'] as const)('wakeup reactions at %s', (position) => {
  for (const { id } of WAKEUP_LESSONS) {
    it(`${id} distinguishes strike, throw, waiting and throw tech`, () => {
      expect(run(id, { position, reaction: 'guard' }).wakeup.result).toBe('blocked')
      expect(run(id, { position, reaction: 'wait' }).wakeup.result).toBe('hit')
      expect(run(id, { position, reaction: 'guard', followup: 'throw' }).wakeup.result).toBe('hit')
      const tech = run(id, { position, reaction: 'tech', followup: 'throw' })
      if (tech.wakeup.knockdown) {
        expect(tech.wakeup.result).toBe('tech')
        expect(tech.state.throwTech?.sequence).toBe(1)
      } else {
        expect(['tech', 'defender-hit']).toContain(tech.wakeup.result)
      }
    })
  }

  it('baits an actual delayed throw and punishes its recovery', () => {
    const { state, wakeup } = run('hisoka:wakeup-sweep', {
      position,
      reaction: 'tech',
      followup: 'bait',
    })
    expect(wakeup.result).toBe('punish')
    expect(state.impact).toMatchObject({ attacker: 'player', punish: true, comboHits: 1 })
  })

  it('uses enough space to evade Machi’s longer throw', () => {
    const { state, wakeup } = run('chrollo:wakeup-sweep', {
      position,
      reaction: 'tech',
      followup: 'bait',
    })
    expect(wakeup.result).toBe('punish')
    expect(state.impact).toMatchObject({ attacker: 'player', punish: true, comboHits: 1 })
  })

  it('lets a prepared attacker block the first-frame jab', () => {
    const { state, wakeup } = run('hisoka:wakeup-sweep', {
      position,
      reaction: 'jab',
      followup: 'bait',
    })
    expect(wakeup.result).toBe('defender-blocked')
    expect(state.impact).toMatchObject({ attacker: 'opponent', blocked: true })
  })
})

it('covers every combatant in both roles with three choices from the same opener', () => {
  expect(WAKEUP_LESSONS).toHaveLength(COMBAT_FIGHTERS.length * 3)
  expect(new Set(WAKEUP_LESSONS.map(({ wakeup }) => wakeup))).toEqual(new Set(COMBAT_FIGHTERS))
  for (const fighter of COMBAT_FIGHTERS) {
    const routes = WAKEUP_LESSONS.filter((route) => route.fighter === fighter)
    expect(routes).toHaveLength(3)
    expect(new Set(routes.map((route) => route.moves.slice(0, 2).join()))).toHaveLength(1)
    expect(new Set(routes.map((route) => route.moves.at(-1)))).toHaveLength(3)
  }
})

it('gives every fighter more corner carry from the same grounded opening', () => {
  for (const fighter of COMBAT_FIGHTERS) {
    const sweep = run(`${fighter}:wakeup-sweep`, {}, { stopAtCombo: true })
    const carry = run(`${fighter}:wakeup-carry`, {}, { stopAtCombo: true })
    expect(sweep.wakeup.knockdown).toBe(true)
    expect(carry.wakeup.knockdown).toBe(true)
    expect(carry.wakeup.gap - sweep.wakeup.gap, fighter).toBeGreaterThan(3)
  }
})

it('preserves the sweep, the carry and the cost of each native technique', () => {
  for (const [fighter, cost] of [
    ['kurapika', 24],
    ['hisoka', 40],
    ['franklin', 24],
    ['benjamin', 40],
  ] as const) {
    const sweep = run(`${fighter}:wakeup-sweep`, {}, { stopAtCombo: true })
    const carry = run(`${fighter}:wakeup-carry`, {}, { stopAtCombo: true })
    const technique = run(`${fighter}:wakeup-technique`, {}, { stopAtCombo: true })
    expect(sweep.wakeup.knockdown).toBe(true)
    expect(carry.wakeup.gap - sweep.wakeup.gap).toBeGreaterThan(3)
    expect(carry.state.player.aura).toBe(100)
    expect(Math.abs(technique.state.player.aura - (100 - cost))).toBeLessThan(1)
    expect(technique.wakeup.knockdown).toBe(fighter !== 'franklin')
    if (fighter === 'hisoka') expect(selectedGumLink(technique.state, 'player')).toBeDefined()
  }
})

it('gives Benjamin the first hit at the corner after Franklin’s standing barrage', () => {
  const settings = { position: 'corner', reaction: 'jab' } as const
  const { state, wakeup } = run('franklin:wakeup-technique', settings)
  expect(wakeup.knockdown).toBe(false)
  expect(wakeup.result).toBe('defender-hit')
  expect(state.impact).toMatchObject({ attacker: 'opponent', comboHits: 1 })
})

it('lets the player perform the combo and choose a throw in practice mode', () => {
  const route = WAKEUP_LESSONS.find(({ id }) => id === 'kurapika:wakeup-sweep')!
  const school = createCombatSchool()
  const match = createFightMatchRuntime(undefined, { record: false })
  match.observeFrames(school.observe)
  let state = school.start(route.id, false, {
    ...DEFAULT_WAKEUP,
    position: 'corner',
    reaction: 'tech',
  })
  match.begin(state)
  let sent = -1
  for (let i = 0; i < 250 && !get(school)?.wakeup?.result; i++) {
    const step = get(school)!.step
    const slot: MoveSlot = route.moves[step] ?? 'throw'
    const move = moveForSlot(route.fighter, slot)!
    const canLand =
      slot !== 'throw' ||
      (!state.opponent.knockdownFrames &&
        state.opponent.wakeupInvulnerableFrames <= move.tuning.startup)
    if (
      sent !== step &&
      canLand &&
      !state.hitstop &&
      canStartFighterAttack(state.player, move.kind, move.id)
    ) {
      match.enqueue(state, {
        kind: 'move',
        side: 'player',
        action: combatRouteAction(slot),
        input: packReplayInput(combatRouteInput(slot, state.player.facing)),
      })
      sent = step
    }
    state = advanceCombatSchool({
      school,
      match,
      state,
      input: EMPTY_INPUT,
      opponentInput: EMPTY_INPUT,
      dt: 1 / 60,
    })
  }
  expect(get(school)?.wakeup?.result).toBe('tech')
  expect(state.throwTech?.sequence).toBe(1)
})

it('records the approach, delayed throw and punishment as a reproducible replay', async () => {
  const { state, match } = run(
    'kurapika:wakeup-sweep',
    { position: 'corner', reaction: 'tech', followup: 'bait' },
    { record: true },
  )
  const entry = await match.replays.save()
  const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(entry!.replay)))
  while (!replay.done) replay.advance(0.1, 2)
  expect(replay.error).toBe('')
  expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
})
