import { expect, it } from 'vitest'
import { createCamillaFatalityFilm } from '../../../../demos/fighting-showcase/camillaFatalityFilm'
it('keeps the real Cat’s Name death, consumption and resurrection before the victory edit', () => {
  const film = createCamillaFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.state.player.health).toBe(film.state.player.maxHealth)
  expect(film.report.postMortemFrames).toBeGreaterThan(0)
  expect(film.report.consumed).toBe('opponent')
  expect(film.state.catsNameFatality).toEqual({
    victimSide: 'player',
    killerSide: 'opponent',
    zetsu: true,
    cause: 'projectile',
  })
  expect(film.report.victory).toMatchObject({ revealFrame: 120, tailChargedFrame: 378 })
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: true })
})
