import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import editorial from '$lib/server/public-content.json'
import ui from './messages/public-ui.json'
import { textKey } from './publicTextPatterns'

const fields = new Set([
  'description',
  'summary',
  'biography',
  'abilitiesAndPowers',
  'overview',
  'combatProficiency',
  'reading',
  'desire',
  'poem',
  'horizon',
  'rules',
  'waterDivination',
])
const tables = [editorial.en, editorial.fr, ui.en, ui.fr] as Record<string, string>[]
const covered = (text: string) => tables.some((table) => Object.hasOwn(table, textKey(text)))

function missingTexts(value: unknown, key = ''): string[] {
  if (typeof value === 'string') {
    return fields.has(key) && /[A-Za-zÀ-ÿ]{2}/.test(value) && !covered(value) ? [value] : []
  }
  if (Array.isArray(value)) return value.flatMap((item) => missingTexts(item, key))
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([field, item]) => missingTexts(item, field))
}

describe('public editorial translation coverage', () => {
  for (const file of [
    'characters/characters',
    'chapters/chapters',
    'events/events',
    'abilities/abilities',
    'locations/locations',
    'factions/factions',
    'objects/objects',
    'prophecies/prophecies',
  ]) {
    it(`covers the public prose in ${file}`, () => {
      const source = JSON.parse(readFileSync(resolve('../../data', `${file}.json`), 'utf8'))
      expect(missingTexts(source)).toEqual([])
    })
  }

  it('contains no untranslated processing markers or missing dynamic arguments', () => {
    for (const table of tables) {
      for (const [source, target] of Object.entries(table)) {
        expect(target, source).not.toMatch(/ZQTERM|ZX\d{6}ZX/)
        expect((target.match(/ZXARG\d+ZX/g) ?? []).sort(), source).toEqual(
          (source.match(/ZXARG\d+ZX/g) ?? []).sort(),
        )
      }
    }
  })
})
