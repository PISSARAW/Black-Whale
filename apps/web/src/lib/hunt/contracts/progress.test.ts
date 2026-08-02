import { describe, expect, it } from 'vitest'
import { huntContractById } from './registry'
import { contractProgress, type ContractStanding } from './progress'
import { record } from '../telemetry'

const standing: ContractStanding = {
  terrain: 'tubeppa',
  spaceId: 'hall',
  clock: 200,
  outcome: 'playing',
  hunterAura: 40,
  log: [],
}

describe('contract objectives', () => {
  it('combines survival and misdirection without completing early', () => {
    const contract = huntContractById('blackout-siege')!
    const once = record([], 10, { actor: 'hunter', kind: 'lostTheTrail' })
    const progress = contractProgress(contract, { ...standing, clock: 360, log: once })
    expect(progress.objectives.map((objective) => objective.complete)).toEqual([true, false])
    expect(progress.complete).toBe(false)
  })

  it('completes a compound contract only when every target is met', () => {
    const contract = huntContractById('blackout-siege')!
    let log = record([], 10, { actor: 'hunter', kind: 'lostTheTrail' })
    log = record(log, 20, { actor: 'hunter', kind: 'lostTheTrail' })
    expect(contractProgress(contract, { ...standing, clock: 360, log }).complete).toBe(true)
  })

  it('marks a terminal loss as failure while preserving measured progress', () => {
    const contract = huntContractById('blackout-siege')!
    const progress = contractProgress(contract, { ...standing, outcome: 'caught' })
    expect(progress.failed).toBe(true)
    expect(progress.objectives[0].current).toBe(200)
  })
})
