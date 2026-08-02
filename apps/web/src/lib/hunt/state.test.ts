import { describe, it, expect } from 'vitest'
import { huntReducer, initialHuntState, type HuntState } from './state'
import { EN_COST } from './nen/en'
import { ENTRAVE_COST } from './nen/entrave'
import { ledgerBalances, liveOf } from './nen/placed'
import { countOf, spentBy } from './telemetry'

function game(): HuntState {
  return initialHuntState({
    playerAt: { position: [0, 0], spaceId: 'salon' },
    hunterAt: { position: [5, 0], spaceId: 'salon' },
    targetSpaceId: 'chambre',
  })
}

describe('the game state', () => {
  it('starts full, in Ten, with nothing laid down', () => {
    const state = game()
    expect(state.ledger.pool).toEqual({ available: 100, committed: 0 })
    expect(state.player.nen).toBe('ten')
    expect(state.ledger.placements).toEqual([])
    expect(state.outcome).toBe('playing')
    expect(state.hatsu.id).toBe('bungee-gum')
  })

  it('takes the walked position from wherever the walking happens', () => {
    const walked = huntReducer(game(), {
      type: 'WALKED',
      player: { position: [3, 4], spaceId: 'cuisine', atRest: false },
    })
    expect(walked.player.position).toEqual([3, 4])
    expect(walked.player.spaceId).toBe('cuisine')
    expect(walked.player.atRest).toBe(false)
  })
})

describe('distinct Hatsu loadouts', () => {
  it('opens Parallel Future only from Zetsu and records intended space', () => {
    const future = initialHuntState({
      playerAt: { position: [0, 0], spaceId: 'salon' },
      hunterAt: { position: [5, 0], spaceId: 'cuisine' },
      targetSpaceId: 'chambre',
      hatsu: 'parallel-future',
    })
    expect(huntReducer(future, { type: 'HATSU' })).toBe(future)
    const hidden = huntReducer(future, { type: 'ZETSU' })
    expect(huntReducer(hidden, { type: 'HATSU' }).hatsu.window).toBe(10)
  })

  it('dowses only while still in Ten and returns no room id', () => {
    const dowsing = initialHuntState({
      playerAt: { position: [0, 0], spaceId: 'salon' },
      hunterAt: { position: [5, 0], spaceId: 'cuisine' },
      targetSpaceId: 'chambre',
      hatsu: 'dowsing-chain',
    })
    const read = huntReducer(dowsing, { type: 'HATSU' })
    expect(read.hatsu.probableBearing).toEqual([1, 0])
    expect(read.hatsu.forecastSpaceId).toBeNull()
  })
})

describe('the player’s own En', () => {
  it('costs fifteen and is written down', () => {
    const swept = huntReducer(game(), { type: 'SWEEP' })
    expect(swept.ledger.pool.available).toBe(100 - EN_COST)
    expect(countOf(swept.log, 'sweptEn')).toBe(1)
  })

  it('tells the hunter exactly where it came from — looking is not free', () => {
    const swept = huntReducer(game(), { type: 'SWEEP' })
    expect(swept.hunter.belief.at).toEqual([0, 0])
    expect(swept.hunter.belief.from).toBe('en')
  })

  it('cannot be cast from Zetsu', () => {
    const hidden = huntReducer(game(), { type: 'ZETSU' })
    const swept = huntReducer(hidden, { type: 'SWEEP' })
    expect(swept).toBe(hidden)
    expect(swept.ledger.pool.available).toBe(100)
  })

  it('does not reach a hunter across the deck', () => {
    const far = game()
    far.hunter = { ...far.hunter, position: [500, 500] }
    const swept = huntReducer(far, { type: 'SWEEP' })
    expect(swept.hunter.belief.at).toBeNull()
    expect(swept.ledger.pool.available).toBe(100 - EN_COST)
  })
})

describe('Ten and Zetsu', () => {
  it('toggles, and both directions are on the journal', () => {
    const hidden = huntReducer(game(), { type: 'ZETSU' })
    expect(hidden.player.nen).toBe('zetsu')
    const back = huntReducer(hidden, { type: 'ZETSU' })
    expect(back.player.nen).toBe('ten')
    expect(countOf(back.log, 'wentZetsu')).toBe(1)
    expect(countOf(back.log, 'wentTen')).toBe(1)
  })
})

describe('laying and taking back', () => {
  it('lays an entrave for twenty-five out of the body', () => {
    const laid = huntReducer(game(), { type: 'LAY' })
    expect(laid.ledger.pool).toEqual({ available: 75, committed: 25 })
    expect(liveOf(laid.ledger.placements)).toHaveLength(1)
    expect(ledgerBalances(laid.ledger)).toBe(true)
  })

  it('gives each one its own id', () => {
    const twice = huntReducer(huntReducer(game(), { type: 'LAY' }), { type: 'LAY' })
    const ids = twice.ledger.placements.map((placement) => placement.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('refuses a fifth when the body holds nothing', () => {
    let state = game()
    for (let count = 0; count < 5; count += 1) state = huntReducer(state, { type: 'LAY' })
    expect(liveOf(state.ledger.placements)).toHaveLength(4)
    expect(state.ledger.pool.available).toBe(0)
  })

  it('takes one back only from the room it is in', () => {
    const laid = huntReducer(game(), { type: 'LAY' })
    const elsewhere = huntReducer(laid, {
      type: 'WALKED',
      player: { spaceId: 'cuisine' },
    })
    expect(huntReducer(elsewhere, { type: 'TAKE' })).toBe(elsewhere)

    const back = huntReducer(laid, { type: 'TAKE' })
    expect(back.ledger.pool).toEqual({ available: 100, committed: 0 })
  })

  it('records the cost of laying and the credit of taking back', () => {
    const laid = huntReducer(game(), { type: 'LAY' })
    const back = huntReducer(laid, { type: 'TAKE' })
    expect(spentBy(laid.log, 'player')).toBe(ENTRAVE_COST)
    expect(spentBy(back.log, 'player')).toBe(0)
  })

  it('cannot lay one outside any room', () => {
    const nowhere = huntReducer(game(), { type: 'WALKED', player: { spaceId: null } })
    expect(huntReducer(nowhere, { type: 'LAY' })).toBe(nowhere)
  })

  it('cannot use Bungee Gum while in Zetsu', () => {
    const hidden = huntReducer(game(), { type: 'ZETSU' })
    expect(huntReducer(hidden, { type: 'LAY' })).toBe(hidden)
  })
})

describe('purity', () => {
  it('never mutates the state it was given', () => {
    const state = game()
    const snapshot = JSON.stringify(state)
    for (const action of [{ type: 'SWEEP' }, { type: 'LAY' }, { type: 'ZETSU' }] as const) {
      huntReducer(state, action)
    }
    expect(JSON.stringify(state)).toBe(snapshot)
  })
})
