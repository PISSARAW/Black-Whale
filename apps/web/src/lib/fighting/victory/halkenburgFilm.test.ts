import { expect, it } from 'vitest'
import { createHalkenburgFatalityFilm } from '../../../../demos/fighting-showcase/halkenburgFatalityFilm'
import { COHORT_WILL_FRAMES } from '../preparationTuning'
import { selectVictory } from './catalogue'

it.each([
  { target: 'hisoka', side: 'player', stageId: 'halkenburg-salon' },
  { target: 'franklin', side: 'opponent', stageId: 'heavens-arena' },
  { target: 'biscuit', side: 'player', stageId: 'screening-room' },
  { target: 'halkenburg', side: 'opponent', stageId: 'whale-hold' },
] as const)(
  'prepares shared will and earns a physical victory against $target on $side',
  (options) => {
    const film = createHalkenburgFatalityFilm(options)
    const side = options.side,
      loser = side === 'player' ? 'opponent' : 'player'
    expect(film.state.winner).toBe(side)
    expect(film.state[side].id).toBe('halkenburg')
    expect(film.state[loser].id).toBe(options.target)
    expect(film.state[loser].health).toBe(0)
    expect(film.report.consentingSupporters).toBe(3)
    expect(film.report.cohortWillFrames).toBe(COHORT_WILL_FRAMES)
    expect(film.report.nativeFrameCount).toBeGreaterThan(COHORT_WILL_FRAMES)
    expect(film.report.nativeFinalMove).toBe('halkenburg:standingHeavy')
    expect(film.state[side].health).toBe(film.state[side].maxHealth)
    expect(film.state[side].halkenburgSupporter).toBeUndefined()
    expect(film.report.chosenSupporter).toBeUndefined()
    expect(film.report.possessionFrames).toBe(0)
    expect(film.state[loser].hatsuEffects.possessedFrames).toBe(0)
    expect(film.state.halkSoulLinks).toBeUndefined()
    expect(film.state.rosterGuests).toBeUndefined()
    expect(selectVictory(film.state)).toMatchObject({ fighter: 'halkenburg', winner: side, loser })
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
