import { expect, it } from 'vitest'
import { createChrolloFishFatalityFilm } from '../../../../demos/fighting-showcase/chrolloFishFatalityFilm'

it('requires a real Sun and Moon knockout before the ten-second fish fatality', () => {
  const film = createChrolloFishFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBe(0)
  expect(film.report.sunApplied).toBe(true)
  expect(film.report.victory.bookClosedFrame).toBe(film.report.victory.collisionFrame)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
