import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { accelHeatView } from './accelHeatPresentation'

const fight = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))

describe('relance heat in the HUD', () => {
  it('is shown only for fighters with the relance', () => {
    expect(accelHeatView(fight.player, 'fr')).not.toBeNull()
    expect(accelHeatView(fight.opponent, 'fr')).toBeNull()
  })

  it('reads ready, warm and overheated', () => {
    const kurapika = fight.player
    expect(accelHeatView(kurapika, 'fr')).toEqual({
      percent: 0,
      phase: 'ready',
      label: 'REN · RELANCE PRÊTE',
    })
    const warm = { ...kurapika, accelHeat: { heat: 37.25, overheated: false } }
    expect(accelHeatView(warm, 'en')).toEqual({ percent: 37, phase: 'warm', label: 'REN · WARM' })
    const hot = { ...kurapika, accelHeat: { heat: 100, overheated: true } }
    expect(accelHeatView(hot, 'fr')?.phase).toBe('overheated')
    expect(accelHeatView(hot, 'fr')?.label).toBe('REN · SURCHAUFFE')
  })
})
