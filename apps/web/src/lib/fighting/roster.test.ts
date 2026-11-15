import { describe, expect, it } from 'vitest'
import appearanceFile from '../../../../../data/characters/appearance.json'
import { FIGHTING_ROSTER } from './roster'

describe('fighting roster models', () => {
  it('uses likenesses already declared for the shared character rig', () => {
    const declared = new Set(appearanceFile.declared.map((appearance) => appearance.id))
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
    ])
    expect(FIGHTING_ROSTER.every((fighter) => declared.has(fighter.modelId))).toBe(true)
  })
})
