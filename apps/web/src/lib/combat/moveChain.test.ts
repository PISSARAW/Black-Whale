import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from './reducer'
import { comboCount } from './moveChain'
import type { CombatState } from './types'
import type { MoveSlot } from '../fighting/types'

const setup = {
  playerAt: [0, 0] as const,
  opponentAt: [1.5, 0] as const,
  terrain: initialCombatState().terrain,
}

/** Player in Ren against a head guard in Ten: Kurapika's head jab lands clean, not as a KO. */
function duel(): CombatState {
  const base = initialCombatState(setup)
  return {
    ...base,
    player: { ...base.player, mode: 'ren' },
    opponent: { ...base.opponent, guard: 'head' },
  }
}

function press(state: CombatState, slot: MoveSlot): CombatState {
  return combatReducer(state, {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId: 'kurapika',
    slot,
    targetAt: [3, 0],
  })
}

function tick(state: CombatState, seconds: number): CombatState {
  return combatReducer(state, { type: 'TICK', dt: seconds })
}

describe('Clash combat grammar in the 3D Arena', () => {
  it('applies authored hitstun and knockback, then opens the cancel window', () => {
    const landed = tick(press(duel(), 'standingLight'), 4 / 60)

    expect(landed.lastEvent?.impact).toBe('clean')
    expect(landed.opponent.condition).toBe('staggered')
    expect(landed.opponent.recovery).toBeCloseTo(14 / 60)
    expect(landed.opponent.position[0]).toBeGreaterThan(1.5)
    expect(landed.player.chain).toMatchObject({
      moveId: 'kurapika:standingLight',
      connected: 'hit',
    })
    expect(landed.player.cooldown).toBeGreaterThan(0)
  })

  it('cancels into an authored follow-up inside the window, and counts the combo', () => {
    const landed = tick(press(duel(), 'standingLight'), 4 / 60)
    const cancelled = press(landed, 'standingHeavy')

    expect(cancelled.player.buffered?.slot).toBe('standingHeavy')
    const resumed = tick(cancelled, cancelled.hitstop)
    expect(resumed.player.intent?.moveId).toBe('kurapika:standingHeavy')
    expect(resumed.player.cooldown).toBe(0)
    const second = tick(resumed, 8 / 60)
    expect(second.lastEvent?.attacker).toBe('player')
    expect(['clean', 'critical', 'knockdown', 'ko']).toContain(second.lastEvent?.impact)
    expect(comboCount(second.player, second.clock)).toBe(2)
  })

  it('refuses a move outside the cancel routes while recovering', () => {
    const landed = tick(press(duel(), 'standingLight'), 4 / 60)
    const refused = press(landed, 'neutralSpecial')

    expect(refused.player.intent).toBeNull()
  })

  it('closes the window once its authored frames have elapsed', () => {
    const landed = tick(press(duel(), 'standingLight'), 4 / 60)
    const late = press(tick(landed, landed.hitstop + 10 / 60), 'standingHeavy')

    expect(late.player.intent).toBeNull()
  })

  it('releases a startup buffer after the first contact hitstop', () => {
    const buffered = press(press(duel(), 'standingLight'), 'standingHeavy')
    expect(buffered.player.buffered?.slot).toBe('standingHeavy')

    const landed = tick(buffered, 4 / 60)
    expect(landed.player.buffered?.slot).toBe('standingHeavy')
    const resumed = tick(landed, landed.hitstop)
    expect(resumed.player.intent?.moveId).toBe('kurapika:standingHeavy')
    expect(resumed.player.intent?.combo).toEqual([
      'kurapika:standingLight',
      'kurapika:standingHeavy',
    ])
  })

  it('leaves no window after a whiff', () => {
    const far = {
      ...duel(),
      opponent: { ...duel().opponent, position: [6, 0] as [number, number] },
    }
    const missed = tick(press(far, 'standingLight'), 4 / 60)

    expect(missed.lastEvent?.impact).toBe('miss')
    expect(missed.player.chain).toBeNull()
  })

  it('keeps the finisher for a staggered opponent', () => {
    const refused = press(duel(), 'finisher')
    expect(refused.player.intent).toBeNull()
  })

  it('lets a throw ignore the active guard window', () => {
    const guarded = combatReducer(duel(), { type: 'GUARD', side: 'opponent' })
    const thrown = tick(press(guarded, 'throw'), 7 / 60)

    expect(thrown.lastEvent?.zone).not.toBe(guarded.opponent.guard)
    expect(thrown.lastEvent?.impact).not.toBe('miss')
  })
})
