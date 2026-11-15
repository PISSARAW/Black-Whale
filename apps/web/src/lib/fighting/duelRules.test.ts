import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  performThrow,
  tickFight,
} from './engine'
import { EMPTY_INPUT, type FightState } from './types'
import { resolveFightImpacts } from './combatImpact'
import { attackData } from './frameData'
import { moveForSlot } from './movesets'

function close(): FightState {
  const state = beginFight(createFight('kurapika', 'hisoka'))
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, hitStun: 0 },
  }
}
function step(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++) state = tickFight(state, EMPTY_INPUT, 1 / 60)
  return state
}
function active(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    if (state[side].attack)
      state = {
        ...state,
        [side]: {
          ...state[side],
          attack: {
            ...state[side].attack!,
            frame: attackData(state[side].attack!.kind, state[side]).startup,
          },
        },
      }
  }
  return resolveFightImpacts(state, [])
}
describe('duel rules', () => {
  it('rejects Hatsu effects with no aura or while stunned', () => {
    const state = beginFight(createFight('tserriednich', 'hisoka'))
    state.player.aura = 0
    expect(performAttack(state, 'player', 'special').player.hatsuEffects.futureSight).toBe(0)
    state.player.aura = 100
    state.player.hitStun = 10
    expect(performAttack(state, 'player', 'special').player.hatsuEffects.futureSight).toBe(0)
  })
  it('trades simultaneous strikes, including a double KO', () => {
    let state = close()
    state.opponent = { ...state.opponent, id: 'kurapika' }
    state = active(performAttack(performAttack(state, 'player', 'light'), 'opponent', 'light'))
    expect(state.player.health).toBe(state.opponent.health)
    expect(state.player.health).toBeLessThan(100)
    state = close()
    state.player.health = state.opponent.health = 1
    const result = active(
      performAttack(performAttack(state, 'player', 'light'), 'opponent', 'light'),
    )
    expect(result.winner).toBe('draw')
  })
  it('keeps held guard during blockstun without restarting the parry', () => {
    const state = close()
    state.player = { ...state.player, blocking: true, blockStun: 5, guardFrames: 10 }
    const next = tickFight(state, { ...EMPTY_INPUT, guard: true }, 1 / 60)
    expect(next.player.blocking).toBe(true)
    expect(next.player.guardFrames).toBe(11)
  })
  it('allows only confirmed forward cancels and charges the special once', () => {
    let state = active(performAttack(close(), 'player', 'light'))
    expect(state.player.attack?.confirmedHit).toBe(true)
    state = performAttack(state, 'player', 'heavy')
    expect(state.player.attack?.kind).toBe('heavy')
    expect(performAttack(state, 'player', 'light').player.attack?.kind).toBe('heavy')
    state = active(state)
    state = performAttack(state, 'player', 'special')
    expect(state.player.attack?.kind).toBe('special')
    expect(state.player.attack?.moveId).toBe('kurapika:forwardSpecial')
    expect(state.player.aura).toBe(100 - moveForSlot('kurapika', 'forwardSpecial')!.auraCost)
  })
  it('connects the three-hit route before the defender recovers', () => {
    let state = close()
    for (const kind of ['light', 'heavy', 'special'] as const) {
      const sequence = state.impact?.sequence ?? 0
      state = performAttack(state, 'player', kind)
      expect(state.player.attack?.kind).toBe(kind)
      let elapsed = 0
      while ((state.impact?.sequence ?? 0) === sequence && elapsed++ < 60) {
        state = step(state, 1)
        if (kind !== 'light') expect(state.opponent.hitStun).toBeGreaterThan(0)
      }
      expect(state.impact?.kind).toBe(kind)
      expect(state.impact?.blocked).toBe(false)
    }
    expect(state.score.player).toBe(3)
  })
  it('triggers a buffered Hatsu exactly when the attack starts', () => {
    let state = beginFight(createFight('tserriednich', 'kurapika'))
    state.player.hitStun = 3
    state = performAttack(state, 'player', 'special')
    expect(state.player.hatsuEffects.futureSight).toBe(0)
    state = step(state, 3)
    expect(state.player.hatsuEffects.futureSight).toBe(1)
    expect(state.player.attack?.kind).toBe('special')
    expect(state.player.aura).toBeLessThan(16)
  })
  it('does not cancel on whiff or block', () => {
    const whiff = performAttack(close(), 'player', 'light')
    expect(performAttack(whiff, 'player', 'heavy').player.attack?.kind).toBe('light')
    whiff.opponent.blocking = true
    whiff.opponent.guardFrames = 20
    const blocked = active(whiff)
    expect(performAttack(blocked, 'player', 'heavy').player.attack?.kind).toBe('light')
  })
  it('requires crouch guard for lows and standing guard for aerials', () => {
    for (const variant of ['low', 'air'] as const) {
      for (const crouching of [false, true]) {
        let state = close()
        state.opponent = { ...state.opponent, blocking: true, guardFrames: 20, crouching }
        state = active(
          performAuraAttack({ state, side: 'player', kind: 'light', variant, auraCharged: false }),
        )
        expect(state.impact?.blocked).toBe(variant === 'low' ? crouching : !crouching)
      }
    }
  })
  it('throws through guard, but misses airborne and protected targets', () => {
    const state = close()
    state.opponent.blocking = true
    expect(active(performThrow(state, 'player')).impact?.blocked).toBe(false)
    state.opponent.y = 2
    expect(active(performThrow(state, 'player')).impact).toBeNull()
    state.opponent.y = 0
    state.opponent.hitStun = 5
    expect(active(performThrow(state, 'player')).impact).toBeNull()
  })
  it('techs a throw with the throw button during startup', () => {
    let state = performThrow(close(), 'opponent')
    state = performThrow(state, 'player')
    expect(active(state).impact).toBeNull()
  })
  it('executes buffered Hatsu only after recovery and rechecks aura', () => {
    let state = beginFight(createFight('tserriednich', 'kurapika'))
    state.player.hitStun = 3
    state = performAttack(state, 'player', 'special')
    expect(state.player.hatsuEffects.futureSight).toBe(0)
    state.player.aura = 0
    state = step(state, 4)
    expect(state.player.attack).toBeNull()
    expect(state.player.hatsuEffects.futureSight).toBe(0)
  })
})
