import { describe, expect, it } from 'vitest'
import { huntContractById } from './registry'
import { carryIntoStage, nextStage, previousStage, stageOf } from './transition'
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
    expect(previousStage(contract, 1)?.terrain).toBe('tserriednich')
    expect(previousStage(contract, 0)).toBeNull()
    expect(nextStage(contract, 2)).toBeNull()
  })

  it('carries aura, Hatsu, fatigue and journal into the next zone', () => {
    let previous = huntReducer(setup('a'), { type: 'SWEEP' })
    previous = {
      ...previous,
      hunter: { ...previous.hunter, pool: { available: 41, committed: 0 } },
    }
    const carried = carryIntoStage(previous, setup('b'))
    expect(carried.player.spaceId).toBe('b')
    expect(carried.ledger.pool.available).toBe(85)
    expect(carried.hunter.pool.available).toBe(41)
    expect(carried.log).toHaveLength(previous.log.length)
  })

  it('keeps placed aura committed at its physical terrain', () => {
    const previous = huntReducer(
      initialHuntState({
        playerAt: { position: [0, 0], spaceId: 'a' },
        hunterAt: { position: [10, 0], spaceId: 'a-hunter' },
        targetSpaceId: 'a-target',
        terrain: 'tserriednich',
      }),
      { type: 'LAY' },
    )
    const carried = carryIntoStage(previous, setup('b'))
    expect(carried.ledger.placements).toHaveLength(1)
    expect(carried.ledger.placements[0].terrain).toBe('tserriednich')
    expect(carried.ledger.pool).toEqual({ available: 75, committed: 25 })
  })

  it('keeps physical evidence from earlier zones', () => {
    const walked = huntReducer(setup('a'), {
      type: 'WALKED',
      player: { position: [2, 3], spaceId: 'a-hall', atRest: false },
    })
    const carried = carryIntoStage(walked, setup('b'))
    expect(carried.traces).toEqual(walked.traces)
  })
})
