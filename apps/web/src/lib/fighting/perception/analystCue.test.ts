import { describe, expect, it } from 'vitest'
import { createFightState } from '../fightState'
import { FURYKOV_TIER_1 } from '../furykovProfile'
import { SENSE_BITS } from '../saiyuSenses'
import { activeAnalystCue } from './analystCue'

describe('activeAnalystCue', () => {
  it('returns null when no Level 2 perception source is active', () => {
    const state = createFightState('kurapika', 'hisoka')
    expect(activeAnalystCue(state, 'player', 'fr')).toBeNull()
  })

  it('identifies Gyo, Sonar, Furykov, and Melody hearing', () => {
    const gyoState = createFightState('kurapika', 'hisoka')
    gyoState.player.nen.gyo = true
    expect(activeAnalystCue(gyoState, 'player', 'fr')).toEqual({
      id: 'gyo',
      label: 'GYO · LECTURE',
    })

    const sonarState = createFightState('leorio', 'hisoka')
    sonarState.opponent.sonarRevealFrames = 60
    expect(activeAnalystCue(sonarState, 'player', 'en')).toEqual({
      id: 'sonar',
      label: 'SONAR · ACTIVE',
    })

    const furykovState = createFightState('furykov', 'hisoka')
    furykovState.player.furykovGauge = FURYKOV_TIER_1
    expect(activeAnalystCue(furykovState, 'player', 'fr')).toEqual({
      id: 'furykov',
      label: 'ANALYSE · FURYKOV',
    })

    const melodyState = createFightState('melody', 'hisoka')
    melodyState.player.hatsuEffects.senseSeals = SENSE_BITS.sight
    // Melody still perceives via hearing even when blinded by Mizaru
    expect(activeAnalystCue(melodyState, 'player', 'fr')).toEqual({
      id: 'melody',
      label: 'OUÏE · MELODY',
    })
  })
})
