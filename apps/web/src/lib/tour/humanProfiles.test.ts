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

  // ── ADR-005 : la ressemblance ────────────────
  it('draws a declared face from the catalogue rather than from the role', () => {
    // A hunter by role, and unmistakably himself: the blond bob, the dark suit
    // and the slim build come out of `appearance.json`, and nothing about them
    // depends on which role the wardrobe filed him under.
    const kurapika = humanProfile(person('kurapika', 'hunter'))
    expect(kurapika).toMatchObject({
      build: 'slim',
      hairStyle: 'bob',
      clothing: 'suit',
      hair: 0xe8c860,
      likeness: 'kurapika',
    })
    expect(kurapika.signatures).toEqual(['chain-right-hand'])
  })

  it('keeps Camilla’s officially coloured blond hair in the tour', () => {
    expect(humanProfile(person('prince-camilla', 'witness'))).toMatchObject({
      hair: 0xe3c67a,
      likeness: 'prince-camilla',
    })
  })

  it('leaves an undeclared body exactly as it was', () => {
    // ADR-005 §5. The hash variation is the whole of what an anonymous guard
    // gets, and it has to keep getting it: the profile below is the one the
    // walk produced before any of this existed.
    const anonymous = humanProfile(person('a-guard-nobody-drew', 'guard'))
    expect(anonymous.likeness).toBe(null)
    expect(anonymous.signatures).toEqual([])
    expect(anonymous.clothing).toBe('uniform')
    expect(anonymous.frame).toBe('adult')
    expect(anonymous.height).not.toBe(1.04)
  })

  it('lets a declaration overrule the costume the role would have put on', () => {
    // The two §2.5 cases: the role says western suit and ritual robe, the
    // catalogue says otherwise, and the catalogue wins. Both were silently
    // wrong before, which is the only kind of wrong worth a rule.
    expect(humanProfile(person('prince-zhanglei', 'steward')).clothing).toBe('changshan')
    expect(humanProfile(person('prince-halkenburg', 'witness')).clothing).toBe('suit')
  })

  it('gives the two who never had one a gabarit of their own', () => {
    expect(humanProfile(person('prince-marayam', 'witness')).frame).toBe('child')
    expect(humanProfile(person('prince-woble', 'witness')).frame).toBe('infant')
  })

  it('makes Morena a projection of her entry rather than a profile in the code', () => {
    // The role and the catalogue id are the same person, reached two ways —
    // the Morena game goes through the role, the walk through the id — and
    // both have to land on the one declaration.
    const byRole = humanProfile(person('morena', 'morena'))
    const byName = humanProfile(person('morena-prudo', 'fighter'))
    expect(byRole).toEqual(byName)
    expect(byRole.likeness).toBe('morena-prudo')
    // Field for field what the hard-coded profile used to hold, which is what
    // makes the migration a capture diff of nothing.
    expect(byRole).toMatchObject({
      build: 'slim',
      height: 1,
      shoulders: 0.96,
      skin: 0xf0dfe2,
      hair: 0xd9b978,
      hairStyle: 'long',
      face: 'narrow',
      expression: 'neutral',
      jacket: 0x181318,
      accent: 0xd9b978,
      clothing: 'gown',
    })
  })

  it('rebuilds the rig when a body stops being anonymous', () => {
    const anonymous = person('a-guard-nobody-drew', 'guard')
    const named = person('kurapika', 'guard')
    expect(humanStateKey(named)).not.toBe(humanStateKey(anonymous))
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
