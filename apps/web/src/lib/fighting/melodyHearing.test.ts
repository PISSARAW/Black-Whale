import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { resolveFightImpacts } from './combatImpact'
import { advanceMelodyHearing, melodyParryBonus } from './melodyHearing'
import { MELODY_LISTEN_FRAMES } from './melodyRules'
import { FIXED_STEP } from './fightClock'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState } from './types'

function ready(): FightState {
  const state = beginFight(
    createFight('melody', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 54, aura: 100 },
  }
}
function listen(state: FightState, count = MELODY_LISTEN_FRAMES): FightState {
  for (let n = 0; n < count; n++) state = advanceMelodyHearing(state)
  return state
}
function activeStrike(state: FightState): FightState {
  const armed = performAttack(state, 'opponent', 'light')
  return {
    ...armed,
    opponent: {
      ...armed.opponent,
      attack: { ...armed.opponent.attack!, frame: attackData('light', armed.opponent).startup },
    },
  }
}

describe('Melody’s bodily hearing', () => {
  it('listens passively in Zetsu, with stolen Nen and without Gyo', () => {
    const state = ready()
    const sealed = {
      ...state,
      player: {
        ...state.player,
        nen: { ...state.player.nen, mode: 'zetsu' as const },
        hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 },
      },
    }
    const heard = listen(sealed)
    expect(heard.player.melodyHearing).toMatchObject({ frames: 12, pulse: 'steady', direction: 1 })
    expect(heard.player.aura).toBe(sealed.player.aura)
    expect(heard.player.nen).toBe(sealed.player.nen)
  })

  it('reads actual approach and preparation, even under In, without exposing hidden aura or inputs', () => {
    const state = activeStrike(ready())
    const hidden = {
      ...state,
      opponent: {
        ...state.opponent,
        nen: { ...state.opponent.nen, in: true },
        attack: { ...state.opponent.attack!, frame: 0 },
      },
    }
    const heard = listen(hidden)
    expect(heard.player.melodyHearing).toMatchObject({ pulse: 'agitated', threat: 'startup' })
    expect(Object.keys(heard.player.melodyHearing!).sort()).toEqual([
      'direction',
      'frames',
      'pulse',
      'target',
      'threat',
    ])
    expect(heard.opponent).toBe(hidden.opponent)
  })

  it('loses the read with covered ears or hearing sealed, and must listen again', () => {
    const state = listen(ready())
    for (const deaf of [
      { ...state.player, coveringEars: true },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 2 } },
    ]) {
      const silent = listen({ ...state, player: deaf })
      expect(silent.player.melodyHearing).toBeUndefined()
      expect(melodyParryBonus(silent.player, silent.opponent)).toBe(0)
      expect(
        listen(
          {
            ...silent,
            player: {
              ...silent.player,
              coveringEars: false,
              hatsuEffects: { ...silent.player.hatsuEffects, senseSeals: 0 },
            },
          },
          1,
        ).player.melodyHearing?.frames,
      ).toBe(1)
    }
  })

  it('adds three frames to a correctly timed manual parry, never an automatic dodge', () => {
    const state = listen(ready())
    const guarded = { ...state, player: { ...state.player, blocking: true, guardFrames: 8 } }
    expect(resolveFightImpacts(activeStrike(guarded), []).impact?.parried).toBe(true)
    const unread = { ...guarded, player: { ...guarded.player, melodyHearing: undefined } }
    expect(resolveFightImpacts(activeStrike(unread), []).impact?.parried).toBe(false)
    const open = resolveFightImpacts(activeStrike(state), [])
    expect(open.impact?.damage).toBeGreaterThan(0)
    expect(open.impact?.avoided).toBe(false)
  })

  it('requires an actual flute to replay the copied music and does not copy Melody’s hearing', () => {
    const state = ready()
    const chrollo = {
      ...state,
      player: {
        ...state.player,
        id: 'chrollo' as const,
        equipment: ['book' as const],
        chrolloBook: { pages: ['melody'] as const, page: 0, open: false, bookmark: 'melody' as const },
      },
    }
    expect(performAttack(chrollo, 'player', 'special')).toBe(chrollo)
    const supplied = { ...chrollo, player: { ...chrollo.player, melodyFlute: true } }
    const singing = performAttack(supplied, 'player', 'special')
    expect(singing.player.melodyPerformance).toBeDefined()
    expect(listen(singing).player.melodyHearing).toBeUndefined()
  })

  it('uses the live engine for ear covering, with P1/P2 input symmetry', () => {
    const state = ready()
    const covered = tickFight(
      state,
      { ...EMPTY_INPUT, coverEars: true },
      { dt: FIXED_STEP, opponentInput: { ...EMPTY_INPUT, coverEars: true } },
    )
    expect(covered.player.coveringEars).toBe(true)
    expect(covered.opponent.coveringEars).toBe(true)
    expect(covered.player.melodyHearing).toBeUndefined()
  })
})
