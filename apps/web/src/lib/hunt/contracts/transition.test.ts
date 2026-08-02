import { describe, expect, it } from 'vitest'
import { huntContractById } from './registry'
import { carryIntoStage, nextStage, stageOf } from './transition'
import { huntReducer, initialHuntState } from '../state'

const setup = (space: string) =>
  initialHuntState({
    playerAt: { position: [0, 0], spaceId: space },
    hunterAt: { position: [10, 0], spaceId: `${space}-hunter` },
    targetSpaceId: `${space}-target`,
  })

describe('continuous contract transitions', () => {
  it('walks the declared terrain sequence', () => {
    const contract = huntContractById('royal-apartments')!
    expect(stageOf(contract, 0).terrain).toBe('tserriednich')
    expect(nextStage(contract, 0)?.terrain).toBe('tubeppa')
    expect(nextStage(contract, 2)).toBeNull()
  })

  it('carries aura, Hatsu, fatigue and journal into the next zone', () => {
    let previous = huntReducer(setup('a'), { type: 'SWEEP' })
    previous = { ...previous, hunter: { ...previous.hunter, pool: { available: 41, ceiling: 100 } } }
    const carried = carryIntoStage(previous, setup('b'))
    expect(carried.player.spaceId).toBe('b')
    expect(carried.ledger.pool.available).toBe(85)
    expect(carried.hunter.pool.available).toBe(41)
    expect(carried.log).toHaveLength(previous.log.length)
  })
})
