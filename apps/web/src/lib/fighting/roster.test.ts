import { describe, expect, it } from 'vitest'
import appearanceFile from '../../../../../data/characters/appearance.json'
import characters from '../../../../../data/characters/characters.json'
import { FIGHTING_ROSTER } from './roster'

describe('fighting roster models', () => {
  it('uses catalogued identities and declared likenesses when available', () => {
    const declared = new Set(appearanceFile.declared.map((appearance) => appearance.id))
    const catalogued = new Set(characters.map((character) => character.id))
    expect(FIGHTING_ROSTER.map((fighter) => fighter.modelId)).toEqual([
      'kurapika',
      'hisoka',
      'chrollo-lucilfer',
      'morena-prudo',
      'prince-benjamin',
      'prince-tserriednich',
      'feitan-portor',
      'saiyu',
      'theta',
      'biscuit-krueger',
      'prince-marayam',
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
      'prince-fugetsu',
      'prince-kacho',
      'prince-luzurus',
      'prince-momoze',
      'prince-salesale',
      'prince-zhanglei',
      'gidal',
      'longhi',
      'musse',
      'padaille',
      'prince-tubeppa',
      'prince-tyson',
      'sayird',
      'silent-majority-user',
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
})
