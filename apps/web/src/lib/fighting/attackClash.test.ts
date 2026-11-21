import { describe, expect, it } from 'vitest'
import { resolveMeleePair } from './combatImpact'
import { performAttack } from './engine'
import { attackData } from './frameData'
import { createFightState } from './fightState'
import { nenOutputCapacity } from './nenBudget'
import type { FighterId, FightSide, FightState } from './types'

function activeStrike(state: FightState, side: FightSide, ko: boolean): FightState {
  const started = performAttack(state, side, 'light')
  const fighter = started[side]
  const zone = attackData('light', fighter).auraZone
  return {
    ...started,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, frame: attackData('light', fighter).startup },
      nen: ko ? { ...fighter.nen, ko: zone, ryu: { [zone]: 1 } } : fighter.nen,
    },
  }
}

function meeting(player: FighterId = 'phinks', opponent: FighterId = 'theta', ko = true) {
  let state = createFightState(player, opponent)
  state = {
    ...state,
    phase: 'fighting',
    player: { ...state.player, x: 46, facing: 1 },
    opponent: { ...state.opponent, x: 60, facing: -1 },
  }
  state = activeStrike(state, 'player', ko)
  return activeStrike(state, 'opponent', ko)
}

describe('same-frame Ko attack clashes', () => {
  it('cancels both Ko at hitbox contact before either body takes damage', () => {
    const state = meeting()
    const resolved = resolveMeleePair(state)

    expect(resolved.player.health).toBe(state.player.health)
    expect(resolved.opponent.health).toBe(state.opponent.health)
    expect(resolved.impact).toBeNull()
    expect(resolved.player.attack).toBeNull()
    expect(resolved.opponent.attack).toBeNull()
    expect(resolved.player.nen.ko).toBeNull()
    expect(resolved.opponent.nen.ko).toBeNull()
    expect(resolved.attackClash).toMatchObject({ frame: state.frame, sequence: 1 })
    expect(resolved.hitstop).toBe(8)
  })

  it('lets the greater Ren output hold position and pushes the other fighter away', () => {
    const state = meeting()
    expect(nenOutputCapacity(state.player)).toBeGreaterThan(nenOutputCapacity(state.opponent))

    const resolved = resolveMeleePair(state)
    expect(resolved.attackClash).toMatchObject({
      winner: 'player',
      playerRen: nenOutputCapacity(state.player),
      opponentRen: nenOutputCapacity(state.opponent),
    })
    expect(resolved.player.x).toBe(state.player.x)
    expect(resolved.opponent.x).toBe(state.opponent.x + 4)
  })

  it('cancels evenly matched Ko without inventing a winner or displacement', () => {
    const state = meeting('phinks', 'phinks')
    const resolved = resolveMeleePair(state)

    expect(resolved.attackClash?.winner).toBeNull()
    expect(resolved.player.x).toBe(state.player.x)
    expect(resolved.opponent.x).toBe(state.opponent.x)
  })

  it('keeps ordinary simultaneous strikes on the existing trade path', () => {
    const state = meeting('phinks', 'theta', false)
    const resolved = resolveMeleePair(state)

    expect(resolved.attackClash).toBeUndefined()
    expect(resolved.player.attack).not.toBeNull()
    expect(resolved.opponent.attack).not.toBeNull()
  })
})
