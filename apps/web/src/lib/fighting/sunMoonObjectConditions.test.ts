import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { arenaObjects, performArenaAction } from './arenaActions'
import { advanceArena } from './arenaSimulation'
import { advanceArenaUtility } from './arenaUtility'
import { holdVoicePhone } from './blackVoiceGear'
import { createBlackVoiceGear } from './blackVoiceTypes'
import { updateEntity } from './preparationWorld'
import type { FightSide, FightState } from './types'

function ready(side: FightSide, moon = false): FightState {
  const state = beginFight(
    createFight('chrollo', 'chrollo', {
      mode: 'versus-local',
      environment: { arenaInteractions: true },
    }),
  )
  return {
    ...state,
    [side]: {
      ...state[side],
      x: 27,
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
const use = (state: FightState, side: FightSide) =>
  performArenaAction(state, side, performAuraAttack)
function complete(state: FightState, side: FightSide): FightState {
  for (let i = 0; i < 18; i++) state = advanceArenaUtility(state, side)
  return state
}
function pair(): FightState {
  let state = complete(use(ready('player'), 'player'), 'player')
  state = {
    ...state,
    player: {
      ...state.player,
      x: 59,
      arenaRecovery: 0,
      chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
    },
  }
  return complete(use(state, 'player'), 'player')
}
function placePair(state: FightState, y: number): FightState {
  state = updateEntity(state, 'arena:crate:34', { x: 34, y })
  return updateEntity(state, 'arena:crate:66', { x: 40, y })
}

describe('Sun and Moon scenery: physical hands and two-dimensional contact', () => {
  for (const side of ['player', 'opponent'] as const) {
    for (const moon of [false, true]) {
      const mark = moon ? 'moon' : 'sun'
      const hand = moon ? 'right' : 'left'
      it(`${side}: applies ${mark} with its actual free ${hand} hand`, () => {
        const state = complete(use(ready(side, moon), side), side)
        expect(arenaObjects(state)[0].arena![mark]).toBe(side)
      })
      it(`${side}: refuses ${mark} when the required forearm is missing, without spending aura`, () => {
        const start = ready(side, moon)
        const state: FightState = {
          ...start,
          [side]: {
            ...start[side],
            bodyDamage: { parts: [moon ? 'right-forearm' : 'left-forearm'] },
          },
        }
        expect(use(state, side)).toBe(state)
      })
      it(`${side}: a real phone held in the ${hand} hand prevents ${mark}`, () => {
        let state = ready(side, moon)
        state = { ...state, [side]: { ...state[side], blackVoiceGear: createBlackVoiceGear(side) } }
        state = holdVoicePhone(state, side)
        expect(state[side].blackVoiceGear!.phone!.hand).toBe(hand)
        expect(use(state, side)).toBe(state)
      })
      it(`${side}: losing the required ${hand} hand interrupts an already admitted mark`, () => {
        const started = use(ready(side, moon), side)
        expect(started.arena!.pending[side]?.mark).toBe(mark)
        const wounded: FightState = {
          ...started,
          [side]: {
            ...started[side],
            bodyDamage: { parts: [moon ? 'right-forearm' : 'left-forearm'] },
          },
        }
        const stopped = advanceArenaUtility(wounded, side)
        expect(stopped.arena!.pending[side]).toBeUndefined()
        expect(arenaObjects(complete(stopped, side))[0].arena![mark]).toBeUndefined()
      })
    }
    it(`${side}: opening the book interrupts the pending right-hand Moon instead of changing it to Sun`, () => {
      const started = use(ready(side, true), side)
      const opened = {
        ...started,
        [side]: { ...started[side], chrolloBook: { ...started[side].chrolloBook!, open: true } },
      }
      const stopped = advanceArenaUtility(opened, side)
      expect(stopped.arena!.pending[side]).toBeUndefined()
      const object = arenaObjects(complete(stopped, side))[0]
      expect(object.arena!.sun).toBeUndefined()
      expect(object.arena!.moon).toBeUndefined()
    })
  }
  it('does not detonate horizontally aligned objects separated vertically', () => {
    const marked = placePair(pair(), 0)
    const apart = updateEntity(marked, 'arena:crate:66', { y: 20 })
    expect(arenaObjects(advanceArena(apart))).toHaveLength(2)
    expect(arenaObjects(advanceArena(marked))).toHaveLength(0)
  })
  it('accepts genuine edge contact between the two marked colliders', () => {
    const marked = updateEntity(placePair(pair(), 0), 'arena:crate:66', { y: 8 })
    expect(arenaObjects(advanceArena(marked))).toHaveLength(0)
  })
  it('places an airborne blast at contact height and only hits the body intersecting its radius', () => {
    const marked = placePair(pair(), 40)
    const state = {
      ...marked,
      player: { ...marked.player, x: 37, y: 40 },
      opponent: { ...marked.opponent, x: 37, y: 0 },
    }
    const exploded = advanceArena(state)
    expect(arenaObjects(exploded)).toHaveLength(0)
    expect(exploded.player.health).toBeLessThan(state.player.health)
    expect(exploded.opponent.health).toBe(state.opponent.health)
  })
})
