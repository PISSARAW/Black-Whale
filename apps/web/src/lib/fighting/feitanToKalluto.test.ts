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
  RISING_SUN_THERMAL_DPS,
  RISING_SUN_ZETSU_THERMAL_DPS,
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

describe('5-fighter upgrades: Feitan, Terebellum, Shizuku, Hanzo, Kalluto', () => {
  it('Feitan doubles Pain Packer charge per Body Memory limb and Rising Sun burns non-Ken targets (lethal in Zetsu)', () => {
    const before = beginFight(createFight('feitan', 'hisoka', { mode: 'versus-local' }))
    let weakened = before.player
    for (let i = 0; i < 3; i++) weakened = rememberBodyHit(weakened, 'hands', 10, false)
    expect(feitanBodyMemoryChargeFactor(weakened)).toBe(2)

    const after = { ...before, player: { ...weakened, health: weakened.health - 10 } }
    const recorded = recordFightInjuries({ ...before, player: weakened }, after)
    expect(recorded.player.hatsuEffects.painPacker?.injuries).toBe(20)

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
            sun: { x: before.opponent.x, y: 0, radius: 20, damage: 20, age: 0, duration: 120, scored: [] },
          },
        },
      },
    }
    const kenSafe = advanceFeitanTerebellumUpgrades({
      ...sunState,
      opponent: { ...sunState.opponent, nen: { ...sunState.opponent.nen, ken: true } },
    })
    expect(kenSafe.opponent.health).toBe(sunState.opponent.health)

    const burnedTen = advanceFeitanTerebellumUpgrades(sunState)
    expect(sunState.opponent.health - burnedTen.opponent.health).toBeCloseTo(
      RISING_SUN_THERMAL_DPS / FIGHT_FPS,
      6,
    )

    const burnedZetsu = advanceFeitanTerebellumUpgrades({
      ...sunState,
      opponent: { ...sunState.opponent, nen: { ...sunState.opponent.nen, mode: 'zetsu' } },
    })
    expect(sunState.opponent.health - burnedZetsu.opponent.health).toBeCloseTo(
      RISING_SUN_ZETSU_THERMAL_DPS / FIGHT_FPS,
      6,
    )
  })

  it('Terebellum Sweet Home transfers stored damage, Body Memory, and systemic statuses (or self-detonates after 4s)', () => {
    let state = beginFight(createFight('terebellum', 'hisoka', { mode: 'versus-local' }))
    let self = absorbSweetHomeRightHand(state.player, 18)
    for (let i = 0; i < 3; i++) self = rememberBodyHit(self, 'hands', 10, false)
    self = { ...self, haikuBurn: true, openWounds: 1, tskPoisoned: true }

    const transferred = transferSweetHomeLeftHand({ ...state, player: self }, 'player')
    expect(transferred.player.sweetHomeStored).toBeUndefined()
    expect(bodyMemoryWeak(transferred.player, 'hands')).toBe(false)
    expect(bodyMemoryWeak(transferred.opponent, 'hands')).toBe(true)
    expect(transferred.opponent.health).toBe(state.opponent.health - 18)
    expect(transferred.opponent.haikuBurn).toBe(true)
    expect(transferred.opponent.openWounds).toBe(1)
    expect(transferred.opponent.tskPoisoned).toBe(true)

    const expiring = {
      ...state,
      player: { ...state.player, sweetHomeStored: { damage: 15, remainingFrames: 1 } },
    }
    const detonated = advanceFeitanTerebellumUpgrades(expiring)
    expect(detonated.player.health).toBe(state.player.health - 15)
    expect(detonated.player.sweetHomeStored).toBeUndefined()
  })

  it('Shizuku Blinky swallows non-Nen projectiles/confetti, spits them back, and drains HP + aura on open wounds', () => {
    let state = beginFight(createFight('shizuku', 'theta', { mode: 'versus-local' }))
    state = {
      ...state,
      projectiles: [
        {
          id: 'theta:bullet:1',
          owner: 'opponent',
          x: state.player.x + 5,
          y: 4,
          vx: -2,
          vy: 0,
          radius: 1,
          damage: 10,
          knockback: 2,
          hitstun: 10,
          blockstun: 8,
          age: 1,
          lifetime: 40,
          physical: true,
        },
      ],
      opponent: { ...state.opponent, openWounds: 1, aura: 50 },
    }
    const swallowed = blinkySwallowNonNen(state, 'player')
    expect(swallowed.projectiles).toHaveLength(0)
    expect(swallowed.player.shizukuSwallowed).toBe('theta:bullet:1')

    const spat = blinkySpitLastSwallowed(swallowed, 'player')
    expect(spat.projectiles).toHaveLength(1)
    expect(spat.projectiles[0].owner).toBe('player')
    expect(spat.player.shizukuSwallowed).toBeUndefined()

    const bled = applyBlinkyForcedHemorrhage(state, 'player')
    expect(state.opponent.health - bled.opponent.health).toBeCloseTo(BLINKY_HEMORRHAGE_HP_DPS / FIGHT_FPS, 6)
    expect(state.opponent.aura - bled.opponent.aura).toBeCloseTo(BLINKY_HEMORRHAGE_AURA_DPS / FIGHT_FPS, 6)
  })

  it('Hanzo astral double ignores Ten physical blows, takes Ren/Ko/Hatsu, and enables cross-up', () => {
    const state = beginFight(createFight('hisoka', 'hanzo', { mode: 'versus-local' }))
    const hanzoDouble = {
      ...state.opponent,
      hanzoProjection: { bodyX: 80, bodyFacing: -1 as const, startedFrame: 0 },
    }
    const tenAttacker = {
      ...state.player,
      attack: { kind: 'light' as const, frame: 5, impacted: false },
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

  it('Kalluto floor confetti opens wounds on running foes and listening doll reveals opponent', () => {
    let state = beginFight(createFight('kalluto', 'hisoka', { mode: 'versus-local' }))
    state = scatterKallutoConfetti(state, 'player')
    state = deployKallutoListeningDoll(state, 'player')
    expect(kallutoDollRevealsOpponent(state, 'player')).toBe(true)

    let running = {
      ...state,
      opponent: {
        ...state.opponent,
        x: state.kallutoConfetti!.x,
        y: 0,
        motion: { kind: 'dash' as const, direction: -1 as const, frames: 6 },
      },
    }
    for (let i = 0; i < KALLUTO_CONFETTI_CUT_THRESHOLD; i++) {
      running = advanceShizukuHanzoKallutoUpgrades(running)
    }
    expect(running.opponent.openWounds).toBe(1)
  })
})
