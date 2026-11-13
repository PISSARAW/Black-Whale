import { describe, expect, it, vi } from 'vitest'
import { presentationFor } from '$lib/nen/abilityPresentation'
import { dealTheGame, EMPTY_INFECTION_PROGRESS } from './morena'
import {
  contagionActionAvailability,
  contagionCommandFor,
  contagionSurfaceAdapter,
  type ContagionSurfaceReasons,
  type ContagionSurfaceState,
} from './contagionSurface'

const reasons: ContagionSurfaceReasons = {
  unsupported: 'unsupported',
  phaseUnavailable: 'wrong phase',
  noQuestion: 'no question',
  noCard: 'no card',
  noTechnique: 'no technique',
  choiceRequired: 'choice required',
}

const state = (patch: Partial<ContagionSurfaceState> = {}): ContagionSurfaceState => ({
  view: 'table',
  game: dealTheGame(),
  progress: { ...EMPTY_INFECTION_PROGRESS },
  choice: null,
  techniquePage: null,
  ...patch,
})

describe('the live Contagion surface', () => {
  it('opens the encounter outside the table and asks the next live question at it', () => {
    expect(contagionCommandFor(state({ view: 'menu' }), 'open-game')).toEqual({
      kind: 'open-game',
    })
    expect(contagionCommandFor(state(), 'ask')).toEqual({
      kind: 'game',
      command: { kind: 'ask', question: 'goal' },
    })
  })

  it('keeps phase-specific and parameterised actions visible but disabled', () => {
    expect(contagionActionAvailability(state(), reasons, 'stake')).toEqual({
      executable: false,
      reason: 'no card',
    })
    expect(contagionActionAvailability(state(), reasons, 'record-kill')).toEqual({
      executable: false,
      reason: 'choice required',
    })
    expect(contagionActionAvailability(state(), reasons, 'infect')).toEqual({
      executable: false,
      reason: 'unsupported',
    })
  })

  it('exposes the witnessed-murder step only for an eligible completed hand', () => {
    const eligible = state({
      game: { ...dealTheGame(), phase: 'over', kissed: true, verdict: 'infected' },
    })
    expect(contagionCommandFor(eligible, 'witness-murder')).toEqual({ kind: 'witness-murder' })
    expect(
      contagionCommandFor(
        { ...eligible, progress: { ...EMPTY_INFECTION_PROGRESS, witnessedMurder: true } },
        'witness-murder',
      ),
    ).toBeNull()
  })

  it('publishes live encounter metrics and dispatches through one command bridge', () => {
    const presentation = presentationFor('contagion')!
    const execute = vi.fn()
    const adapter = contagionSurfaceAdapter({
      presentation,
      name: 'Contagion',
      owner: 'Morena',
      reducedMotion: true,
      state: state(),
      reasons,
      execute,
    })
    const model = adapter.modelFor(presentation, 'ask')!
    expect(model.preview).toBe(false)
    expect(model.reducedMotion).toBe(true)
    expect(model.metrics).toMatchObject({ phase: 'asking', infectionSteps: 0, infected: false })
    adapter.dispatch('ask')
    adapter.dispatch('infect')
    expect(execute).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledWith({
      kind: 'game',
      command: { kind: 'ask', question: 'goal' },
    })
  })
})
