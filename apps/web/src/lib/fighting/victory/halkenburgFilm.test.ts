import { expect, it } from 'vitest'
import { createHalkenburgFatalityFilm } from '../../../../demos/fighting-showcase/halkenburgFatalityFilm'
it('requires a real consenting cohort, charged arrow and possession before the victory scene', () => {
  const film = createHalkenburgFatalityFilm()
  expect(film.state.winner).toBe('player')
  expect(film.state.opponent.health).toBeGreaterThan(0)
  expect(film.state.finishReason).toBe('time')
  expect(film.report.consentingSupporters).toBe(3)
  expect(film.report.chosenSupporter).toMatch(/^player:supporter:/)
  expect(film.report.possessionFrames).toBeGreaterThan(0)
  expect(film.state.player.health).toBe(292)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
