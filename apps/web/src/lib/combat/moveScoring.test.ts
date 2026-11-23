import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from './reducer'
import type { CombatState } from './types'
import type { FighterId, MoveSlot } from '../fighting/types'

const terrain = initialCombatState().terrain

/** Player in Ren, almost all aura in attack: the aura contest alone would knock out. */
function duel(guard: CombatState['opponent']['guard'] = 'torso'): CombatState {
  const base = initialCombatState({ playerAt: [0, 0], opponentAt: [1.5, 0], terrain })
  return {
    ...base,
    player: { ...base.player, mode: 'ren', attackShare: 0.9 },
    opponent: { ...base.opponent, guard },
  }
}

function press(state: CombatState, slot: MoveSlot, fighterId: FighterId = 'kurapika'): CombatState {
  return combatReducer(state, {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId,
    slot,
    targetAt: [3, 0],
  })
}

const tick = (state: CombatState, seconds: number) =>
  combatReducer(state, { type: 'TICK', dt: seconds })

describe('Clash damage scoring in Arena', () => {
  it('caps a jab to an unguarded head at a clean hit instead of a knockout', () => {
    const landed = tick(press(duel(), 'standingLight'), 4 / 60)

    expect(landed.lastEvent?.impact).toBe('clean')
    expect(landed.opponent.condition).toBe('staggered')
    expect(landed.player.score).toBe(1)
    expect(landed.outcome).toBe('playing')
  })

  it('scores a combo once, at the value of its best hit', () => {
    let state = tick(press(duel(), 'standingLight'), 4 / 60)
    state = tick(press(state, 'standingHeavy'), state.hitstop + 8 / 60)
    expect(state.lastEvent?.impact).toBe('critical')
    expect(state.player.score).toBe(2)

    state = tick(press(state, 'forwardSpecial'), state.hitstop + 10 / 60)
    expect(state.lastEvent?.impact).toBe('knockdown')
    expect(state.player.score).toBe(3)
    expect(state.player.chain?.points).toBe(3)
  })

  it('scores nothing for a move without authored damage', () => {
    const bound = tick(press(duel(), 'neutralSpecial', 'theta'), 12 / 60)

    expect(bound.lastEvent?.attacker).toBe('player')
    expect(bound.player.score).toBe(0)
  })

  it('keeps the knockout for the finisher on a staggered body', () => {
    const contact = tick(press(duel('head'), 'standingLight'), 4 / 60)
    const opened = tick(contact, contact.hitstop + 0.19)
    expect(opened.opponent.condition).toBe('staggered')

    // The jab's knockback put the opponent out of the finisher's reach: step back in.
    const close = {
      ...opened,
      player: { ...opened.player, position: [0.3, 0] as [number, number] },
    }
    const finished = tick(press(close, 'finisher'), 23 / 60)
    expect(finished.lastEvent?.impact).toBe('ko')
    expect(finished.outcome).toBe('won')
  })
})
