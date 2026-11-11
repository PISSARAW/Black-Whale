import { describe, expect, it } from 'vitest'
import type { WorldState } from '@black-whale/canon-engine'
import type { UnitCondition } from './conflict'
import { triggerCatsName } from './catsName'

const at = (locationId: string) => ({ entity: { id: '', kind: 'CHARACTER' }, locationId })

function board(): WorldState {
  return {
    entities: {
      'prince-camilla': { id: 'prince-camilla', kind: 'CHARACTER', label: 'Camilla' },
      'guard-b': { id: 'guard-b', kind: 'CHARACTER', label: 'B' },
      'guard-a': { id: 'guard-a', kind: 'CHARACTER', label: 'A' },
      elsewhere: { id: 'elsewhere', kind: 'CHARACTER', label: 'C' },
    },
    presences: {
      'prince-camilla': at('room-1002'),
      'guard-b': at('room-1002'),
      'guard-a': at('room-1002'),
      elsewhere: at('room-1001'),
    },
  } as unknown as WorldState
}

function check(conditions: Record<string, UnitCondition>, previous: Record<string, UnitCondition>) {
  return {
    state: board(),
    conflict: {
      conditions,
      reports: [] as string[],
      causedBy: { 'prince-camilla': 'guard-b' } as Record<string, string>,
    },
    previousConditions: previous,
    hasCatsName: true,
    report: 'long',
    shortReport: 'short',
  }
}

describe("Camilla's Cat's Name", () => {
  it('revives Camilla and consumes the unit that directly killed her', () => {
    const input = check({ 'prince-camilla': 'ELIMINATED' }, { 'prince-camilla': 'WOUNDED' })
    const cue = triggerCatsName(input)
    expect(input.conflict.conditions['prince-camilla']).toBe('READY')
    expect(input.conflict.conditions['guard-b']).toBe('ELIMINATED')
    expect(input.conflict.reports).toEqual(['long'])
    expect(cue).toMatchObject({ abilityId: 'cats-name', targetLocationId: 'room-1002' })
  })

  it('does nothing when Camilla was already dead or survived the turn', () => {
    expect(triggerCatsName(check({ 'prince-camilla': 'WOUNDED' }, {}))).toBeNull()
    const dead = { 'prince-camilla': 'ELIMINATED' } as const
    expect(triggerCatsName(check({ ...dead }, { ...dead }))).toBeNull()
  })

  it('does not guess a killer when the causal record is absent', () => {
    const input = check({ 'prince-camilla': 'ELIMINATED' }, { 'prince-camilla': 'WOUNDED' })
    input.conflict.causedBy = {}
    expect(triggerCatsName(input)).toBeNull()
  })
})
