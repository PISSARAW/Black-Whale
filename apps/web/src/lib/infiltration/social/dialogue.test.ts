import { describe, expect, it } from 'vitest'
import { circulateFactionReport } from '../factions'
import { initialInfiltrationState } from '../state'
import { dialogueOptions } from './dialogue'

const state = () =>
  initialInfiltrationState({
    playerAt: { position: [0, 0], spaceId: 'entry' },
    objectiveSpaceId: 'office',
    extractionSpaceId: 'entry',
    witnesses: [
      {
        id: 'steward',
        position: [0, 0],
        heading: 0,
        spaceId: 'entry',
        sight: 8,
        social: true,
        usesEn: false,
        route: ['entry'],
      },
    ],
  })

describe('bounded contextual NPC dialogue', () => {
  it('offers only claims backed by the current cover', () => {
    const options = dialogueOptions(state(), 'steward')
    expect(options.find((option) => option.id === 'present-document')?.available).toBe(true)
    expect(options.find((option) => option.id === 'explain-duty')?.available).toBe(true)
    expect(options.every((option) => ['workOrder', 'bluff'].includes(option.answer))).toBe(true)
  })

  it('removes an authority bluff once that faction received a contrary report', () => {
    const initial = state()
    const report = { id: 'r1', witnessId: 'steward' as const, spaceId: 'entry', certainty: 90 }
    const informed = {
      ...initial,
      factionKnowledge: circulateFactionReport(
        initial.factionKnowledge,
        report,
        initial.witnesses[0],
      ),
    }
    expect(
      dialogueOptions(informed, 'steward').find((option) => option.id === 'appeal-authority')
        ?.available,
    ).toBe(false)
  })
})
