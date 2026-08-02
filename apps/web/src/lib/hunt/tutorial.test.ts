import { describe, expect, it } from 'vitest'
import { huntReducer, initialHuntState } from './state'
import { tutorialStep } from './tutorial'

const fresh = () =>
  initialHuntState({
    playerAt: { position: [0, 0], spaceId: 'salon' },
    hunterAt: { position: [5, 0], spaceId: 'cuisine' },
    targetSpaceId: 'chambre',
  })

describe('the playable Hunt initiation', () => {
  it('advances from movement through principles by observing actual actions', () => {
    expect(tutorialStep(fresh())).toBe('move')
    const moved = huntReducer(
      { ...fresh(), clock: 1 },
      { type: 'WALKED', player: { atRest: false } },
    )
    expect(tutorialStep(moved)).toBe('zetsu')
    const hidden = huntReducer(moved, { type: 'ZETSU' })
    expect(tutorialStep(hidden)).toBe('en')
    const ten = huntReducer(hidden, { type: 'ZETSU' })
    expect(tutorialStep(huntReducer(ten, { type: 'SWEEP' }))).toBe('hatsu')
  })

  it('asks the player to engineer contact after using the equipped Hatsu', () => {
    expect(tutorialStep(huntReducer(fresh(), { type: 'LAY' }))).toBe('contact')
  })
})
