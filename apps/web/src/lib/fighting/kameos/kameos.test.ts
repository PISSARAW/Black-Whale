import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, tickFight } from '../engine'
import { fightReplayHash } from '../fightReplayHash'
import { fightFormat } from '../formats'
import { EMPTY_INPUT } from '../types'
import type { FightState } from '../types'
import { kameoOnStage, kameoSlot, withKameos } from './state'
import type { KameoSlot } from './types'

function play(state: FightState, frames: number): FightState {
  let next = beginFight(state)
  for (let frame = 0; frame < frames; frame++) {
    if (frame % 30 === 0) next = performAttack(next, 'player', 'light')
    next = tickFight(next, { ...EMPTY_INPUT, right: frame % 90 < 40 }, { dt: 1 / 60, ai: true })
  }
  return next
}

function withoutKameos(state: FightState): FightState {
  const { kameos: _kameos, ...duel } = state
  return duel
}

describe('kameo state (lot 2)', () => {
  it('attaches a full reserve body to each requested side', () => {
    const state = withKameos(createFight('kurapika', 'hisoka'), {
      player: 'illumi',
      opponent: 'kurapika',
    })
    const player = kameoSlot(state, 'player') as KameoSlot
    const opponent = kameoSlot(state, 'opponent') as KameoSlot
    expect(player.fighter.id).toBe('illumi')
    expect(player.phase).toBe('reserve')
    expect(player.fighter.health).toBe(fightFormat(state.formatId).health)
    expect(player.fighter.facing).toBe(1)
    expect(opponent.fighter.facing).toBe(-1)
    expect(opponent.fighter.kurapika).toBeDefined()
    expect(player.fighter.equipment).toEqual(createFight('illumi', 'hisoka').player.equipment)
    expect(player.fighter.equipment).toContain('needles')
    expect(kameoOnStage(player)).toBe(false)
  })

  it('leaves an ordinary duel untouched', () => {
    const state = createFight('kurapika', 'hisoka')
    expect(withKameos(state, {})).toBe(state)
    expect(state).not.toHaveProperty('kameos')
  })

  it('refuses a kameo identical to its own leader, or added after the start', () => {
    const state = createFight('kurapika', 'hisoka')
    expect(() => withKameos(state, { player: 'kurapika' })).toThrow('kameo-is-leader')
    expect(() => withKameos(beginFight(state), { player: 'illumi' })).toThrow(
      'kameo-after-start',
    )
  })

  it('keeps reserve kameos inert: the duel plays exactly as without them', () => {
    const duel = play(createFight('benjamin', 'morena'), 300)
    const kameos = withKameos(createFight('benjamin', 'morena'), {
      player: 'hisoka',
      opponent: 'chrollo',
    })
    const withPartners = play(kameos, 300)
    expect(fightReplayHash(withoutKameos(withPartners))).toBe(fightReplayHash(duel))
    expect(withPartners.kameos).toEqual(kameos.kameos)
  })

  it('includes kameos in the state fingerprint', () => {
    const state = createFight('benjamin', 'morena')
    const partnered = withKameos(state, { player: 'hisoka' })
    expect(fightReplayHash(partnered)).not.toBe(fightReplayHash(state))
    expect(fightReplayHash(withKameos(state, { player: 'chrollo' }))).not.toBe(
      fightReplayHash(partnered),
    )
  })

  it('returns living kameos to reserve with a fresh body at the next round', () => {
    const start = withKameos(createFight('benjamin', 'morena'), {
      player: 'kurapika',
      opponent: 'hisoka',
    })
    const player = kameoSlot(start, 'player') as KameoSlot
    const finished: FightState = {
      ...start,
      phase: 'finished',
      winner: 'player',
      kameos: {
        player: {
          ...player,
          phase: 'acting',
          cooldownFrames: 300,
          phaseFrames: 12,
          fighter: {
            ...player.fighter,
            health: 10,
            x: 60,
            kurapika: { ...player.fighter.kurapika!, lifespanFrames: 240 },
          },
        },
        opponent: { ...(kameoSlot(start, 'opponent') as KameoSlot), phase: 'eliminated' },
      },
    }
    const next = nextRound(finished)
    const reborn = kameoSlot(next, 'player') as KameoSlot
    expect(reborn.phase).toBe('reserve')
    expect(reborn.cooldownFrames).toBe(0)
    expect(reborn.fighter.health).toBe(fightFormat(next.formatId).health)
    expect(reborn.fighter.x).toBe(22)
    expect(reborn.fighter.kurapika?.lifespanFrames).toBe(240)
    expect(kameoSlot(next, 'opponent')).toBe(finished.kameos?.opponent)
  })

  it('adds no kameos key to an ordinary round transition', () => {
    const state = createFight('benjamin', 'morena')
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next).not.toHaveProperty('kameos')
  })
})
