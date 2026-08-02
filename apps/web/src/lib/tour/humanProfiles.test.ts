import { describe, expect, it } from 'vitest'
import type { Apparition } from './apparitions'
import { humanStateKey } from './humanFigure'
import { humanProfile } from './humanProfiles'

function person(identity: string, role: NonNullable<Apparition['human']>['role']): Apparition {
  return {
    id: identity,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role, pose: 'idle', identity },
  }
}

describe('shared human profiles', () => {
  it('keeps one identity visually stable', () => {
    expect(humanProfile(person('furykov', 'guard'))).toEqual(
      humanProfile(person('furykov', 'guard')),
    )
  })

  it('gives roles their own clothing and morphology', () => {
    const guard = humanProfile(person('guard', 'guard'))
    const steward = humanProfile(person('steward', 'steward'))
    expect(guard.clothing).toBe('uniform')
    expect(steward.clothing).toBe('suit')
    expect(guard.shoulders).toBeGreaterThan(steward.shoulders)
    expect(guard.jacket).not.toBe(steward.jacket)
  })

  it('varies named people without random values', () => {
    const first = humanProfile(person('loberry', 'witness'))
    const second = humanProfile(person('belerainte', 'witness'))
    expect([first.height, first.skin, first.hairStyle]).not.toEqual([
      second.height,
      second.skin,
      second.hairStyle,
    ])
  })

  it('keeps Silent Majority ritual styling fixed', () => {
    const first = humanProfile(person('silent-majority', 'silent-majority'))
    const second = humanProfile(person('another-seed', 'silent-majority'))
    expect(first).toEqual(second)
    expect(first).toMatchObject({
      build: 'slim',
      hairStyle: 'bob',
      clothing: 'ritual',
      accent: 0xf0ece4,
    })
  })

  it('keeps Morena recognisable across game stages', () => {
    const profile = humanProfile(person('morena', 'morena'))
    expect(profile).toMatchObject({
      build: 'slim',
      hairStyle: 'long',
      face: 'narrow',
      clothing: 'gown',
    })
  })

  it('does not rebuild an Arena fighter for every transient combat pose', () => {
    const idle = person('arena:counter', 'fighter')
    idle.kind = 'combatant'
    const attack = {
      ...idle,
      stage: 4,
      human: { ...idle.human!, pose: 'attack' as const, alert: true },
    }
    expect(humanStateKey(attack)).toBe(humanStateKey(idle))
  })
})
