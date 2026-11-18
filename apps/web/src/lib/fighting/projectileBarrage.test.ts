import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { performFranklinAim } from './franklinAim'
import { FIGHTING_ROSTER } from './roster'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function barrage(id: FighterId, mirrored: boolean, sweep: boolean, long = false): FightState {
  const base = beginFight(createFight('franklin', id, { mode: 'versus-ai', formatId: 'knockout' }))
  let state: FightState = {
    ...base,
    player: { ...base.player, x: mirrored ? 90 : 10, facing: mirrored ? -1 : 1, aura: 100 },
    opponent: { ...base.opponent, x: mirrored ? 10 : 90, facing: mirrored ? 1 : -1 },
  }
  if (sweep)
    state = performFranklinAim({
      state,
      side: 'player',
      command: { action: 'franklin-aim', target: 'sweep' },
    })
  state = performMove({ state, side: 'player', action: long ? 'finisher' : 'special' })
  expect(state.player.attack?.moveId).toBe(long ? 'franklin:finisher' : 'franklin:neutralSpecial')
  return state
}

function follow(state: FightState, hz = 60, mode: 'defend' | 'full-ai' | 'unprotected' = 'defend') {
  const initial = state
  const impacts = new Map<number, NonNullable<FightState['impact']>>()
  let maxGuardFrames = 0
  let maxHeight = 0
  let shortestGuardAfterContact = Infinity
  for (let tick = 0; tick < hz * 3; tick++) {
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / hz,
      ai: mode === 'full-ai',
      opponentInput: mode === 'unprotected' ? EMPTY_INPUT : undefined,
      onFrame: (_before, next) => {
        if (next.impact?.attacker === 'player' && next.impact.projectileId)
          impacts.set(next.impact.sequence, next.impact)
        maxGuardFrames = Math.max(maxGuardFrames, next.opponent.guardFrames)
        maxHeight = Math.max(maxHeight, next.opponent.y)
        if (impacts.size && next.opponent.blocking)
          shortestGuardAfterContact = Math.min(shortestGuardAfterContact, next.opponent.guardFrames)
      },
    })
  }
  return {
    state,
    initial,
    impacts: [...impacts.values()],
    maxGuardFrames,
    maxHeight,
    shortestGuardAfterContact,
  }
}

describe.each(FIGHTING_ROSTER.map(({ id }) => id))('%s against actual Double Machine Gun', (id) => {
  it.each([false, true])('ducks a complete twenty-shot high burst, mirrored=%s', (mirrored) => {
    const result = follow(barrage(id, mirrored, false))
    expect(result.state.nextProjectileId).toBe(21)
    expect(result.state.opponent.health).toBe(result.initial.opponent.health)
    expect(result.impacts).toHaveLength(0)
    expect(result.state.opponent.wakeupInvulnerableFrames).toBe(0)
  })
  it.each([false, true])(
    'guards a complete mixed-height twenty-shot burst, mirrored=%s',
    (mirrored) => {
      const result = follow(barrage(id, mirrored, true))
      expect(result.state.nextProjectileId).toBe(21)
      expect(result.impacts.length).toBeGreaterThan(0)
      expect(result.impacts.every((impact) => impact.blocked)).toBe(true)
      expect(result.impacts.every((impact) => !impact.parried)).toBe(true)
      expect(result.maxGuardFrames).toBeGreaterThan(20)
      expect(result.shortestGuardAfterContact).toBeGreaterThan(6)
      expect(result.state.opponent.health).toBeGreaterThanOrEqual(
        result.initial.opponent.health - 20,
      )
      expect(result.state.opponent.wakeupInvulnerableFrames).toBe(0)
    },
  )
})

describe('burst response with full AI and replay', () => {
  it.each([false, true])(
    'guards Benjamin’s real three-round physical burst, mirrored=%s',
    (mirrored) => {
      const base = beginFight(
        createFight('benjamin', 'kurapika', { mode: 'versus-ai', formatId: 'knockout' }),
      )
      const state: FightState = {
        ...base,
        player: { ...base.player, x: mirrored ? 90 : 10, facing: mirrored ? -1 : 1 },
        opponent: { ...base.opponent, x: mirrored ? 10 : 90, facing: mirrored ? 1 : -1 },
      }
      const result = follow(performAttack(state, 'player', 'ranged'))
      expect(result.state.nextProjectileId).toBe(4)
      expect(result.impacts).toHaveLength(3)
      expect(result.impacts.every((impact) => impact.blocked)).toBe(true)
      expect(result.state.opponent.health).toBeGreaterThanOrEqual(base.opponent.health - 3)
    },
  )
  it('physically jumps an ordinary mid-height card using the real takeoff and gravity', () => {
    const base = beginFight(
      createFight('hisoka', 'hisoka', { mode: 'versus-ai', formatId: 'knockout' }),
    )
    const state = {
      ...base,
      player: { ...base.player, x: 10 },
      opponent: { ...base.opponent, x: 70 },
    }
    const result = follow(performAttack(state, 'player', 'ranged'))
    expect(result.maxHeight).toBeGreaterThan(5)
    expect(result.state.opponent.health).toBe(base.opponent.health)
    expect(result.state.opponent.wakeupInvulnerableFrames).toBe(0)
  })
  it.each([120, 60, 30, 20])(
    'survives the real forty-shot finisher with active AI at %i Hz',
    (hz) => {
      const initial = barrage('kurapika', false, true, true)
      const result = follow(initial, hz, 'full-ai')
      const unprotected = follow(initial, hz, 'unprotected')
      expect(result.state.nextProjectileId).toBe(41)
      expect(result.impacts.every((impact) => impact.blocked)).toBe(true)
      expect(result.state.opponent.health).toBeGreaterThan(unprotected.state.opponent.health)
      expect(result.maxGuardFrames).toBeGreaterThan(40)
    },
  )
  it('records and replays the actual AI defence, including a snapshot saved midway through a volley', () => {
    const initial = barrage('kurapika', false, true)
    let state = initial
    const recorder = createReplayRecorder(state)!
    const packet: ReplayPacket = [1 / 60, 0, 0, []]
    for (let i = 0; i < 80; i++) {
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    const decoded = decodeFightReplay(JSON.stringify(recorder.snapshot()))
    const result = createReplayPlayer(decoded)
    result.advance(3)
    expect(result.error).toBe('')
    expect(fightReplayHash(result.state)).toBe(fightReplayHash(state))
    const resumed = createReplayRecorder(state)!
    const next = executeReplayPacket(state, packet)
    resumed.append(state, packet, next)
    const continuation = createReplayPlayer(decodeFightReplay(JSON.stringify(resumed.snapshot())))
    continuation.advance(1)
    expect(continuation.error).toBe('')
  })
})
