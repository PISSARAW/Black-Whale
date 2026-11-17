import { expect, it } from 'vitest'
import { createBillFatalityFilm } from '../../../../demos/fighting-showcase/billFatalityFilm'
it.each(['player', 'opponent'] as const)(
  'germinates a real seed harmlessly before %s earns a physical knockout',
  (side) => {
    const film = createBillFatalityFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.realSeed).toBe(true)
    expect(film.report.grew).toBe(true)
    expect(film.report.harmlessGrowth).toBe(true)
    expect(film.report.physicalKnockout).toBe(true)
    expect(film.report.nativeCombos.map((combo) => combo.id)).toEqual([
      'bill:economy',
      'bill:precision',
      'bill:growth',
    ])
    expect(film.report.nativeHits.map((hit) => hit.comboHits)).toEqual([
      1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 4, 5,
    ])
    expect(film.report.maxCombo[side]).toBeGreaterThanOrEqual(5)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
