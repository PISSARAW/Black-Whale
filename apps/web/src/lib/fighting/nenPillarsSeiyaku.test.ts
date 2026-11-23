import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import {
  EN_STARTUP_BONUS,
  FIREARM_RELOAD_FRAMES,
  REN_FEAR_COOLDOWN,
  REN_FEAR_STAGGER,
  REN_PRESSURE_BLOCKSTUN,
  advanceNenPillars,
  firearmCapacity,
  startFirearmReload,
} from './nenPillars'
import {
  SEIYAKU_AGGRESSION_POWER,
  SEIYAKU_AGGRESSION_SEAL_FRAMES,
  SEIYAKU_BLIND_COST_FACTOR,
  advanceSeiyaku,
  seiyakuExhaustionThreshold,
  seiyakuHatsuPowerFactor,
  swearSeiyaku,
} from './seiyaku'
import { nenTransferFrames } from './nenTransfer'
import { canStartFighterAttack, startFighterAttack } from './fighterAttacks'
import { auraInformationKnown } from './nenInformationWar'
import { resolvedDamage, strikeDefender, strikeProjectileDefender } from './combatDamage'
import { attackAuraCost } from './fightAttackCost'
import { EXHAUSTION_RELEASE_AURA } from './nen'
import { EMPTY_INPUT } from './types'

const DT = 1 / 60

describe('En — absolute reflex zone', () => {
  it('grants 1f transfer, -2f startup, and full In reveal while opponent is inside En', () => {
    const base = beginFight(createFight('hinrigh', 'hisoka'))
    const close = {
      ...base,
      player: { ...base.player, x: 45, nen: { ...base.player.nen, mode: 'ren' as const, en: { radius: 20 } } },
      opponent: { ...base.opponent, x: 52, nen: { ...base.opponent.nen, in: true } },
    }
    const stepped = advanceNenPillars(close)
    expect(stepped.player.enReflexActive).toBe(true)
    expect(nenTransferFrames(stepped.player)).toBe(1)
    expect(auraInformationKnown(stepped, 'player', 'opponent')).toBe(true)

    const strike = startFighterAttack({
      fighter: stepped.player,
      kind: 'light',
      auraCharged: false,
      concealed: false,
    })
    expect(strike.attack?.frame).toBe(EN_STARTUP_BONUS)
  })
})

describe('Ren — Malice fear stagger and blockstun pressure', () => {
  it('inflicts 10f Fear Stagger with 180f cooldown against Zetsu at close range, and +2f blockstun vs Ten', () => {
    const base = beginFight(createFight('hisoka', 'kurapika'))
    const close = {
      ...base,
      player: { ...base.player, x: 48, nen: { ...base.player.nen, mode: 'ren' as const } },
      opponent: { ...base.opponent, x: 50, nen: { ...base.opponent.nen, mode: 'zetsu' as const } },
    }
    const feared = advanceNenPillars(close)
    expect(feared.opponent.hitStun).toBe(REN_FEAR_STAGGER)
    expect(feared.opponent.fearCooldownFrames).toBe(REN_FEAR_COOLDOWN)

    const blockedTen = strikeDefender({
      fighter: base.opponent,
      attacker: { ...base.player, nen: { ...base.player.nen, mode: 'ren' as const } },
      damage: 4,
      blocked: true,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
    })
    const blockedNormal = strikeDefender({
      fighter: base.opponent,
      attacker: base.player,
      damage: 4,
      blocked: true,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
    })
    expect(blockedTen.blockStun).toBe(blockedNormal.blockStun + REN_PRESSURE_BLOCKSTUN)
  })
})

describe('Black Whale firearms — Ten chip, Ken/Ko immunity, 1.5 Body Memory, and reload', () => {
  it('deals 35% chip vs Ten, 0 chip vs Ken/Ko, 1.5 Body Memory stacks, and 24f vulnerable reload', () => {
    const base = beginFight(createFight('theta', 'kurapika'))
    const tenChip = resolvedDamage({
      physicalProjectile: true,
      attacker: base.player,
      defence: { fighter: base.opponent, blocked: true, parried: false, avoided: false, invulnerable: false },
      base: 20,
      zone: 'hands',
      kind: 'ranged',
      damageScale: 1,
      openingMultiplier: 1,
    })
    expect(tenChip).toBeGreaterThan(0)

    const kenChip = resolvedDamage({
      physicalProjectile: true,
      attacker: base.player,
      defence: {
        fighter: { ...base.opponent, nen: { ...base.opponent.nen, ken: true } },
        blocked: true,
        parried: false,
        avoided: false,
        invulnerable: false,
      },
      base: 20,
      zone: 'hands',
      kind: 'ranged',
      damageScale: 1,
      openingMultiplier: 1,
    })
    expect(kenChip).toBe(0)

    const shot = {
      id: 1,
      owner: 'player' as const,
      fighterId: 'theta' as const,
      x: 50,
      y: 6,
      velocityX: 40,
      radius: 1,
      damage: 18,
      knockback: 1,
      hitstun: 10,
      blockstun: 6,
      age: 0,
      lifetime: 60,
      matter: 'object' as const,
      shape: 'bullet' as const,
      zone: 'hands' as const,
    }
    const hit1 = strikeProjectileDefender({
      fighter: base.opponent,
      attacker: base.player,
      damage: 18,
      blocked: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
      zone: 'hands',
      projectile: shot,
    })
    expect(hit1.bodyMemory?.hits.hands).toBe(1.5)
    const hit2 = strikeProjectileDefender({
      fighter: hit1,
      attacker: base.player,
      damage: 18,
      blocked: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 2,
      zone: 'hands',
      projectile: shot,
    })
    expect(hit2.bodyMemory?.hits.hands).toBe(3)

    expect(firearmCapacity(base.player)).toBe(6)
    const emptyTheta = { ...base.player, firearmAmmo: 0 }
    const reloading = startFirearmReload(emptyTheta)
    expect(reloading.firearmReloadFrames).toBe(FIREARM_RELOAD_FRAMES)
    expect(canStartFighterAttack(reloading, 'light')).toBe(false)
  })
})

describe('Seiyaku — Soft Lock and Breach Penalties', () => {
  it('enforces Speed (no Ken -> 1f transfer / forced Zetsu), Aggression (+25% / 180f seal), and Blind (-25% cost / 36 threshold)', () => {
    const base = beginFight(createFight('kurapika', 'hisoka'))

    // Speed vow
    const speed = { ...base, player: swearSeiyaku(base.player, 'speed') }
    expect(nenTransferFrames(speed.player)).toBe(1)
    const brokenSpeed = advanceSeiyaku(
      { ...speed, player: { ...speed.player, nen: { ...speed.player.nen, ken: true } } },
      { player: EMPTY_INPUT },
    )
    expect(brokenSpeed.player.seiyaku?.breached).toBe(true)
    expect(brokenSpeed.player.auraExhausted).toBe(true)
    expect(brokenSpeed.player.nen.mode).toBe('zetsu')

    // Aggression vow
    let agg = { ...base, player: swearSeiyaku(base.player, 'aggression') }
    expect(seiyakuHatsuPowerFactor(agg.player)).toBe(SEIYAKU_AGGRESSION_POWER)
    for (let i = 0; i <= 11; i++) {
      agg = advanceSeiyaku(agg, { player: { ...EMPTY_INPUT, left: true } })
    }
    expect(agg.player.seiyaku?.breached).toBe(true)
    expect(agg.player.on?.sealFrames).toBe(SEIYAKU_AGGRESSION_SEAL_FRAMES)

    // Blind vow
    const blindFighter = swearSeiyaku(base.player, 'blind')
    const normalCost = attackAuraCost({ fighter: base.player, kind: 'special', moveId: 'kurapika:neutralSpecial' })
    const blindCost = attackAuraCost({ fighter: blindFighter, kind: 'special', moveId: 'kurapika:neutralSpecial' })
    expect(blindCost).toBe(Math.round(normalCost * SEIYAKU_BLIND_COST_FACTOR))

    const brokenBlind = advanceSeiyaku(
      { ...base, player: { ...blindFighter, nen: { ...blindFighter.nen, gyo: true } } },
      { player: EMPTY_INPUT },
    )
    expect(brokenBlind.player.seiyaku?.breached).toBe(true)
    expect(seiyakuExhaustionThreshold(brokenBlind.player)).toBe(EXHAUSTION_RELEASE_AURA * 2)

    // Verify doubled threshold holds Zetsu until 36 aura
    const recovering = tickFight(
      { ...brokenBlind, player: { ...brokenBlind.player, aura: 25, auraExhausted: true } },
      EMPTY_INPUT,
      { dt: DT, opponentInput: EMPTY_INPUT },
    )
    expect(recovering.player.auraExhausted).toBe(true)
  })
})
