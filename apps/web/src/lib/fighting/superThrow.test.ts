import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, performThrow, tickFight } from './engine'
import { resolveFightImpacts } from './combatImpact'
import { attackData } from './frameData'
import { applyAuraContext } from './nen'
import { confirmedThrow } from './throwCinematic'
import { SUPER_THROW_COST } from './superThrow'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'
import { packReplayInput } from './fightReplayInput'
import { applyReplayCommand } from './fightReplayCommands'
import { applyPvpCommand } from './pvp/commands'
import { fightReplayHash } from './fightReplayHash'
import { performTrainingAction } from './trainingAction'
import { toggleChrolloBookmark } from './chrolloBook'

const aura = { ...EMPTY_INPUT, aura: true }
function duel(id: FighterId = 'hisoka', side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? id : 'kurapika', side === 'opponent' ? id : 'kurapika', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}
function impact(state: FightState, side: FightSide = 'player') {
  const actor = state[side]
  if (!actor.attack) throw new Error('Expected committed throw')
  return resolveFightImpacts(
    {
      ...state,
      [side]: {
        ...actor,
        attack: { ...actor.attack, frame: attackData(actor.attack.kind, actor).startup },
      },
    },
    [],
  )
}

describe('Aura + throw commits a distinct super grab', () => {
  it.each(FIGHTING_ROSTER.map((f) => f.id))('%s pays once for the stronger second throw', (id) => {
    const setup = duel(id)
    const book = setup.player.chrolloBook
    // A book in hand intentionally blocks throws. Free both hands for this roster check.
    const before = book?.open
      ? { ...setup, player: { ...setup.player, chrolloBook: toggleChrolloBookmark(book) } }
      : setup
    const plain = performThrow(before, 'player')
    const powered = performThrow(before, 'player', aura)
    expect(plain.player.aura).toBe(100)
    expect(plain.player.attack?.superThrow).toBeUndefined()
    expect(powered.player.aura).toBe(100 - SUPER_THROW_COST)
    expect(powered.player.attack).toMatchObject({
      variant: 'throw',
      superThrow: true,
      auraCharged: false,
    })
    expect(attackData('heavy', powered.player).damage).toBe(
      attackData('heavy', plain.player).damage * 1.5,
    )
    expect(attackData('heavy', powered.player).recovery).toBeGreaterThan(
      attackData('heavy', plain.player).recovery,
    )
    const normalHit = impact(plain),
      superHit = impact(powered)
    expect(superHit.impact!.damage).toBeGreaterThan(normalHit.impact!.damage)
    expect(confirmedThrow(superHit)?.powered).toBe(true)
    expect(applyAuraContext(powered.player, EMPTY_INPUT).aura).toBe(powered.player.aura)
  })

  it.each(['player', 'opponent'] as const)(
    'uses the same Aura choice for %s, replay and online commands',
    (side) => {
      const state = duel('benjamin', side)
      const input = packReplayInput(aura)
      const training = performTrainingAction({ state, side, action: 'throw', input: aura })
      const replay = applyReplayCommand(state, { kind: 'move', side, action: 'throw', input })
      const online = applyPvpCommand(state, side, { kind: 'move', action: 'throw', input })
      expect(training[side].attack?.superThrow).toBe(true)
      expect(fightReplayHash(replay)).toBe(fightReplayHash(training))
      expect(fightReplayHash(online)).toBe(fightReplayHash(training))
      expect(
        performMove({ state, side, action: 'throw', input: aura })[side].attack?.superThrow,
      ).toBe(true)
    },
  )

  it('refuses insufficient or unavailable Nen without silently spending on a normal throw', () => {
    const state = duel()
    for (const change of [
      { aura: 24 },
      { nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { moonlightZetsu: true },
      { auraExhausted: true },
    ]) {
      const blocked = { ...state, player: { ...state.player, ...change } }
      expect(performThrow(blocked, 'player', aura)).toBe(blocked)
      const plain = performThrow(blocked, 'player')
      expect(plain.player.attack?.variant).toBe('throw')
      expect(plain.player.aura).toBe(blocked.player.aura)
    }
    const exact = { ...state, player: { ...state.player, aura: SUPER_THROW_COST } }
    expect(performThrow(exact, 'player', aura).player.aura).toBe(0)
  })

  it('pays for misses and remains throwable out of, without a success film', () => {
    const state = duel()
    const miss = { ...state, opponent: { ...state.opponent, x: 85 } }
    const missed = impact(performThrow(miss, 'player', aura))
    expect(missed.player.aura).toBe(75)
    expect(confirmedThrow(missed)).toBeNull()
    const guarded = { ...state, opponent: { ...state.opponent, throwTechFrames: 8 } }
    const teched = impact(performThrow(guarded, 'player', aura))
    expect(teched.throwTech).toBeDefined()
    expect(teched.player.aura).toBe(75)
    expect(teched.opponent.health).toBe(state.opponent.health)
    expect(confirmedThrow(teched)).toBeNull()
  })

  it('buffers the powered intent without paying until it really starts', () => {
    const state = duel()
    const stunned = { ...state, player: { ...state.player, hitStun: 2, pose: 'hit' as const } }
    let queued = performThrow(stunned, 'player', aura)
    expect(queued.player.bufferedAttack?.superThrow).toBe(true)
    expect(queued.player.aura).toBe(100)
    for (let i = 0; i < 4 && !queued.player.attack; i++)
      queued = tickFight(queued, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    expect(queued.player.attack?.superThrow).toBe(true)
    expect(queued.player.aura).toBeLessThan(76)
    expect(queued.player.aura).toBeGreaterThanOrEqual(75)
  })
})
