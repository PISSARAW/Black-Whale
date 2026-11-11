import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { useSystemicNen } from './systemicNen'

describe('systemic Nen in Free Tour', () => {
  it('lets Gyo reveal an In-hidden aura trace without revealing unrelated facts', () => {
    const result = useSystemicNen(
      createTourSimulation({ id: 'gyo' }),
      { type: 'GYO', on: true },
      { traces: [{ id: 'crate-mark', hiddenWithIn: true }] },
    )
    expect(result.observations).toEqual(['aura-trace:crate-mark'])
    expect(result.state.player.aura).toBe(98)
  })

  it('lets En detect anonymous nearby presences but not their identity', () => {
    const result = useSystemicNen(
      createTourSimulation({ id: 'en' }),
      { type: 'EN', radius: 5 },
      {
        presences: [
          { id: 'guard', distance: 3, physicallyVisible: false, auraConcealed: true },
          { id: 'medic', distance: 8, physicallyVisible: false, auraConcealed: false },
        ],
      },
    )
    expect(result.observations).toEqual(['presence:guard:unidentified'])
  })

  it('keeps a body physically visible when its user enters Zetsu', () => {
    const result = useSystemicNen(
      createTourSimulation({ id: 'zetsu' }),
      { type: 'ZETSU' },
      { presences: [{ id: 'player', distance: 0, physicallyVisible: true, auraConcealed: true }] },
    )
    expect(result.observations).toEqual(['visible-body:player'])
    expect(result.state.player.nen.mode).toBe('zetsu')
  })
})
