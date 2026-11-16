import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { resolveFightImpacts } from './combatImpact'
import { attackData, FIXED_STEP } from './frameData'
import { hatsuAvoidsImpact, triggerHatsu } from './hatsu'
import { advanceLsdf, canActivateLsdf } from './lsdf'
import { lsdfFighterVisible } from './lsdfPresentation'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { FightFormatId } from './formats'

function scenario(owner: FightSide = 'player', formatId: FightFormatId = 'knockout'): FightState {
  const state = beginFight(
    createFight(
      owner === 'player' ? 'yokotani' : 'hisoka',
      owner === 'opponent' ? 'yokotani' : 'hisoka',
      {
        formatId,
        mode: 'versus-local',
        environment: {
          stageId: 'heilly-hideout',
          morenaPresent: true,
          unlawfulIntruders: { player: owner !== 'player', opponent: owner !== 'opponent' },
        },
      },
    ),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100 },
    opponent: { ...state.opponent, aura: 100 },
  }
}

function frames(state: FightState, count: number): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  return state
}

const summon = (state: FightState, side: FightSide = 'player') =>
  performMove({ state, side, action: 'special' })

describe('LSDF jurisdiction and nonviolent expulsion (chapter 399)', () => {
  it.each(['wrong-stage', 'morena-absent', 'lawful-visitor', 'zetsu', 'stolen', 'low-aura'])(
    'refuses activation without spending aura or showing a Hatsu: %s',
    (failure) => {
      const state = scenario()
      if (failure === 'wrong-stage') state.environment.stageId = 'supreme-court'
      if (failure === 'morena-absent') state.environment.morenaPresent = false
      if (failure === 'lawful-visitor') state.environment.unlawfulIntruders.opponent = false
      if (failure === 'zetsu') state.player.nen.mode = 'zetsu'
      if (failure === 'stolen') state.player.hatsuEffects.hatsuStolen = 1
      if (failure === 'low-aura') state.player.aura = 39
      const next = summon(state)
      expect(next).toBe(state)
      expect(canUseMovesetMove(state, 'player', moveForSlot('yokotani', 'neutralSpecial')!)).toBe(
        false,
      )
      expect(
        performAuraAttack({ state, side: 'player', kind: 'special', auraCharged: false }),
      ).toBe(state)
    },
  )

  it('does not treat Morena herself as an intruder', () => {
    const state = scenario()
    state.opponent.id = 'morena'
    expect(canActivateLsdf(state, 'player')).toBe(false)
    expect(triggerHatsu(state, 'player', 'yokotani')).toBe(state)
  })

  it.each(['player', 'opponent'] as const)(
    'introduces the user and summons without a strike: %s',
    (side) => {
      const state = scenario(side)
      const next = summon(state, side)
      const target = side === 'player' ? 'opponent' : 'player'
      expect(next.lsdf?.[side]).toMatchObject({ target, level: 1, phase: 'approaching' })
      expect(next[side].aura).toBe(60)
      expect(next[side].attack).toBeNull()
      expect(next[side].x).toBe(state[side].x)
      expect(next[target].health).toBe(state[target].health)
      expect(next[target].hatsuEffects.witnessedHatsu).toBe('yokotani')
      expect(hatsuAvoidsImpact(next[side])).toBe(false)
      expect(summon(next, side)).toBe(next)
    },
  )

  it.each(['heavens-arena', 'knockout', 'arcade'] as const)(
    'ends a round by expulsion with no damage, hit score or knockdown: %s',
    (format) => {
      const initial = scenario('player', format)
      const next = frames(summon(initial), 240)
      expect(next.phase).toBe('finished')
      expect(next.finishReason).toBe('expulsion')
      expect(next.winner).toBe('player')
      expect(next.roundsWon).toEqual({ player: 1, opponent: 0 })
      expect(next.opponent.x).toBe(100)
      expect(next.opponent.pose).toBe('idle')
      expect(lsdfFighterVisible(next, 'opponent')).toBe(false)
      expect(lsdfFighterVisible(next, 'player')).toBe(true)
      expect(next.player.health).toBe(initial.player.health)
      expect(next.opponent.health).toBe(initial.opponent.health)
      expect(next.score).toEqual(initial.score)
      expect(next.knockdowns).toEqual(initial.knockdowns)
      expect(next.impact).toBeNull()
      expect(next.expulsion).toMatchObject({ owner: 'player', target: 'opponent' })
      const round = nextRound(next)
      expect(round.environment).toEqual(initial.environment)
      expect(round.lsdf).toBeUndefined()
      expect(round.expulsion).toBeUndefined()
    },
  )

  it('expels the player to the left boundary when Yokotani is P2', () => {
    const next = frames(summon(scenario('opponent'), 'opponent'), 240)
    expect(next.finishReason).toBe('expulsion')
    expect(next.winner).toBe('opponent')
    expect(next.player.x).toBe(0)
    expect(next.player.health).toBe(next.player.maxHealth)
  })

  it.each(['morena-leaves', 'outside', 'nen-sealed', 'owner-dies'])(
    'dismisses existing guards if the jurisdiction or Nen link fails: %s',
    (failure) => {
      const state = summon(scenario())
      if (failure === 'morena-leaves') state.environment.morenaPresent = false
      if (failure === 'outside') state.environment.stageId = 'whale-hold'
      if (failure === 'nen-sealed') state.player.hatsuEffects.hatsuStolen = 1
      if (failure === 'owner-dies') state.player.health = 0
      const next = advanceLsdf(state)
      expect(next.lsdf?.player).toBeUndefined()
      expect(next.opponent.health).toBe(next.opponent.maxHealth)
      expect(next.phase).toBe('fighting')
    },
  )

  it('keeps Yokotani vulnerable while the guards approach', () => {
    const state = summon(scenario())
    state.player.x = 46
    state.opponent.x = 51
    const armed = performMove({ state, side: 'opponent', action: 'light' })
    const fighter = armed.opponent
    fighter.attack = { ...fighter.attack!, frame: attackData('light', fighter).startup }
    const next = resolveFightImpacts(armed, [])
    expect(next.player.health).toBeLessThan(next.player.maxHealth)
    expect(next.impact?.avoided).toBe(false)
    expect(next.lsdf?.player).toEqual(state.lsdf?.player)
  })

  it('raises alert level for further aggression instead of consuming a guard', () => {
    const state = summon(scenario())
    const armed = performMove({ state, side: 'opponent', action: 'light' })
    const next = frames(armed, 1)
    expect(next.lsdf?.player?.level).toBe(2)
    expect(next.opponent.health).toBe(next.opponent.maxHealth)
  })

  it('dismisses the guards when Yokotani loses the round before the arrest', () => {
    const state = summon(scenario())
    state.player = { ...state.player, x: 46, health: 1 }
    state.opponent.x = 51
    const armed = performMove({ state, side: 'opponent', action: 'light' })
    armed.opponent.attack = {
      ...armed.opponent.attack!,
      frame: attackData('light', armed.opponent).startup,
    }
    const next = resolveFightImpacts(armed, [])
    expect(next.finishReason).toBe('knockout')
    expect(next.winner).toBe('opponent')
    expect(next.lsdf).toBeUndefined()
  })

  it('restrains and disarms the target before escorting it out', () => {
    const state = frames(summon(scenario()), 110)
    expect(state.lsdf?.player?.phase).toBe('escorting')
    const attempted = performMove({ state, side: 'opponent', action: 'light' })
    expect(attempted.opponent.attack).toBeNull()
    expect(attempted.opponent.aura).toBe(state.opponent.aura)
    const next = tickFight(attempted, EMPTY_INPUT, {
      dt: FIXED_STEP,
      opponentInput: { ...EMPTY_INPUT, left: true, jump: true },
    })
    expect(next.opponent.x).toBeGreaterThan(state.opponent.x)
    expect(next.opponent.y).toBe(0)
    expect(next.opponent.attack).toBeNull()
    expect(next.opponent.bufferedAttack).toBeNull()
  })

  it('resets the dummy after expulsion in training without awarding a win', () => {
    const initial = scenario()
    initial.mode = 'training'
    const next = frames(summon(initial), 240)
    expect(next.phase).toBe('fighting')
    expect(next.winner).toBeNull()
    expect(next.roundsWon).toEqual({ player: 0, opponent: 0 })
    expect(next.opponent.health).toBe(next.opponent.maxHealth)
    expect(next.opponent.x).toBe(78)
    expect(lsdfFighterVisible(next, 'opponent')).toBe(true)
    expect(next.lsdf?.player).toBeUndefined()
    expect(next.expulsion?.sequence).toBe(1)
  })

  it('keeps jurisdiction restrictions when Skill Hunter replays LSDF', () => {
    const state = scenario()
    state.player.id = 'chrollo'
    state.player.chrolloBook = { pages: ['yokotani'], page: 0, open: true, bookmark: null }
    state.player.hatsuEffects.stolenHatsu = 'yokotani'
    expect(summon(state).lsdf?.player).toBeDefined()
    state.environment.morenaPresent = false
    expect(summon(state)).toBe(state)
  })
})
