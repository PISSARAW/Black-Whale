import { describe, expect, it } from 'vitest'
import { initialCombatState, type CombatEvent, type CombatState } from '../combat/types'
import { arenaImpactCamera } from './impactCamera'

const event = (moveId: string, hitstop: number, impact: CombatEvent['impact'] = 'clean') =>
  ({
    at: 0,
    attacker: 'opponent',
    zone: 'torso',
    impact,
    points: 1,
    technique: 'strike',
    moveId,
    hitstop,
  }) satisfies CombatEvent

function contact(moveId: string, hitstop: number, impact?: CombatEvent['impact']): CombatState {
  return { ...initialCombatState(), hitstop, lastEvent: event(moveId, hitstop, impact) }
}

describe('Arena POV impact camera', () => {
  it('gives an authored heavy contact more recoil than a light contact', () => {
    const light = arenaImpactCamera(contact('kurapika:standingLight', 2 / 60))
    const heavy = arenaImpactCamera(contact('kurapika:standingHeavy', 5 / 60))

    expect(Math.abs(heavy[1])).toBeGreaterThan(Math.abs(light[1]))
  })

  it('eases on the deterministic hitstop clock and ignores misses', () => {
    const start = contact('kurapika:standingHeavy', 5 / 60)
    const advanced = { ...start, hitstop: 2 / 60 }

    expect(arenaImpactCamera(advanced)).not.toEqual(arenaImpactCamera(start))
    expect(arenaImpactCamera(contact('kurapika:standingHeavy', 5 / 60, 'miss'))).toEqual([0, 0])
    expect(arenaImpactCamera({ ...advanced, hitstop: 0 })).toEqual([0, 0])
  })
})
