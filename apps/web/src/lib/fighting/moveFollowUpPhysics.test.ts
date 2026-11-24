import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { moveById } from './movesets'
import { crossesBody } from './signatureCrossing'
import { launchesTarget } from './impactAdmission'
import { followUpPhysicsFor } from './moveFollowUpPhysics'
import { EMPTY_INPUT } from './types'

describe('physical tuning of priority contextual follow-ups', () => {
  it('applies authored guard and frame tuning overrides to priority follow-ups', () => {
    const stairway = moveById('feitan:pain-stairway')!
    const rain = moveById('feitan:execution-rain')!
    const shadowless = moveById('feitan:shadowless-blade')!
    const puppet = moveById('machi:broken-puppet')!
    const leap = moveById('saiyu:pilgrim-leap')!

    expect(stairway.tuning.startup).toBe(7)
    expect(rain.guard).toBe('overhead')
    expect(shadowless.guard).toBe('low')
    expect(shadowless.tuning.targetZone).toBe('feet')
    expect(puppet.tuning.lunge).toBeLessThan(0)
    expect(leap.guard).toBe('overhead')
  })

  it('lifts Feitan and launches the opponent into the air on Escalier de la douleur', () => {
    let state = beginFight(createFight('feitan', 'hisoka', { mode: 'training' }))
    state = {
      ...state,
      player: {
        ...state.player,
        x: 44,
        attack: {
          moveId: 'feitan:forwardLight',
          kind: 'light',
          frame: 6,
          impacted: true,
          confirmedHit: true,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          reversal: false,
        },
      },
      opponent: { ...state.opponent, x: 50 },
    }
    const launched = performMove({ state, side: 'player', action: 'heavy', input: EMPTY_INPUT })
    expect(launched.player.attack?.moveId).toBe('feitan:pain-stairway')
    expect(launched.player.y).toBeGreaterThan(0)
    expect(launched.player.velocityY).toBe(
      followUpPhysicsFor('feitan:pain-stairway')!.selfLiftVelocityY,
    )
    expect(launchesTarget(launched.player, launched.opponent)).toBe(true)

    let next = launched
    for (let i = 0; i < 15; i++)
      next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(next.opponent.y).toBeGreaterThan(0)
    expect(next.opponent.health).toBeLessThan(state.opponent.health)
  })

  it('lets Lame sans ombre and Bond du pèlerin cross pushboxes without granting invulnerability', () => {
    const state = beginFight(createFight('feitan', 'hisoka', { mode: 'training' }))
    const crossing = {
      ...state.player,
      attack: {
        moveId: 'feitan:shadowless-blade',
        kind: 'heavy' as const,
        frame: 4,
        impacted: false,
        confirmedHit: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    expect(crossesBody(crossing)).toBe(true)
    expect(crossing.wakeupInvulnerableFrames).toBe(0)
    expect(moveById('feitan:shadowless-blade')!.reversalInvulnerableFrames).toBe(0)

    const saiyuState = beginFight(createFight('saiyu', 'chrollo', { mode: 'training' }))
    const leaping = {
      ...saiyuState.player,
      attack: { ...crossing.attack, moveId: 'saiyu:pilgrim-leap' },
    }
    expect(crossesBody(leaping)).toBe(true)
  })
})
