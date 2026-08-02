import { describe, expect, it } from 'vitest'
import { evaluateRun } from './balance'
import { initialInfiltrationState } from './state'

const state = () =>
  initialInfiltrationState({
    playerAt: { position: [0, 0], spaceId: 'a' },
    objectiveSpaceId: 'b',
    extractionSpaceId: 'a',
    witnesses: [],
  })

describe('infiltration balance telemetry', () => {
  it('distinguishes a ghost run from an exposed run', () => {
    const ghost = state()
    ghost.documentCopied = true
    ghost.metrics.maxAlert = 10
    expect(evaluateRun(ghost).style).toBe('ghost')
    const exposed = state()
    exposed.metrics.maxAlert = 85
    expect(evaluateRun(exposed).style).toBe('exposed')
  })
  it('flags a route that completes without creating pressure', () => {
    const run = state()
    run.documentCopied = true
    expect(evaluateRun(run).flags).toContain('route-too-safe')
  })
})
