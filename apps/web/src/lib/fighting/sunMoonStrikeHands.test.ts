import { canUseMovesetMove, moveById } from './movesets'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { holdVoicePhone } from './blackVoiceGear'
import { chrolloHatsu } from './hatsu/chrollo'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function ready(side: FightSide, moon = false): FightState {
  const state = beginFight(createFight('chrollo', 'chrollo', { mode: 'versus-local' }))
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [other]: { ...state[other], x: 54 },
    [side]: {
      ...state[side],
      x: 46,
      facing: 1,
      aura: 100,
      chrolloBook: {
        ...state[side].chrolloBook!,
        open: !moon,
        bookmark: moon ? 'sun-and-moon' : null,
      },
    },
  }
}
function strike(state: FightState, side: FightSide, moon = false): FightState {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `chrollo:${moon ? 'finisher' : 'neutralSpecial'}`,
    auraCharged: false,
  })
}
function contact(state: FightState, side: FightSide, moon = false): FightState {
  return chrolloHatsu.onImpact({
    state,
    side,
    defenderSide: side === 'player' ? 'opponent' : 'player',
    source: 'chrollo',
    moveId: `chrollo:${moon ? 'finisher' : 'neutralSpecial'}`,
    blocked: false,
    concealed: false,
  })
}
for (const side of ['player', 'opponent'] as const)
  for (const moon of [false, true]) {
    const hand = moon ? 'right' : 'left'
    describe(`${side}: native ${moon ? 'Moon' : 'Sun'} requires the actual ${hand} hand`, () => {
      it('admits the real native strike when its anatomical hand is free', () => {
        const state = ready(side, moon)
        const admitted = strike(state, side, moon)
        expect(admitted[side].attack).not.toBeNull()
        expect(admitted[side].aura).toBeLessThan(state[side].aura)
      })
      it('does not start or spend aura with the required forearm missing', () => {
        const start = ready(side, moon)
        const injured: FightState = {
          ...start,
          [side]: {
            ...start[side],
            bodyDamage: { parts: [moon ? 'right-forearm' : 'left-forearm'] },
          },
        }
        expect(strike(injured, side, moon)).toBe(injured)
      })
      it('does not bypass a real phone occupying the required palm', () => {
        const held = holdVoicePhone(ready(side, moon), side)
        expect(held[side].blackVoiceGear!.phone!.hand).toBe(hand)
        expect(strike(held, side, moon)).toBe(held)
        const move = moveById(`chrollo:${moon ? 'finisher' : 'neutralSpecial'}`)!
        expect(canUseMovesetMove(held, side, move)).toBe(false)
        expect(contact(held, side, moon)).toBe(held)
      })
      it('checks the palm again at impact, including an injury acquired after admission', () => {
        const admitted = strike(ready(side, moon), side, moon)
        const injured: FightState = {
          ...admitted,
          [side]: {
            ...admitted[side],
            bodyDamage: { parts: [moon ? 'right-forearm' : 'left-forearm'] },
          },
        }
        expect(contact(injured, side, moon)).toBe(injured)
      })
    })
  }
it('does not forbid a left-hand Sun because a closed-book caster holds a phone in his right hand', () => {
  const held = holdVoicePhone(ready('player', true), 'player')
  expect(held.player.blackVoiceGear!.phone!.hand).toBe('right')
  expect(strike(held, 'player').player.attack).not.toBeNull()
})
it('keeps the native Sun and close-book Moon route executable through real combat frames', () => {
  let state = ready('player')
  const frames = (count: number) => {
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  state = strike(state, 'player')
  frames(50)
  expect(state.opponent.hatsuEffects.sunMark).toBe(1)
  state = {
    ...state,
    player: {
      ...state.player,
      x: state.opponent.x - 5,
      chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
    },
  }
  state = strike(state, 'player', true)
  expect(state.player.attack?.moveId).toBe('chrollo:finisher')
  frames(50)
  expect(state.opponent.hatsuEffects.sunMark).toBe(0)
  expect(state.opponent.hatsuEffects.moonMark).toBe(0)
})
