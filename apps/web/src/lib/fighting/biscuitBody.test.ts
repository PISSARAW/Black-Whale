import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import {
  BISCUIT_NATURAL_CHOREOGRAPHY,
  BISCUIT_NATURAL_STANCE,
  fighterMotionStyle,
  fighterStance,
} from './biscuitBody'
import { fightStance } from './fightStance'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import { ROSTER_CHOREOGRAPHY } from './rosterChoreography'
import { strikeSilhouette } from './fightStrikeSilhouette'
import { performCookie } from './cookie'
import type { FightState } from './types'

const ready = (): FightState =>
  beginFight(createFight('biscuit', 'hisoka', { mode: 'versus-local' }))
const revealed = (state: FightState): FightState =>
  performMove({ state, side: 'player', action: 'special' })

describe('Biscuit’s two bodies fight with two plans', () => {
  it('keeps the compact choreography until she voluntarily reveals her natural body', () => {
    const state = ready()
    expect(fighterStance(state.player)).toBe(fightStance('biscuit'))
    expect(fighterMotionStyle(state.player)).toBe(ROSTER_CHOREOGRAPHY.biscuit)
    const natural = revealed(state)
    expect(fighterStance(natural.player)).toBe(BISCUIT_NATURAL_STANCE)
    expect(fighterMotionStyle(natural.player)).toBe(BISCUIT_NATURAL_CHOREOGRAPHY)
    expect(natural.player.aura).toBe(state.player.aura)
  })

  it('never lends the natural body’s plan to another fighter', () => {
    const state = ready()
    const posing = { ...state.opponent, biscuitTrueForm: true }
    expect(fighterStance(posing)).toBe(fightStance('hisoka'))
    expect(fighterMotionStyle(posing)).toBe(ROSTER_CHOREOGRAPHY.hisoka)
  })

  it('gives the natural body a taller frame and heavier strikes', () => {
    const compact = ready().player
    const natural = revealed(ready()).player
    expect(fightPhysicalProfile(natural).height).toBeGreaterThan(
      fightPhysicalProfile(compact).height,
    )
    expect(BISCUIT_NATURAL_CHOREOGRAPHY.amplitude).toBeGreaterThan(
      ROSTER_CHOREOGRAPHY.biscuit.amplitude,
    )
    const timing = { frame: 4, frames: { startup: 8, active: 3, recovery: 12 } }
    const swing = (state: FightState) =>
      JSON.stringify(
        strikeSilhouette(performMove({ state, side: 'player', action: 'heavy' }).player, timing),
      )
    const compactSwing = swing(ready()),
      naturalSwing = swing(revealed(ready()))
    expect(compactSwing).not.toBe('{}')
    expect(naturalSwing).not.toBe(compactSwing)
  })

  it('Cookie treats fatigue in either body without healing health or changing form', () => {
    const natural = revealed(ready())
    const hurt = { ...natural, player: { ...natural.player, health: 40, aura: 50 } }
    const treated = performCookie(hurt, 'player', { action: 'cookie-massage', target: 'player' })
    expect(treated.player.cookie?.mode).toBe('massage')
    expect(treated.player.health).toBe(40)
    expect(treated.player.biscuitTrueForm).toBe(true)
  })
})
