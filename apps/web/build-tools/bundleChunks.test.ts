import { NEN_CANON } from '../src/lib/fighting/nenCanon'
import { BENJAMIN_CANON } from '../src/lib/fighting/benjaminCanon'
import { CHROLLO_CANON } from '../src/lib/fighting/chrolloCanon'
import { BIOHAZARD_CANON } from '../src/lib/fighting/biohazardCanon'
import { BONOLENOV_CANON } from '../src/lib/fighting/bonolenovCanon'
import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
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
        // These fixtures deliberately import only part of the catalogue; tree-shaken
        // manual groups may be empty. Keep every actionable bundling warning.
        onwarn: (warning) => {
          if (warning.code !== 'EMPTY_BUNDLE') warnings.push(warning.message)
        },
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
  it('initializes Cross Game and movesets regardless of which shared chunk loads first', async () => {
    const built = await compile(
      [
        `export { crossGameCanWarn } from ${JSON.stringify(resolve('src/lib/fighting/crossGame.ts'))}`,
        `export { movesetFor } from ${JSON.stringify(resolve('src/lib/fighting/movesets.ts'))}`,
      ].join('\n'),
    )
    for (const chunk of built.result.output.filter((item) => item.type === 'chunk')) {
      const url = pathToFileURL(join(built.directory, chunk.fileName)).href
      await promisify(execFile)(process.execPath, [
        '--input-type=module',
        '-e',
        `await import(${JSON.stringify(url)})`,
      ])
    }
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    const warning = actual
      .movesetFor('mizaistom')
      .moves.find((move: { slot: string }) => move.slot === 'neutralSpecial')
    expect(warning.auraCost).toBe(40)
    expect(warning.tuning.startup).toBe(18)
    expect(actual.crossGameCanWarn).toBeTypeOf('function')
  }, 30_000)

  it('loads the split paper moveset with the real combat engine and finite material emission', async () => {
    const built = await compile(
      [
        `export { beginFight, createFight } from ${JSON.stringify(resolve('src/lib/fighting/engine.ts'))}`,
        `export { launchKallutoPaper } from ${JSON.stringify(resolve('src/lib/fighting/kallutoFlight.ts'))}`,
        `export { performArsenalCommand } from ${JSON.stringify(resolve('src/lib/fighting/retrospectiveArsenal.ts'))}`,
      ].join('\n'),
    )
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    const state = actual.beginFight(
      actual.createFight('kalluto', 'hisoka', { mode: 'versus-local' }),
    )
    const dispersed = actual.launchKallutoPaper(state, 'player', 'plant')
    expect(dispersed.projectiles).toHaveLength(3)
    expect(dispersed.player.paperKit.markers).toBe(state.player.paperKit.markers - 1)
    expect(dispersed.player.id).toBe('kalluto')
    const paper = dispersed.battlefield.entities.find(
      (entry: { paperScatter?: unknown }) => entry.paperScatter,
    )
    const gathered = actual.performArsenalCommand(dispersed, 'player', {
      action: 'paper-kit-gather',
      target: paper.id,
    })
    expect(gathered.player.paperKit.confetti).toHaveLength(1)
    expect(gathered.player.paperKit.confetti[0].id).toBe(paper.id)
  }, 30_000)
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

  it('preserves all Nen conditions when their inert catalogue is loaded in a separate chunk', async () => {
    const canon = resolve('src/lib/fighting/nenCanon.ts')
    const built = await compile(`export { NEN_CANON } from ${JSON.stringify(canon)}`)
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    expect(actual.NEN_CANON).toEqual(NEN_CANON)
    expect(
      built.result.output.some((item) => item.type === 'chunk' && item.name === 'clash-nen-canon'),
    ).toBe(true)
    expect(built.warnings).toEqual([])
  })

  it('loads specialized inert Nen contracts without a runtime import cycle', async () => {
    const names = ['benjamin', 'chrollo', 'biohazard', 'bonolenov']
    const built = await compile(
      names
        .map(
          (name) => `export * from ${JSON.stringify(resolve(`src/lib/fighting/${name}Canon.ts`))}`,
        )
        .join('\n'),
    )
    const actual = await import(
      /* @vite-ignore */ pathToFileURL(join(built.directory, built.main.fileName)).href
    )
    for (const [name, value] of Object.entries({
      BENJAMIN_CANON,
      CHROLLO_CANON,
      BIOHAZARD_CANON,
      BONOLENOV_CANON,
    }))
      expect(actual[name]).toEqual(value)
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
