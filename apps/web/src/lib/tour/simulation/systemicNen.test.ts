import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { useSystemicNen } from './systemicNen'
import { transitionNen, type NenTechniqueAction } from '@black-whale/nen-engine'

const applied = (state: ReturnType<typeof createTourSimulation>, action: NenTechniqueAction) => ({
  action,
  nen: transitionNen(state.player.nen, action).state,
  reserve: state.player.aura,
})

describe('systemic Nen in Free Tour', () => {
  it('lets Gyo reveal an In-hidden aura trace without revealing unrelated facts', () => {
    const result = useSystemicNen(
      createTourSimulation({ id: 'gyo' }),
      applied(createTourSimulation({ id: 'gyo-source' }), { type: 'GYO', on: true }),
      { traces: [{ id: 'crate-mark', hiddenWithIn: true }] },
    )
    expect(result.observations).toEqual(['aura-trace:crate-mark'])
    expect(result.state.player.aura).toBe(100)
  })

  it('lets En detect anonymous nearby presences but not their identity', () => {
    const result = useSystemicNen(
      createTourSimulation({ id: 'en' }),
      applied(createTourSimulation({ id: 'en-source' }), { type: 'EN', radius: 5 }),
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
      applied(createTourSimulation({ id: 'zetsu-source' }), { type: 'ZETSU' }),
      { presences: [{ id: 'player', distance: 0, physicallyVisible: true, auraConcealed: true }] },
    )
    expect(result.observations).toEqual(['visible-body:player'])
    expect(result.state.player.nen.mode).toBe('zetsu')
  })

  it('deduplicates a witnessed hostile-Nen incident and its security sweep', () => {
    const state = createTourSimulation({ id: 'social' })
    const witness = {
      id: 'guard',
      factionId: 'royal-army',
      spaceId: 'room-1004',
      detectsConcealedVisitor: false,
      highSecurity: true,
    }
    const result = useSystemicNen(
      state,
      { ...applied(state, { type: 'REN' }), pressureRising: true },
      { witnesses: [witness] },
    )
    expect(result.state.reputation['royal-army']).toBe(-10)
    expect(result.state.incidents).toContain('hostile-nen:room-1004')
    expect(result.scheduled).toEqual(['SECURITY_SWEEP'])

    const duplicate = useSystemicNen(
      result.state,
      { ...applied(result.state, { type: 'REN' }), pressureRising: true },
      { witnesses: [witness] },
    )
    expect(duplicate.scheduled).toEqual([])
  })
})
