import { describe, expect, it } from 'vitest'
import { huntContractById, listHuntContracts } from './registry'
import { validateContract } from './validate'

describe('Hunt V3 contracts', () => {
  it('publishes only valid bilingual contracts', () => {
    const contracts = listHuntContracts()
    expect(contracts.length).toBeGreaterThanOrEqual(2)
    for (const contract of contracts) expect(validateContract(contract)).toEqual([])
  })

  it('looks contracts up without inventing unknown ids', () => {
    expect(huntContractById('royal-apartments')?.terrainSequence).toHaveLength(3)
    expect(huntContractById('missing')).toBeNull()
  })

  it('rejects impossible objectives and empty loadouts', () => {
    const contract = huntContractById('royal-apartments')!
    const issues = validateContract({
      ...contract,
      durationSeconds: 90,
      allowedHatsu: [],
      objectives: [{ kind: 'survive', seconds: 100 }],
    })
    expect(issues.map((issue) => issue.path)).toEqual([
      'allowedHatsu',
      'objectives.0.seconds',
    ])
  })
})
