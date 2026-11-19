import { expect, it } from 'vitest'
import type { FightSide, FightState, FighterId } from '../types'
import type { FightStageId } from '../stages'
import { selectVictory } from './catalogue'

type Options = { target?: FighterId; side?: FightSide; stageId?: FightStageId; hero?: FighterId }
interface Film {
  state?: FightState
  film?: { state: FightState }
  states?: FightState[]
  sources?: number[]
  report: {
    frameCount: number
    victory?: { frameCount?: number }
    continuity: { resets: number; backwards: boolean; healed: boolean }
  }
}
type Builder = (options: Options) => Film
const modules = import.meta.glob<Record<string, Builder>>(
  '../../../../demos/fighting-showcase/*Film.ts',
  { eager: true },
)
const FIXED = new Set([
  'hisokaVictoryFilm',
  'chrolloVictoryFilm',
  'kurapikaVictoryFilm',
  'kurapikaFatalityFilm',
  'feitanFatalityFilm',
  'phinksFatalityFilm',
  'franklinFatalityFilm',
])
const EXTRA = new Set([
  'hisokaFearFilm',
  'kurapikaJudgmentFilm',
  'kurapikaTroupeFilm',
  'personalGuardFilm',
])
interface Demo {
  name: string
  hero: FighterId
  build: Builder
  options: Options
}
const demos: Demo[] = Object.entries(modules).flatMap(([path, exports]) => {
  const name = path.split('/').at(-1)!.replace('.ts', '')
  if (!/(?:Fatality|Victory)Film$/.test(name) && !EXTRA.has(name)) return []
  const build = Object.entries(exports).find(([name]) => /^create.*Film$/.test(name))![1]
  const heroes =
    name === 'personalGuardFilm'
      ? ['longhi', 'furykov']
      : [
          name
            .replace(/(?:Fatality|Victory|Fear|Judgment|Troupe)Film$/, '')
            .replace('chrolloFish', 'chrollo'),
        ]
  return heroes.map((hero) => ({
    name,
    hero: hero as FighterId,
    build,
    options: name === 'personalGuardFilm' ? { hero: hero as FighterId } : {},
  }))
})
const cases = demos.flatMap((demo) => {
  const rows = [{ ...demo, label: 'default' }]
  if (FIXED.has(demo.name)) return rows
  const targets = compatibleTargets(demo)
  for (const [i, target] of targets.entries())
    rows.push({
      ...demo,
      label: ['large P2', 'small P1', 'mirror P2'][i],
      options: {
        ...demo.options,
        target,
        side: i === 1 ? 'player' : 'opponent',
        stageId: (['heavens-arena', 'screening-room', 'whale-hold'] as const)[i],
      },
    })
  return rows
})
function compatibleTargets(demo: Demo): FighterId[] {
  if (demo.name === 'kurapikaTroupeFilm') return ['franklin', 'kalluto', 'machi']
  if (demo.name === 'kurapikaJudgmentFilm') return ['benjamin', 'biscuit', 'kurapika']
  return ['franklin', 'biscuit', demo.hero]
}

it('includes all native victory preparations and their legacy edits', () => {
  expect(demos).toHaveLength(38)
  expect(new Set(demos.map((d) => d.hero)).size).toBe(33)
})
it.each(cases)(
  '$name / $hero / $label prepares a genuine victory',
  ({ name, build, hero, options }) => {
    const film = build(options)
    const state = film.state ?? film.film?.state ?? film.states!.at(-1)!
    const side = options.side ?? (name === 'chrolloVictoryFilm' ? 'opponent' : 'player')
    const loser = side === 'player' ? 'opponent' : 'player'
    expect(state.phase).toBe('finished')
    expect(state.winner).toBe(side)
    expect(state[side].id).toBe(hero)
    if (options.target) expect(state[loser].id).toBe(options.target)
    if (options.stageId) expect(state.environment.stageId).toBe(options.stageId)
    expect(selectVictory(state)).toMatchObject({ fighter: hero, winner: side, loser })
    expect(film.report.victory?.frameCount ?? film.report.frameCount).toBe(600)
    if (film.states) {
      expect(film.states).toHaveLength(film.report.frameCount)
      expect(
        film.states.every((frame) => frame !== undefined && Number.isFinite(frame.frame)),
      ).toBe(true)
    }
    if (film.sources)
      expect(
        film.sources.every(
          (source, i, sources) => source >= 0 && (i === 0 || source >= sources[i - 1]),
        ),
      ).toBe(true)
    expect(film.report.continuity).toEqual({
      resets: 0,
      backwards: false,
      healed: hero === 'camilla',
    })
  },
  120000,
)
