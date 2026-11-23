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
  attachMusseOwl,
  musseKoWarningZone,
  musseOwlVisibleTo,
} from './musseWindowUpgrades'
import {
  FURYKOV_COUNTER_STAGGER,
  FURYKOV_RESISTANCE_FACTOR,
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
import { EMPTY_INPUT } from './types'

const DT = 1 / 60

describe('Leorio — Émission médicale & Sonar', () => {
  it('casts 2S Medical Sonar for 10 aura, reveals In without En penalty, and doubles Body Memory stacks', () => {
    const base = beginFight(createFight('leorio', 'hisoka'))
    const hidden = {
      ...base,
      opponent: { ...base.opponent, nen: { ...base.opponent.nen, in: true } },
    }
    expect(auraInformationKnown(hidden, 'player', 'opponent')).toBe(false)

    const scanned = castLeorioSonar(hidden, 'player')
    expect(scanned.player.aura).toBe(base.player.aura - LEORIO_SONAR_COST)
    expect(scanned.player.nen.en).toBeNull()
    expect(auraInformationKnown(scanned, 'player', 'opponent')).toBe(true)
    expect(leorioSurgicalStack(scanned.player, scanned.opponent)).toBe(2)
  })

  it('breaks ordinary Ten guard with Remote Punch, while Ken and Defensive Ko (feet) block cleanly', () => {
    const base = beginFight(createFight('leorio', 'hisoka'))
    const punching = {
      ...base.player,
      attack: {
        kind: 'special' as const,
        variant: 'neutral' as const,
        moveId: 'leorio:neutralSpecial',
        frame: 5,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: 'leorio' as const,
        projectileSpawned: false,
        confirmedHit: false,
      },
    }
    expect(leorioBreaksTenGuard(punching, base.opponent, true)).toBe(true)
    const kenDef = { ...base.opponent, nen: { ...base.opponent.nen, ken: true } }
    expect(leorioBreaksTenGuard(punching, kenDef, true)).toBe(false)
    const feetKoDef = { ...base.opponent, nen: { ...base.opponent.nen, ko: 'feet' as const } }
    expect(leorioBreaksTenGuard(punching, feetKoDef, true)).toBe(false)
  })
})

describe('Musse — Secret Window upgrades', () => {
  it('cancels In, drops transfer to 1f, warns on Ko charge, hides from opponent without Gyo, and dispels on Burst', () => {
    const base = beginFight(createFight('musse', 'hisoka'))
    const marked = attachMusseOwl(
      { ...base, mode: 'versus-local', opponent: { ...base.opponent, nen: { ...base.opponent.nen, in: true } } },
      'player',
    )
    expect(musseOwlVisibleTo(marked, 'player')).toBe(true)
    expect(musseOwlVisibleTo(marked, 'opponent')).toBe(false)
    expect(auraInformationKnown(marked, 'player', 'opponent')).toBe(true)
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
          variant: 'neutral' as const,
          frame: 2,
          impacted: false,
          auraCharged: true,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          confirmedHit: false,
        },
      },
    }
    expect(musseKoWarningZone(chargingKo, 'player')).toBe('feet')

    const bursted = tickFight(
      { ...marked, opponent: { ...marked.opponent, burstZetsuFrames: 60 } },
      EMPTY_INPUT,
      { dt: DT, opponentInput: EMPTY_INPUT },
    )
    expect(bursted.musseOwl).toBeUndefined()
  })
})

describe('Furykov — Combo Master analytical profile', () => {
  it('reads In in 25% brackets, pierces Texture Surprise Body Memory, and scales through 3 tiers', () => {
    const base = beginFight(createFight('furykov', 'hisoka'))
    expect(furykovAuraBracket({ ...base.opponent, aura: 62 })).toBe('50–75 / 100')

    const maskedHisoka = {
      ...base.opponent,
      textureSurprise: createTextureSurprise(base.opponent),
    }
    expect(textureSurpriseView(maskedHisoka, base.player, 'opponent').maskBodyMemory).toBe(false)

    // Ten gives 0 profiling gauge; Ren fills it
    expect(advanceFurykovProfile(base).player.furykovGauge).toBeUndefined()
    const renState = {
      ...base,
      opponent: { ...base.opponent, nen: { ...base.opponent.nen, mode: 'ren' as const } },
    }
    let profiled = renState
    for (let i = 0; i < 200; i++) profiled = advanceFurykovProfile(profiled)
    expect(furykovTier(profiled.player)).toBe(3)
    expect(furykovResistanceFactor(profiled.player, profiled.opponent)).toBe(FURYKOV_RESISTANCE_FACTOR)

    const defKo = { ...profiled.player, nen: { ...profiled.player.nen, ko: 'hands' as const } }
    expect(furykovDefensiveKoStagger(defKo, true)).toBe(FURYKOV_COUNTER_STAGGER)
  })
})

describe('Basho — Great Haiker 5-7-5 rhythm and 3 directional themes', () => {
  it('rewards perfect 5-7-5 taps with Masterpiece buffs and lets opponent extinguish burn via Context', () => {
    const base = beginFight(createFight('basho', 'hisoka'))
    let state = { ...base, mode: 'versus-local' as const, player: startBashoHaiku(base.player, 'fire') }
    for (let f = 0; f < BASHO_WRITING_FRAMES; f++) {
      if ((BASHO_BEATS as readonly number[]).includes(state.player.bashoRhythm?.frame ?? -1)) {
        state = { ...state, player: tapBashoBeat(state.player) }
      }
      state = tickFight(state, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    }
    expect(state.player.bashoHaikuBuff?.quality).toBe('masterpiece')
    expect(bashoFireAttackFactor(state.player)).toBe(1.45)

    // Burn drains HP/aura and is extinguished by opponent pressing Context
    const burning = { ...state, opponent: { ...state.opponent, haikuBurn: true, health: 200, aura: 80 } }
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
      bashoHaikuBuff: { theme: 'shield' as const, quality: 'masterpiece' as const, kenCostFactor: 0, kenRepel: true },
    }
    expect(bashoKenCostFactor(shieldMaster)).toBe(0)

    const windMaster = {
      ...base.player,
      attack: {
        kind: 'heavy' as const,
        variant: 'neutral' as const,
        frame: 4,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        confirmedHit: false,
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
