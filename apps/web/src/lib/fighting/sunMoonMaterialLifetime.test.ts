import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, nextRound } from './engine'
import { performArenaAction } from './arenaActions'
import { advanceArena, damageArenaObject } from './arenaSimulation'
import { advanceArenaUtility } from './arenaUtility'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import {
  historicalCopyExpired,
  historicalMatterExists,
  historicalPartExists,
  GALLERY_FAKE_LIFETIME,
} from './historicalCopyLifetime'
import { expireHistoricalMatter } from './historicalMatterClock'
import { updateEntity } from './preparationWorld'
import type { FightSide, FightState } from './types'

function copied(side: FightSide): FightState {
  const target = side === 'player' ? 'opponent' : 'player'
  const start = beginFight(
    createFight('chrollo', 'chrollo', {
      mode: 'versus-local',
      environment: { arenaInteractions: true },
    }),
  )
  const prepared: FightState = {
    ...start,
    [side]: {
      ...start[side],
      x: 45,
      facing: 1,
      aura: 100,
      chrolloBook: {
        pages: ['gallery-fake', 'sun-and-moon'],
        page: 0,
        open: false,
        bookmark: 'gallery-fake',
      },
    },
    [target]: { ...start[target], x: 50 },
  }
  return copyHistoricalObject(prepared, side, target)
}
function marked(side: FightSide): FightState {
  const made = copied(side)
  const replica = made.battlefield!.entities.find((entry) => entry.copy)!
  let state: FightState = {
    ...made,
    [side]: {
      ...made[side],
      x: replica.x - 4,
      arenaRecovery: 0,
      attack: null,
      chrolloBook: { ...made[side].chrolloBook!, page: 1, open: true },
    },
  }
  state = performArenaAction(state, side, performAuraAttack)
  expect(state.arena!.pending[side]?.objectId).toBe(replica.id)
  for (let i = 0; i < 18; i++) state = advanceArenaUtility(state, side)
  expect(state.battlefield!.entities.find((entry) => entry.id === replica.id)!.arena!.sun).toBe(
    side,
  )
  return state
}
function dismiss(state: FightState, side: FightSide): FightState {
  return {
    ...state,
    [side]: {
      ...state[side],
      chrolloBook: { ...state[side].chrolloBook!, open: false, bookmark: null },
    },
  }
}
function replica(state: FightState) {
  return state.battlefield!.entities.find((entry) => entry.copy)!
}

describe('Sun and Moon post-mortem protection follows matter until actual detonation', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`${side}: the real marked copy survives dismissal and the ordinary 24-hour age limit`, () => {
      const markedState = marked(side)
      const closed = dismiss(markedState, side)
      const state = { ...closed, frame: GALLERY_FAKE_LIFETIME + 10 }
      expect(historicalCopyExpired(state, replica(state))).toBe(false)
      expect(replica(expireHistoricalMatter(state)).present).toBe(true)
    })
    it(`${side}: ordinary damage does not cancel an unexploded seal or erase detached copied matter`, () => {
      const markedState = marked(side)
      const id = replica(markedState).id
      const state = dismiss(damageArenaObject(markedState, id, 100), side)
      expect(replica(state).health).toBe(0)
      expect(historicalCopyExpired(state, replica(state))).toBe(false)
      expect(historicalPartExists(state, id)).toBe(true)
      expect(historicalMatterExists(state, id)).toBe(false)
      expect(replica(expireHistoricalMatter(state)).arena!.sun).toBe(side)
    })
    it(`${side}: an unmarked damaged copy still obeys Gallery Fake dismissal`, () => {
      const made = copied(side)
      const id = replica(made).id
      const state = dismiss(damageArenaObject(made, id, 100), side)
      expect(historicalCopyExpired(state, replica(state))).toBe(true)
      expect(historicalPartExists(state, id)).toBe(false)
    })
    it(`${side}: a round preserves the same marked copy, physical damage and elapsed material age`, () => {
      const made = marked(side)
      const id = replica(made).id
      const wounded = damageArenaObject(made, id, 13)
      const previous: FightState = { ...wounded, frame: 500, phase: 'finished', winner: side }
      const next = nextRound(previous)
      expect(replica(next).id).toBe(id)
      expect(replica(next).health).toBe(27)
      expect(replica(next).arena!.sun).toBe(side)
      expect(replica(next).copy!.createdAt).toBe(replica(previous).copy!.createdAt - 500)
      expect(next.arena).toBeDefined()
    })
    it(`${side}: a real Sun/Moon detonation consumes both seals and releases copied-matter protection`, () => {
      let state = marked(side)
      const id = replica(state).id
      state = {
        ...state,
        [side]: {
          ...state[side],
          x: 59,
          arenaRecovery: 0,
          chrolloBook: { ...state[side].chrolloBook!, open: false, bookmark: 'sun-and-moon' },
        },
      }
      state = performArenaAction(state, side, performAuraAttack)
      expect(state.arena!.pending[side]?.objectId).toBe('arena:crate:66')
      for (let i = 0; i < 18; i++) state = advanceArenaUtility(state, side)
      state = updateEntity(state, id, { x: 40 })
      state = updateEntity(state, 'arena:crate:66', { x: 44 })
      state = dismiss(state, side)
      const exploded = advanceArena(state)
      expect(replica(exploded).health).toBe(0)
      expect(replica(exploded).arena!.sun).toBeUndefined()
      expect(
        exploded.battlefield!.entities.find((entry) => entry.id === 'arena:crate:66')!.arena!.moon,
      ).toBeUndefined()
      expect(historicalPartExists(exploded, id)).toBe(false)
      expect(replica(expireHistoricalMatter(exploded)).present).toBe(false)
      expect(replica(state).arena!.sun).toBe(side)
    })
  }
  it('preserves the arena resolver for marked material even when generic scenery interactions are disabled', () => {
    const made = marked('player')
    const previous: FightState = {
      ...made,
      phase: 'finished',
      winner: 'player',
      environment: { ...made.environment, arenaInteractions: false },
    }
    const next = nextRound(previous)
    expect(next.arena).toBeDefined()
    expect(replica(next).arena!.sun).toBe('player')
  })
  it('keeps a real marked crate and its physical placement without duplicating or restoring it', () => {
    let state = marked('player')
    state = {
      ...state,
      player: {
        ...state.player,
        x: 59,
        arenaRecovery: 0,
        chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
      },
    }
    state = performArenaAction(state, 'player', performAuraAttack)
    for (let i = 0; i < 18; i++) state = advanceArenaUtility(state, 'player')
    state = updateEntity(state, 'arena:crate:66', { x: 82, y: 8, health: 17 })
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    const crates = next.battlefield!.entities.filter((entry) => entry.id === 'arena:crate:66')
    expect(crates).toHaveLength(1)
    expect(crates[0]).toMatchObject({ x: 82, y: 8, health: 17, arena: { moon: 'player' } })
  })
})
