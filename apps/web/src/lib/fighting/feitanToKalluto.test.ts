import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { bodyMemoryWeak, rememberBodyHit } from './bodyMemory'
import { recordFightInjuries } from './feitanPain'
import { resolvedDamage } from './combatDamage'
import { FIGHT_FPS } from './fightClock'
import {
  absorbSweetHomeRightHand,
  advanceFeitanTerebellumUpgrades,
  feitanBodyMemoryChargeFactor,
  transferSweetHomeLeftHand,
} from './feitanTerebellumUpgrades'
import {
  advanceShizukuHanzoKallutoUpgrades,
  applyBlinkyForcedHemorrhage,
  BLINKY_HEMORRHAGE_AURA_DPS,
  BLINKY_HEMORRHAGE_HP_DPS,
  blinkySpitLastSwallowed,
  blinkySwallowNonNen,
  deployKallutoListeningDoll,
  hanzoDoubleCrossUp,
  hanzoDoubleIgnoresTenPhysical,
  KALLUTO_CONFETTI_CUT_THRESHOLD,
  kallutoDollRevealsOpponent,
  scatterKallutoConfetti,
} from './shizukuHanzoKallutoUpgrades'
import type { FightState } from './types'

describe('5-fighter upgrades: Feitan, Terebellum, Shizuku, Hanzo, Kalluto', () => {
  it('Feitan charges Pain Packer from real damage without an invented limb multiplier', () => {
    const before = beginFight(createFight('feitan', 'hisoka', { mode: 'versus-local' }))
    let weakened = before.player
    for (let i = 0; i < 3; i++)
      weakened = rememberBodyHit(weakened, { zone: 'hands', damage: 10, blocked: false })
    expect(feitanBodyMemoryChargeFactor(weakened)).toBe(1)

    const after = { ...before, player: { ...weakened, health: weakened.health - 10 } }
    const recorded = recordFightInjuries({ ...before, player: weakened }, after)
    expect(recorded.player.hatsuEffects.painPacker?.injuries).toBe(10)

    const sunState = {
      ...before,
      player: {
        ...before.player,
        hatsuEffects: {
          ...before.player.hatsuEffects,
          painPacker: {
            injuries: 30,
            packedDamage: 30,
            armour: true,
            sun: {
              x: before.opponent.x,
              y: 0,
              radius: 20,
              damage: 20,
              age: 0,
              duration: 120,
              scored: [],
            },
          },
        },
      },
    }
    const kenState = advanceFeitanTerebellumUpgrades({
      ...sunState,
      opponent: { ...sunState.opponent, nen: { ...sunState.opponent.nen, ken: true } },
    })
    expect(kenState.opponent.health).toBe(sunState.opponent.health)

    const tenState = advanceFeitanTerebellumUpgrades(sunState)
    expect(tenState.opponent.health).toBe(sunState.opponent.health)

    const zetsuState = advanceFeitanTerebellumUpgrades({
      ...sunState,
      opponent: { ...sunState.opponent, nen: { ...sunState.opponent.nen, mode: 'zetsu' } },
    })
    expect(zetsuState.opponent.health).toBe(sunState.opponent.health)
  })

  it('Terebellum does not use abstract stored damage or direct status transfer', () => {
    const state = beginFight(createFight('terebellum', 'hisoka', { mode: 'versus-local' }))
    let self = absorbSweetHomeRightHand(state.player, 18)
    for (let i = 0; i < 3; i++)
      self = rememberBodyHit(self, { zone: 'hands', damage: 10, blocked: false })
    self = { ...self, haikuBurn: true, openWounds: 1, tskPoisoned: true }

    const transferred = transferSweetHomeLeftHand({ ...state, player: self }, 'player')
    expect(transferred.player.sweetHomeStored).toBeUndefined()
    expect(bodyMemoryWeak(transferred.player, 'hands')).toBe(true)
    expect(bodyMemoryWeak(transferred.opponent, 'hands')).toBe(false)
    expect(transferred.opponent.health).toBe(state.opponent.health)
    expect(transferred.opponent.haikuBurn).toBeUndefined()
    expect(transferred.opponent.openWounds).toBeUndefined()
    expect(transferred.opponent.tskPoisoned).toBeUndefined()

    const expiring = {
      ...state,
      player: { ...state.player, sweetHomeStored: { damage: 15, remainingFrames: 1 } },
    }
    const detonated = advanceFeitanTerebellumUpgrades(expiring)
    expect(detonated.player.health).toBe(state.player.health)
    expect(detonated.player.sweetHomeStored).toEqual({ damage: 15, remainingFrames: 1 })
  })

  it('Shizuku Blinky swallows non-Nen projectiles/confetti, spits them back, and drains blood but not aura', () => {
    let state = beginFight(createFight('shizuku', 'theta', { mode: 'versus-local' }))
    state = {
      ...state,
      projectiles: [
        {
          id: 1,
          owner: 'opponent',
          fighterId: 'theta',
          x: state.player.x + 5,
          y: 4,
          velocityX: -2,
          width: 1,
          height: 1,
          damage: 10,
          knockback: 2,
          hitstun: 10,
          blockstun: 8,
          hitstop: 6,
          targetZone: 'torso',
          shape: 'bullet',
          colour: '#d7d7d7',
          matter: 'object',
          age: 1,
          lifetime: 40,
        },
      ],
      opponent: { ...state.opponent, openWounds: 1, aura: 50 },
    }
    const swallowed = blinkySwallowNonNen(state, 'player')
    expect(swallowed.projectiles).toHaveLength(0)
    expect(swallowed.player.shizukuSwallowed).toBe(1)

    const spat = blinkySpitLastSwallowed(swallowed, 'player')
    expect(spat.projectiles).toHaveLength(1)
    expect(spat.projectiles[0].owner).toBe('player')
    expect(spat.player.shizukuSwallowed).toBeUndefined()

    const bled = applyBlinkyForcedHemorrhage(state, 'player')
    expect(state.opponent.health - bled.opponent.health).toBeCloseTo(
      BLINKY_HEMORRHAGE_HP_DPS / FIGHT_FPS,
      6,
    )
    expect(BLINKY_HEMORRHAGE_AURA_DPS).toBe(0)
    expect(bled.opponent.aura).toBe(state.opponent.aura)
  })

  it('Hanzo astral double ignores Ten physical blows, takes Ren/Ko/Hatsu, and enables cross-up', () => {
    const state = beginFight(createFight('hisoka', 'hanzo', { mode: 'versus-local' }))
    const hanzoDouble = {
      ...state.opponent,
      hanzoProjection: {
        bodyX: 80,
        bodyFacing: -1 as const,
        bodyNen: state.opponent.nen,
        startupFrames: 0,
      },
    }
    const tenAttacker = {
      ...state.player,
      attack: {
        kind: 'light' as const,
        frame: 5,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    expect(hanzoDoubleIgnoresTenPhysical(tenAttacker, hanzoDouble)).toBe(true)
    expect(hanzoDoubleCrossUp(hanzoDouble)).toBe(true)

    const tenDmg = resolvedDamage({
      attacker: tenAttacker,
      defence: {
        fighter: hanzoDouble,
        blocked: false,
        parried: false,
        avoided: false,
        invulnerable: false,
      },
      base: 14,
      zone: 'torso',
      kind: 'light',
      damageScale: 1,
      openingMultiplier: 1,
    })
    expect(tenDmg).toBe(0)

    const renAttacker = { ...tenAttacker, nen: { ...tenAttacker.nen, mode: 'ren' as const } }
    expect(hanzoDoubleIgnoresTenPhysical(renAttacker, hanzoDouble)).toBe(false)
  })

  it('Kalluto floor confetti opens wounds while the listening doll does not reveal aura', () => {
    let state = beginFight(createFight('kalluto', 'hisoka', { mode: 'versus-local' }))
    state = scatterKallutoConfetti(state, 'player')
    state = deployKallutoListeningDoll(state, 'player')
    expect(kallutoDollRevealsOpponent(state, 'player')).toBe(false)

    let running: FightState = {
      ...state,
      opponent: {
        ...state.opponent,
        x: state.kallutoConfetti!.x,
        y: 0,
        motion: {
          velocityX: 0,
          prejumpFrames: 0,
          jumpDirection: 0,
          landingFrames: 0,
          heldDirection: 0,
          tapDirection: 0,
          tapWindow: 0,
          dash: { direction: -1 as const, frame: 0, frames: 6, peak: 6 },
        },
      },
    }
    for (let i = 0; i < KALLUTO_CONFETTI_CUT_THRESHOLD; i++) {
      running = advanceShizukuHanzoKallutoUpgrades(running)
    }
    expect(running.opponent.openWounds).toBe(1)
  })
})
