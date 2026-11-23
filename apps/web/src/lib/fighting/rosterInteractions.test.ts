import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { resolveContextInput } from './contextInput'
import { SENSE_BITS } from './saiyuSenses'
import { offerMoonlightContract, respondMoonlightContract } from './moonlightContract'
import { fightCategoryEfficiency } from './nenCategories'
import { applyAuraContext, auraFlowRate, nenAttackFactor } from './nen'
import { advancedAuraDrain } from './nenAdvanced'
import { nenTransferFrames } from './nenTransfer'
import {
  BEYOND_REN_DRAIN,
  MARTIAL_KAMEO_COOLDOWN_FACTOR,
  THETA_BULLET_LETHALITY,
  THETA_IN_DRAIN,
  THETA_STEALTH_BONUS,
  kameoCooldownFactor,
  thetaBulletDamageFactor,
} from './martialSpecialists'
import { EMPTY_INPUT } from './types'

const DT = 1 / 60

describe('Saiyu Iwazaru x Context call', () => {
  it('blocks the Context button from emitting call when speech is sealed by Iwazaru', () => {
    const base = beginFight(createFight('bonolenov', 'saiyu'))
    expect(resolveContextInput(base, 'player', { ...EMPTY_INPUT, context: true }).call).toBe(true)

    const silenced = {
      ...base,
      player: {
        ...base.player,
        hatsuEffects: { ...base.player.hatsuEffects, senseSeals: SENSE_BITS.speech },
      },
    }
    expect(resolveContextInput(silenced, 'player', { ...EMPTY_INPUT, context: true }).call).toBeUndefined()
  })
})

describe('Longhi Moonlight Act PvP dilemma (no-ken-surge)', () => {
  it('grants +30 immediate aura to both signatories on signing and punishes Ken with Zetsu', () => {
    const base = beginFight(createFight('longhi', 'kurapika'))
    const close = {
      ...base,
      mode: 'versus-local' as const,
      player: { ...base.player, x: 45, aura: 40 },
      opponent: { ...base.opponent, x: 52, aura: 30 },
    }
    const offered = offerMoonlightContract({ state: close, side: 'player', clause: 'no-ken-surge' })
    expect(offered.moonlight?.offer?.clause).toBe('no-ken-surge')

    const signed = respondMoonlightContract({ state: offered, side: 'opponent', accept: true })
    expect(signed.moonlight?.active?.terms).toBe('no-ken')
    expect(signed.player.aura).toBe(70)
    expect(signed.opponent.aura).toBe(60)

    const breached = tickFight(signed, EMPTY_INPUT, {
      dt: DT,
      opponentInput: { ...EMPTY_INPUT, guard: true, aura: true },
    })
    expect(breached.moonlight?.outcome).toEqual({ kind: 'breached', side: 'opponent' })
    expect(breached.opponent.moonlightZetsu).toBe(true)
  })
})

describe('No-duel-Hatsu Nen engine specialists', () => {
  it('gives Beyond 100% Enhancer efficiency, -2/s Ren drain, and superior Ko power', () => {
    const beyond = beginFight(createFight('beyond', 'phinks')).player
    const phinks = beginFight(createFight('beyond', 'phinks')).opponent
    expect(fightCategoryEfficiency(beyond, 'enhancer')).toBe(1)

    const beyondRen = applyAuraContext(beyond, { ...EMPTY_INPUT, aura: true })
    expect(auraFlowRate(beyondRen)).toBe(BEYOND_REN_DRAIN)

    const beyondKo = { ...beyond, nen: { ...beyond.nen, mode: 'ren' as const, ko: 'feet' as const } }
    const phinksKo = { ...phinks, nen: { ...phinks.nen, mode: 'ren' as const, ko: 'feet' as const } }
    expect(nenAttackFactor(beyondKo, 'heavy')).toBeGreaterThan(nenAttackFactor(phinksKo, 'heavy'))
  })

  it('gives Theta lethal physical bullets (+stealth bonus from In/Zetsu) and cheap In upkeep', () => {
    const theta = beginFight(createFight('theta', 'hisoka')).player
    expect(thetaBulletDamageFactor(theta, true)).toBe(THETA_BULLET_LETHALITY)
    const hidden = { ...theta, nen: { ...theta.nen, in: true } }
    expect(thetaBulletDamageFactor(hidden, true)).toBeCloseTo(
      THETA_BULLET_LETHALITY * THETA_STEALTH_BONUS,
    )
    expect(advancedAuraDrain(hidden)).toBe(THETA_IN_DRAIN)
  })

  it('gives Cluck, Sayird, and Yokotani 2-frame Ryu transfers and 30% faster Kameo cooldowns', () => {
    for (const id of ['cluck', 'sayird', 'yokotani'] as const) {
      const fighter = beginFight(createFight(id, 'hisoka')).player
      expect(nenTransferFrames(fighter)).toBe(2)
      expect(kameoCooldownFactor(fighter)).toBe(MARTIAL_KAMEO_COOLDOWN_FACTOR)
    }
  })
})
