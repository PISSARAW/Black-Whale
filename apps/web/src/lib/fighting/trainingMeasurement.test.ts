import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, performAuraAttack, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { EMPTY_INPUT, type FightState, type FightImpact } from './types'
import { attackData } from './frameData'
import { setTrainingDummy } from './trainingSession'
import { measureTrainingRecovery } from './trainingMeasurement'

function lab(): FightState {
  let state = beginFight(
    createFight('hisoka', 'phinks', { mode: 'training', formatId: 'knockout' }),
  )
  state = { ...state, player: { ...state.player, x: 40 }, opponent: { ...state.opponent, x: 48 } }
  return state
}
function frame(state: FightState): FightState {
  return tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
}
function untilComplete(state: FightState): FightState {
  for (let i = 0; i < 240; i++) {
    state = frame(state)
    if (state.training!.measurement?.status === 'complete') return state
  }
  throw new Error('No completed frame measurement: ' + JSON.stringify(state.training!.measurement))
}
function contact(): FightImpact {
  return {
    sequence: 1,
    attacker: 'player',
    kind: 'light',
    damage: 8,
    blocked: true,
    parried: false,
    critical: false,
    knockdown: false,
    counterHit: false,
    punish: false,
    antiAir: false,
    wallSplat: false,
    invulnerable: false,
    comboHits: 1,
    damageScale: 1,
    points: 0,
    zone: 'torso',
    concealed: false,
    avoided: false,
    projectileId: null,
    position: { x: 45, y: 6 },
  }
}
function blockedContact(late: boolean): FightState {
  let state = setTrainingDummy(lab(), { behavior: 'guard' })
  state = { ...state, opponent: { ...state.opponent, blocking: true, guardFrames: 60 } }
  state = performMove({ state, side: 'player', action: 'light' })
  const data = attackData('light', state.player)
  state = {
    ...state,
    player: {
      ...state.player,
      attack: { ...state.player.attack!, frame: data.startup + (late ? data.active - 1 : 0) - 1 },
    },
  }
  return untilComplete(state)
}

describe('actual contact recovery measurement', () => {
  it('measures a real travelling projectile after its owner has recovered', () => {
    let state = beginFight(createFight('theta', 'phinks', { mode: 'training' }))
    state = { ...state, player: { ...state.player, x: 20 }, opponent: { ...state.opponent, x: 75 } }
    state = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })
    let contactFrame = -1
    for (let i = 0; i < 240 && state.training!.measurement?.status !== 'complete'; i++) {
      state = frame(state)
      if (state.impact?.projectileId && contactFrame === -1) {
        contactFrame = state.frame
        expect(state.player.attack).toBeNull()
      }
    }
    expect(contactFrame).toBeGreaterThan(0)
    const result = state.training!.measurement!
    expect(result.status).toBe('complete')
    expect(result.advantage).toBeGreaterThan(0)
    expect(result.advantage).toBe(result.ready.opponent! - result.ready.player!)
  })

  it('includes remaining active frames and measures a later contact differently', () => {
    const early = blockedContact(false)
    const late = blockedContact(true)
    const earlySample = early.training!.measurement!
    const lateSample = late.training!.measurement!
    const data = attackData('light', {
      ...early.player,
      attack: { kind: 'light', moveId: 'hisoka:standingLight' } as NonNullable<
        FightState['player']['attack']
      >,
    })
    expect(earlySample.blocked).toBe(true)
    expect(earlySample.status).toBe('complete')
    expect(lateSample.advantage! - earlySample.advantage!).toBe(data.active - 1)
    expect(earlySample.advantage).not.toBe(data.blockstun - data.recovery)
  })
  it('agrees with first accepted attacks for both players after a real hit', () => {
    let state = performMove({ state: lab(), side: 'player', action: 'light' })
    let contactSeen = false
    const ready: Partial<Record<'player' | 'opponent', number>> = {}
    for (let i = 0; i < 160; i++) {
      state = frame(state)
      if (state.impact) contactSeen = true
      if (!contactSeen || state.hitstop > 0) continue
      for (const side of ['player', 'opponent'] as const) {
        if (ready[side] !== undefined || state[side].attack) continue
        const attempted = performMove({
          state: { ...state, training: undefined },
          side,
          action: 'light',
        })
        if (attempted[side].attack) ready[side] = state.frame
      }
      if (ready.player !== undefined && ready.opponent !== undefined) break
    }
    expect(ready.player).toBeDefined()
    expect(ready.opponent).toBeDefined()
    expect(state.training!.measurement!.ready).toEqual(ready)
    expect(state.training!.measurement!.advantage).toBe(ready.opponent! - ready.player!)
    expect(state.training!.measurement!.blocked).toBe(false)
  })
  it.each([0, 4, 15])(
    'excludes %i shared hitstop frames for a recovered projectile owner',
    (hitstop) => {
      const before = lab()
      let state = measureTrainingRecovery(before, {
        ...before,
        impact: { ...contact(), projectileId: 7 },
        hitstop,
        opponent: { ...before.opponent, blockStun: 5, blocking: true, guardFrames: 20 },
      })
      state = untilComplete(state)
      expect(state.training!.measurement!.advantage).toBe(5)
    },
  )
  it('measures the attacking side explicitly when P2 lands the hit', () => {
    const before = lab()
    let state = measureTrainingRecovery(before, {
      ...before,
      impact: { ...contact(), attacker: 'opponent' },
      player: { ...before.player, blockStun: 7 },
    })
    state = untilComplete(state)
    expect(state.training!.measurement).toMatchObject({ attacker: 'opponent', advantage: 7 })
  })
  it('waits through knockdown until actual wakeup, retaining invulnerability', () => {
    const before = lab()
    let state = measureTrainingRecovery(before, {
      ...before,
      impact: { ...contact(), knockdown: true, blocked: false },
      opponent: { ...before.opponent, knockdownFrames: 18 },
    })
    state = untilComplete(state)
    expect(state.training!.measurement!.advantage).toBe(18)
    expect(state.opponent.wakeupInvulnerableFrames).toBeGreaterThan(0)
  })
  it('restarts on a subsequent contact and ignores avoided impacts', () => {
    const before = lab()
    const first = measureTrainingRecovery(before, {
      ...before,
      impact: contact(),
      opponent: { ...before.opponent, blockStun: 15 },
    })
    const second = measureTrainingRecovery(first, {
      ...first,
      frame: 3,
      impact: { ...contact(), sequence: 2 },
    })
    expect(second.training!.measurement).toMatchObject({ sequence: 2, contactFrame: 3 })
    const avoided = measureTrainingRecovery(second, {
      ...second,
      impact: { ...contact(), sequence: 3, avoided: true },
    })
    expect(avoided.training!.measurement?.sequence).not.toBe(3)
  })
  it('does not fabricate a number while an imposed condition prevents recovery', () => {
    const before = lab()
    let state = measureTrainingRecovery(before, {
      ...before,
      impact: contact(),
      opponent: { ...before.opponent, chainJail: { owner: 'player', x: 48, y: 0 } },
    })
    state = measureTrainingRecovery(state, { ...state, frame: 601 })
    expect(state.training!.measurement).toMatchObject({ status: 'interrupted' })
    expect(state.training!.measurement!.advantage).toBeUndefined()
  })
  it('does not record speculative future frames', () => {
    const before = lab()
    const forecast = { ...before, forecastSimulation: true, impact: contact() }
    expect(measureTrainingRecovery(before, forecast)).toBe(forecast)
    expect(forecast.training!.history).toEqual([])
  })
})
