import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import { transpileModule, ModuleKind } from 'typescript'
import { dataChunks } from './dataChunks'
import { manualChunks } from './manualChunks'
import { bundleBudget } from './bundleBudget'
import { DUEL_COMBO_FIGHTERS, tuneDuelComboProfile } from '../src/lib/fighting/duelComboProfiles'
import { DUEL_COMBO_LESSONS } from '../src/lib/fighting/duelComboLessons'
import type { FighterMoveset } from '../src/lib/fighting/movesetTypes'
import { EASTER_ROSTER_ONE } from '../src/lib/fighting/easterEggRosterOne'
import { EASTER_ROSTER_TWO } from '../src/lib/fighting/easterEggRosterTwo'
import { EASTER_ROSTER_THREE } from '../src/lib/fighting/easterEggRosterThree'
import { EASTER_ROSTER_FOUR } from '../src/lib/fighting/easterEggRosterFour'
import { FIRST_ROSTER_CHOREOGRAPHY } from '../src/lib/fighting/rosterChoreographyFirst'
import { SECOND_ROSTER_CHOREOGRAPHY } from '../src/lib/fighting/rosterChoreographySecond'
import { ROSTER_STANCES } from '../src/lib/fighting/fightStancesRoster'
import { FIGHT_EXPRESSION_PROFILES } from '../src/lib/fighting/fightExpressionProfiles'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

async function compile(entry: string) {
  const directory = await mkdtemp(join(tmpdir(), 'black-whale-bundles-'))
  directories.push(directory)
  await writeFile(join(directory, 'package.json'), '{"type":"module"}')
  await writeFile(join(directory, 'entry.ts'), entry)
  const warnings: string[] = []
  const result = await build({
    configFile: false,
    root: directory,
    plugins: [...dataChunks(), bundleBudget()],
    logLevel: 'silent',
    build: {
      write: false,
      minify: 'esbuild',
      rollupOptions: {
        input: join(directory, 'entry.ts'),
        preserveEntrySignatures: 'strict',
        onwarn: (warning) => warnings.push(warning.message),
        output: { format: 'es', manualChunks },
      },
    },
  })
  if (Array.isArray(result) || !('output' in result)) throw new Error('Expected a single bundle')
  for (const item of result.output) {
    if (item.type === 'chunk') {
      await mkdir(dirname(join(directory, item.fileName)), { recursive: true })
      await writeFile(join(directory, item.fileName), item.code)
    }
  }
  const main = result.output.find((item) => item.type === 'chunk' && item.isEntry)!
  return { result, warnings, directory, main }
}

describe('production bundle partitioning', () => {
  it('separates scene catalogues without changing authored gestures, stances or expressions', async () => {
    const modules = [
      'easterEggRosterOne',
      'easterEggRosterTwo',
      'easterEggRosterThree',
      'easterEggRosterFour',
      'rosterChoreographyFirst',
      'rosterChoreographySecond',
      'fightStancesRoster',
      'fightExpressionProfiles',
    ]
    const built = await compile(
      modules
        .map((name) => `export * from ${JSON.stringify(resolve(`src/lib/fighting/${name}.ts`))}`)
        .join('\n'),
    )
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    const expected = {
      EASTER_ROSTER_ONE,
      EASTER_ROSTER_TWO,
      EASTER_ROSTER_THREE,
      EASTER_ROSTER_FOUR,
      FIRST_ROSTER_CHOREOGRAPHY,
      SECOND_ROSTER_CHOREOGRAPHY,
      ROSTER_STANCES,
      FIGHT_EXPRESSION_PROFILES,
    }
    for (const [name, value] of Object.entries(expected)) expect(actual[name]).toEqual(value)
    expect(
      built.result.output.some(
        (item) => item.type === 'chunk' && item.name === 'clash-presentation-catalogues',
      ),
    ).toBe(true)
    expect(built.warnings).toEqual([])
  })
  it('rejects an oversized JavaScript chunk instead of suppressing its warning', async () => {
    await expect(
      compile(`export const payload = ${JSON.stringify('x'.repeat(510_000))}`),
    ).rejects.toThrow('500 kB JavaScript budget')
  })
  it('preserves the full canonical blueprint, translations and generated ability catalogue', async () => {
    const blueprint = resolve('../../data/ship/blueprint.json')
    const translations = resolve('src/lib/i18n/messages/public-ui.json')
    const presentations = resolve('src/lib/nen/abilityPresentations.gen.ts')
    const originalCode = transpileModule(await readFile(presentations, 'utf8'), {
      compilerOptions: { module: ModuleKind.ESNext },
    }).outputText
    const original = await import(
      /* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(originalCode).toString('base64')}`
    )
    const built = await compile(
      `export { default as blueprint, spaces } from ${JSON.stringify(blueprint)}\nexport { default as translations } from ${JSON.stringify(translations)}\nexport { ABILITY_PRESENTATIONS } from ${JSON.stringify(presentations)}`,
    )
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    expect(actual.blueprint).toEqual(JSON.parse(await readFile(blueprint, 'utf8')))
    expect(actual.spaces).toBe(actual.blueprint.spaces)
    expect(actual.translations).toEqual(JSON.parse(await readFile(translations, 'utf8')))
    expect(actual.ABILITY_PRESENTATIONS).toEqual(original.ABILITY_PRESENTATIONS)
    expect(built.warnings).toEqual([])
    const chunks = built.result.output.filter((item) => item.type === 'chunk')
    expect(chunks.length).toBeGreaterThan(10)
    expect(Math.max(...chunks.map((item) => Buffer.byteLength(item.code)))).toBeLessThan(500_000)
  }, 30_000)

  it('splits existing combo catalogues without changing lessons or forty-fighter tuning', async () => {
    const profiles = resolve('src/lib/fighting/duelComboProfiles.ts')
    const lessons = resolve('src/lib/fighting/duelComboLessons.ts')
    const built = await compile(
      `export * from ${JSON.stringify(profiles)}\nexport { DUEL_COMBO_LESSONS } from ${JSON.stringify(lessons)}`,
    )
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    expect(actual.DUEL_COMBO_FIGHTERS).toEqual(DUEL_COMBO_FIGHTERS)
    expect(actual.DUEL_COMBO_LESSONS).toEqual(DUEL_COMBO_LESSONS)
    for (const fighterId of DUEL_COMBO_FIGHTERS) {
      const moveset = {
        fighterId,
        moves: [{ id: `${fighterId}:standingLight`, slot: 'standingLight', tuning: { active: 3 } }],
      } as FighterMoveset
      expect(actual.tuneDuelComboProfile(moveset)).toEqual(tuneDuelComboProfile(moveset))
    }
    expect(
      built.result.output.some(
        (item) => item.type === 'chunk' && item.name === 'clash-combo-catalogues',
      ),
    ).toBe(true)
    expect(built.warnings).toEqual([])
  })

  it('retains escaped strings, Unicode, nulls, property order and __proto__ as data', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'black-whale-json-'))
    directories.push(directory)
    const value = JSON.parse('{"__proto__":{"safe":true},"records":[]}')
    value.records = Array.from({ length: 4500 }, (_, id) => ({
      id,
      text: 'Écarlate \\ " ${literal} <script>\n',
      empty: null,
      enabled: false,
    }))
    const filename = join(directory, 'records.json')
    await writeFile(filename, JSON.stringify(value))
    const built = await compile(`export { default as records } from ${JSON.stringify(filename)}`)
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    expect(JSON.stringify(actual.records)).toBe(JSON.stringify(value))
    expect(Object.getPrototypeOf(actual.records)).toBe(Object.prototype)
    expect(Object.hasOwn(actual.records, '__proto__')).toBe(true)
    expect(built.warnings).toEqual([])
  })
})
