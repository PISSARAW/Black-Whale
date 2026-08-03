import { describe, expect, it } from 'vitest'
import { initialBelief } from './belief'
import { strategicPlanner, type HunterPerceptionV3 } from './strategy'

const perception: HunterPerceptionV3 = {
  selfSpaceId: 'hall',
  belief: initialBelief(),
  visibleExits: [{ from: 'hall', to: 'kitchen', sealed: false }],
  sealedExits: [],
  aura: 100,
  sinceSweep: 30,
}

describe('strategic hunter planner', () => {
  it('contains the map by sealing only an exit it can see', () => {
    expect(strategicPlanner('containment').plan(perception)).toEqual({
      kind: 'seal',
      exit: { a: 'hall', b: 'kitchen' },
    })
  })

  it('prioritizes a fresh belief over doctrine', () => {
    const informed = {
      ...perception,
      belief: {
        at: [4, 2] as const,
        spaceId: 'bedroom',
        from: 'sound' as const,
        sharp: false,
        age: 2,
        cleared: [],
      },
    }
    expect(strategicPlanner('containment').plan(informed)).toEqual({
      kind: 'search',
      spaceId: 'bedroom',
    })
  })

  it('changes cadence by doctrine without hidden state', () => {
    const noExits = { ...perception, visibleExits: [], sinceSweep: 20 }
    expect(strategicPlanner('pursuit').plan(noExits).kind).toBe('sweep')
    expect(strategicPlanner('deception').plan(noExits).kind).toBe('patrol')
    expect(Object.keys(noExits)).not.toContain('playerPosition')
  })
})
