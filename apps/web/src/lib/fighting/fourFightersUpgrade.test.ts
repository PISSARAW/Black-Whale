import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import {
  LEORIO_SONAR_COST,
  castLeorioSonar,
  leorioBreaksTenGuard,
  leorioSurgicalStack,
} from './leorioMedical'
import {
  MUSSE_OWL_UPKEEP,
  advanceMusseOwl,
  attachMusseOwl,
  musseKoWarningZone,
  musseOwlVisibleTo,
} from './musseWindowUpgrades'
import {
  advanceFurykovProfile,
  furykovAuraBracket,
  furykovDefensiveKoStagger,
  furykovResistanceFactor,
  furykovTier,
} from './furykovProfile'
import {
  BASHO_BEATS,
  BASHO_WRITING_FRAMES,
  bashoFireAttackFactor,
  bashoIgnoresTenGuard,
  bashoKenCostFactor,
  startBashoHaiku,
  tapBashoBeat,
} from './bashoHaiku'
import { auraInformationKnown } from './nenInformationWar'
import { nenTransferFrames } from './nenTransfer'
import { auraFlowRate } from './nen'
import { textureSurpriseView } from './textureSurpriseMask'
import { createTextureSurprise } from './hisokaTextureOrigin'
import { EMPTY_INPUT, type FightState } from './types'

const DT = 1 / 60

describe('Leorio — Émission médicale & Sonar', () => {
  it('does not invent a medical sonar that reveals In or doubles Body Memory stacks', () => {
    const base = beginFight(createFight('leorio', 'hisoka'))
    const hidden = {
      ...base,
      opponent: { ...base.opponent, nen: { ...base.opponent.nen, in: true } },
    }
    expect(auraInformationKnown(hidden, 'player', 'opponent')).toBe(false)

    const scanned = castLeorioSonar(hidden, 'player')
    expect(scanned.player.aura).toBe(base.player.aura)
    expect(scanned.player.nen.en).toBeNull()
    expect(auraInformationKnown(scanned, 'player', 'opponent')).toBe(false)
    expect(leorioSurgicalStack(scanned.player, scanned.opponent)).toBe(1)
  })

  it('does not give Remote Punch an unattested Ten-breaking property', () => {
    const base = beginFight(createFight('leorio', 'hisoka'))
    const punching = {
      ...base.player,
      attack: {
        kind: 'special' as const,
        variant: 'standing' as const,
        moveId: 'leorio:neutralSpecial',
        frame: 5,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: 'leorio' as const,
        projectileSpawned: false,
        confirmedHit: false,
        reversal: false,
      },
    }
    expect(leorioBreaksTenGuard(punching, base.opponent, true)).toBe(false)
    const kenDef = { ...base.opponent, nen: { ...base.opponent.nen, ken: true } }
    expect(leorioBreaksTenGuard(punching, kenDef, true)).toBe(false)
    const feetKoDef = { ...base.opponent, nen: { ...base.opponent.nen, ko: 'feet' as const } }
    expect(leorioBreaksTenGuard(punching, feetKoDef, true)).toBe(false)
  })
})

describe('Musse — Secret Window upgrades', () => {
  it('tracks the body without cancelling In or predicting Ko, and hides from the target without Gyo', () => {
    const base = beginFight(createFight('musse', 'hisoka'))
    const marked = attachMusseOwl(
      {
        ...base,
        mode: 'versus-local',
        opponent: { ...base.opponent, nen: { ...base.opponent.nen, in: true } },
      },
      'player',
    )
    expect(musseOwlVisibleTo(marked, 'player')).toBe(true)
    expect(musseOwlVisibleTo(marked, 'opponent')).toBe(false)
    expect(auraInformationKnown(marked, 'player', 'opponent')).toBe(false)
    expect(nenTransferFrames(marked.player)).toBe(1)
    expect(auraFlowRate(marked.player)).toBeCloseTo(auraFlowRate(base.player) - MUSSE_OWL_UPKEEP)

    const withGyo = {
      ...marked,
      opponent: { ...marked.opponent, nen: { ...marked.opponent.nen, gyo: true } },
    }
    expect(musseOwlVisibleTo(withGyo, 'opponent')).toBe(true)

    const chargingKo = {
      ...marked,
      opponent: {
        ...marked.opponent,
        attack: {
          kind: 'heavy' as const,
          variant: 'standing' as const,
          frame: 2,
          impacted: false,
          auraCharged: true,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          confirmedHit: false,
          reversal: false,
        },
      },
    }
    expect(musseKoWarningZone(chargingKo, 'player')).toBeNull()

    const bursted = advanceMusseOwl({
      ...marked,
      player: { ...marked.player, auraExhausted: true },
    })
    expect(bursted.musseOwl).toBeUndefined()
  })
})

describe('Furykov — Combo Master canonical limits', () => {
  it('does not reveal aura, pierce Texture Surprise, build buffs, resist categories, or auto-counter', () => {
    const base = beginFight(createFight('furykov', 'hisoka'))
    expect(furykovAuraBracket({ ...base.opponent, aura: 62 })).toBe('?')

    const maskedHisoka = {
      ...base.opponent,
      textureSurprise: createTextureSurprise(base.opponent),
    }
    expect(textureSurpriseView(maskedHisoka, base.player, 'opponent').maskBodyMemory).toBe(true)

    // Combo Master alerts on a directed concealed attack in its own suite; observation alone adds no buff.
    expect(advanceFurykovProfile(base).player.furykovGauge).toBeUndefined()
    const renState = {
      ...base,
      opponent: { ...base.opponent, nen: { ...base.opponent.nen, mode: 'ren' as const } },
    }
    let profiled: FightState = renState
    for (let i = 0; i < 200; i++) profiled = advanceFurykovProfile(profiled)
    expect(furykovTier(profiled.player)).toBe(0)
    expect(furykovResistanceFactor(profiled.player, profiled.opponent)).toBe(1)

    const defKo = { ...profiled.player, nen: { ...profiled.player.nen, ko: 'hands' as const } }
    expect(furykovDefensiveKoStagger(defKo, true)).toBe(0)
  })
})

describe('Basho — Great Haiker 5-7-5 rhythm and 3 directional themes', () => {
  it('rewards perfect 5-7-5 taps with Masterpiece buffs and lets opponent extinguish burn via Context', () => {
    const base = beginFight(createFight('basho', 'hisoka'))
    let state: FightState = {
      ...base,
      mode: 'versus-local' as const,
      player: startBashoHaiku(base.player, 'fire'),
    }
    for (let f = 0; f < BASHO_WRITING_FRAMES; f++) {
      if ((BASHO_BEATS as readonly number[]).includes(state.player.bashoRhythm?.frame ?? -1)) {
        state = { ...state, player: tapBashoBeat(state.player) }
      }
      state = tickFight(state, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    }
    expect(state.player.bashoHaikuBuff?.quality).toBe('masterpiece')
    expect(bashoFireAttackFactor(state.player)).toBe(1.45)

    // Burn drains HP/aura and is extinguished by opponent pressing Context
    const burning = {
      ...state,
      opponent: { ...state.opponent, haikuBurn: true, health: 200, aura: 80 },
    }
    const ticked = tickFight(burning, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    expect(ticked.opponent.health).toBeLessThan(200)
    expect(ticked.opponent.aura).toBeLessThan(80)
    const extinguished = tickFight(ticked, EMPTY_INPUT, {
      dt: DT,
      opponentInput: { ...EMPTY_INPUT, context: true },
    })
    expect(extinguished.opponent.haikuBurn).toBeUndefined()

    // Shield masterpiece -> 0 Ken cost; Wind masterpiece -> ignores Ten guard
    const shieldMaster = {
      ...base.player,
      bashoHaikuBuff: {
        theme: 'shield' as const,
        quality: 'masterpiece' as const,
        kenCostFactor: 0,
        kenRepel: true,
      },
    }
    expect(bashoKenCostFactor(shieldMaster)).toBe(0)

    const windMaster = {
      ...base.player,
      attack: {
        kind: 'heavy' as const,
        variant: 'standing' as const,
        frame: 4,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        confirmedHit: false,
        reversal: false,
      },
      bashoHaikuBuff: {
        theme: 'wind' as const,
        quality: 'masterpiece' as const,
        superArmorHits: 1,
        ignoresTenGuard: true,
      },
    }
    expect(bashoIgnoresTenGuard(windMaster, base.opponent)).toBe(true)
  })
})
