import { describe, expect, it } from 'vitest'
import type { Apparition } from './apparitions'
import { humanStateKey } from './humanFigure'
import { humanProfile, humanProportions, profileFrameShape } from './humanProfiles'
import { mangaLikeness } from './mangaLikeness'

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
      hairStyle: 'shaved',
      clothing: 'ritual',
      skin: 0xe8ddcb,
      hair: 0x171417,
      jacket: 0x243743,
      accent: 0xe8ddcb,
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

  it('keeps the corrected royal siblings visually distinct', () => {
    expect(humanProfile(person('prince-kacho', 'witness'))).toMatchObject({
      hair: 0xe1c36e,
      hairStyle: 'hime',
    })
    expect(humanProfile(person('prince-fugetsu', 'witness'))).toMatchObject({
      hair: 0x231f28,
      hairStyle: 'bob',
    })
    expect(humanProfile(person('prince-tubeppa', 'witness'))).toMatchObject({
      hairStyle: 'bowl',
      hair: 0xe0c477,
      face: 'square',
      jacket: 0x202129,
      signatures: ['glasses-thin', 'earrings'],
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
    expect(humanProportions(anonymous)).toEqual({
      torso: 1,
      limbs: 1,
      hips: 1,
      shoulderSlope: 0,
      posture: 'neutral',
    })
  })

  it('projects only explicitly authored silhouette refinements', () => {
    const benjamin = humanProfile(person('prince-benjamin', 'fighter'))
    const melody = humanProfile(person('melody', 'hunter'))
    expect(humanProportions(benjamin)).toMatchObject({
      torso: 1.04,
      limbs: 0.98,
      hips: 1.06,
      posture: 'upright',
    })
    expect(profileFrameShape(benjamin).neck).toBeCloseTo(1.04)
    expect(profileFrameShape(benjamin).limb).toBeCloseTo(0.98)
    expect(profileFrameShape(melody).limb).toBeCloseTo(0.9)
  })

  it('projects panel-attested face geometry through the shared likeness', () => {
    const benjamin = humanProfile(person('prince-benjamin', 'fighter'))
    const melody = humanProfile(person('melody', 'hunter'))
    expect(benjamin.faceFeatures).toMatchObject({
      eyes: 'narrow',
      cheek: 0.183,
      jaw: 0.163,
      nose: 1.8,
    })
    expect(mangaLikeness(benjamin)).toMatchObject({ cheek: 0.183, jaw: 0.163, nose: 1.8 })
    expect(mangaLikeness(melody)).toMatchObject({ eyes: 'narrow', neck: 0.055 })
  })

  it('projects the Phantom Troupe face batch from the catalogue', () => {
    const expected = {
      'chrollo-lucilfer': { eyes: 'round', cheek: 0.145, jaw: 0.074 },
      'feitan-portor': { eyes: 'narrow', cheek: 0.139, jaw: 0.058 },
      'machi-komacine': { eyes: 'almond', cheek: 0.145, jaw: 0.06 },
      'phinks-magcub': { eyes: 'narrow', jaw: 0.142, brow: 0.08 },
      illumi: { eyes: 'doll', cheek: 0.139, mouth: 0.033 },
      'nobunaga-hazama': { eyes: 'narrow', jaw: 0.095, nose: 1.67 },
    } as const
    for (const [id, face] of Object.entries(expected)) {
      const profile = humanProfile(person(id, 'fighter'))
      expect(profile.faceFeatures, id).toMatchObject(face)
      expect(mangaLikeness(profile), id).toMatchObject(face)
    }
  })

  it('projects the royal face batch without collapsing Kacho and Fugetsu', () => {
    const expected = {
      'queen-oito': { eyes: 'almond', cheek: 0.15, jaw: 0.065 },
      'prince-camilla': { eyes: 'almond', cheek: 0.146, jaw: 0.06 },
      'prince-kacho': { eyes: 'round', cheek: 0.15, jaw: 0.065 },
      'prince-fugetsu': { eyes: 'round', cheek: 0.15, jaw: 0.065 },
      'prince-momoze': { eyes: 'doll', cheek: 0.144, jaw: 0.061 },
      'prince-halkenburg': { eyes: 'narrow', cheek: 0.148, jaw: 0.087 },
    } as const
    for (const [id, face] of Object.entries(expected)) {
      const profile = humanProfile(person(id, 'witness'))
      expect(profile.faceFeatures, id).toMatchObject(face)
      expect(mangaLikeness(profile), id).toMatchObject(face)
    }
    const kacho = humanProfile(person('prince-kacho', 'witness'))
    const fugetsu = humanProfile(person('prince-fugetsu', 'witness'))
    expect(kacho.faceFeatures).toEqual(fugetsu.faceFeatures)
    expect([kacho.hairStyle, kacho.hair]).not.toEqual([fugetsu.hairStyle, fugetsu.hair])
  })

  it('projects the second royal batch, including authored head height', () => {
    const expected = {
      'prince-zhanglei': { eyes: 'heavy', jaw: 0.16, headY: 1.69 },
      'prince-marayam': { eyes: 'round', cheek: 0.198, headY: 1.73 },
      'prince-tubeppa': { eyes: 'narrow', nose: 1.65, mouth: 0.086 },
      'prince-salesale': { eyes: 'narrow', cheek: 0.19, mouth: 0.172 },
      'prince-luzurus': { eyes: 'almond', jaw: 0.115, nose: 1.65 },
      'nasubi-hui-guo-rou': { eyes: 'narrow', cheek: 0.19, neck: 0.09 },
    } as const
    for (const [id, face] of Object.entries(expected)) {
      const profile = humanProfile(person(id, 'witness'))
      expect(profile.faceFeatures, id).toMatchObject(face)
      expect(mangaLikeness(profile), id).toMatchObject(face)
    }
  })

  it('projects the Hunter and Zodiac face batch from the catalogue', () => {
    const expected = {
      tokarine: { eyes: 'round', cheek: 0.195, mouth: 0.082 },
      'sanbica-norton': { eyes: 'doll', cheek: 0.157, nose: 0.75 },
      'mizaistom-nana': { eyes: 'heavy', jaw: 0.145, nose: 1.35 },
      'cheadle-yorkshire': { eyes: 'round', cheek: 0.153, jaw: 0.08 },
      gel: { eyes: 'doll', cheek: 0.144, jaw: 0.059 },
      cluck: { eyes: 'almond', cheek: 0.147, chin: 0.215 },
    } as const
    for (const [id, face] of Object.entries(expected)) {
      const profile = humanProfile(person(id, 'hunter'))
      expect(profile.faceFeatures, id).toMatchObject(face)
      expect(mangaLikeness(profile), id).toMatchObject(face)
    }
  })

  it('projects the expedition Hunter face batch from the catalogue', () => {
    const expected = {
      'leorio-paradinight': { eyes: 'narrow', jaw: 0.103, nose: 1.55 },
      'beyond-netero': { eyes: 'narrow', cheek: 0.17, neck: 0.075 },
      saiyu: { eyes: 'heavy', cheek: 0.151, chin: 0.236 },
      'botobai-gigante': { eyes: 'heavy', jaw: 0.15, neck: 0.088 },
      ginta: { eyes: 'heavy', cheek: 0.19, neck: 0.1 },
      'saccho-kobayakawa': { eyes: 'narrow', chin: 0.255, nose: 1.7 },
    } as const
    for (const [id, face] of Object.entries(expected)) {
      const profile = humanProfile(person(id, 'hunter'))
      expect(profile.faceFeatures, id).toMatchObject(face)
      expect(mangaLikeness(profile), id).toMatchObject(face)
    }
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
    // The catalogue remains the single source of truth, including the dark-blue
    // hair established by chapter 401's colour page.
    expect(byRole).toMatchObject({
      build: 'slim',
      height: 1,
      shoulders: 0.96,
      skin: 0xf0dfe2,
      hair: 0x1d2d49,
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

  it('rebuilds only when an Arena fighter changes visible expression', () => {
    const neutral = person('hisoka', 'fighter')
    neutral.kind = 'combatant'
    const hostile = { ...neutral, human: { ...neutral.human!, expression: 'hostile' as const } }
    expect(humanStateKey(hostile)).not.toBe(humanStateKey(neutral))
  })
})
