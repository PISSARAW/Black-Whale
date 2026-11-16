import { describe, expect, it } from 'vitest'
import appearanceFile from '../../../../../data/characters/appearance.json'
import characters from '../../../../../data/characters/characters.json'
import { FIGHTING_ROSTER } from './roster'

const PASSIVE_GUARDIAN_USERS = [
  'prince-marayam',
  'prince-fugetsu',
  'prince-kacho',
  'prince-luzurus',
  'prince-momoze',
  'prince-salesale',
  'prince-zhanglei',
  'prince-tubeppa',
  'prince-tyson',
] as const

const NON_DUEL_HATSU_USERS = ['morena-prudo', 'gidal'] as const

describe('fighting roster models', () => {
  it('uses catalogued identities and declared likenesses when available', () => {
    const declared = new Set(appearanceFile.declared.map((appearance) => appearance.id))
    const catalogued = new Set(characters.map((character) => character.id))
    expect(FIGHTING_ROSTER.map((fighter) => fighter.modelId)).toEqual([
      'kurapika',
      'hisoka',
      'chrollo-lucilfer',
      'prince-benjamin',
      'prince-tserriednich',
      'feitan-portor',
      'saiyu',
      'theta',
      'biscuit-krueger',
      'phinks-magcub',
      'franklin-bordeau',
      'machi-komacine',
      'illumi',
      'kalluto-zoldyck',
      'bonolenov-ndongo',
      'shizuku-murasaki',
      'hinrigh-biganduffno',
      'mizaistom-nana',
      'leorio-paradinight',
      'hanzo',
      'rihan',
      'zakuro-custard',
      'melody',
      'basho',
      'prince-camilla',
      'prince-halkenburg',
      'gel',
      'lynch-fullbokko',
      'luini',
      'bill',
      'furykov',
      'cluck',
      'beyond-netero',
      'longhi',
      'musse',
      'padaille',
      'sayird',
      'terebellum',
      'voconte',
      'yokotani',
    ])
    expect(
      FIGHTING_ROSTER.every(
        (fighter) => declared.has(fighter.modelId) || catalogued.has(fighter.modelId),
      ),
    ).toBe(true)
  })

  it('excludes characters without a field-usable personal combat asset', () => {
    const rosterIds = new Set(FIGHTING_ROSTER.map((fighter) => fighter.modelId))
    const exclusions = [...PASSIVE_GUARDIAN_USERS, ...NON_DUEL_HATSU_USERS]

    expect(FIGHTING_ROSTER).toHaveLength(40)
    expect(exclusions.every((modelId) => !rosterIds.has(modelId))).toBe(true)
  })
})
