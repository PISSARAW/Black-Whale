import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT } from './types'
import { SENSE_BITS } from './saiyuSenses'
import { swearSeiyaku } from './seiyaku'
import { readMelodyHeartbeat } from './blackWhaleCanonUpgrades'
import { resolvedDamage, strikeDefender } from './combatDamage'
import { resolveContextInput } from './contextInput'
import { advanceNenPillars, REN_MALICE_RANGE } from './nenPillars'
import {
  advanceFinalFiveUpgrades,
  beyondRenMaliceRange,
  beyondSaturatesGyo,
  declineMoonlightContract,
  LONGHI_BREACH_ZETSU_FRAMES,
  LONGHI_REFUSE_AURA_GAIN,
  moonlightContractActive,
  PADAILLE_HAMMER_KEN_DRAIN,
  proposeMoonlightContract,
  saiyuAudioCuesMuted,
  saiyuSightBlocked,
  startThetaSilentReload,
  thetaPortraitHidesStress,
} from './finalFiveUpgrades'

describe('Final 5 fighter upgrades: Saiyu, Padaille, Theta, Longhi, Beyond', () => {
  it('1. Saiyu Mizaru blocks sight/Gyo, Kikazaru mutes Melody & audio, Iwazaru blocks Seiyaku', () => {
    const state = beginFight(createFight('saiyu', 'melody', { mode: 'versus-local' }))
    const blinded = {
      ...state.opponent,
      hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: SENSE_BITS.sight },
    }
    expect(saiyuSightBlocked(blinded)).toBe(true)

    const deafened = {
      ...state.opponent,
      hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: SENSE_BITS.hearing },
    }
    expect(saiyuAudioCuesMuted(deafened)).toBe(true)
    expect(readMelodyHeartbeat({ ...state, opponent: deafened }, 'opponent', EMPTY_INPUT)).toBeNull()

    const muted = {
      ...state.opponent,
      hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: SENSE_BITS.speech },
    }
    expect(swearSeiyaku(muted, 'speed').seiyaku).toBeUndefined()
  })

  it('2. Padaille Hammer drains Ken, Drill pierces Ten & doubles Body Memory, Axe opens wounds', () => {
    const state = beginFight(createFight('padaille', 'hisoka', { mode: 'versus-local' }))
    const hammer = {
      ...state.player,
      attack: { kind: 'special' as const, frame: 8, impacted: false, variant: 'neutral' as const },
    }
    const kenFoe = { ...state.opponent, aura: 50, nen: { ...state.opponent.nen, ken: true } }
    const afterHammer = strikeDefender({
      fighter: kenFoe,
      attacker: hammer,
      damage: 10,
      blocked: true,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
    })
    expect(50 - afterHammer.aura).toBeGreaterThanOrEqual(PADAILLE_HAMMER_KEN_DRAIN + 2)

    const drill = {
      ...state.player,
      attack: { kind: 'special' as const, frame: 8, impacted: false, variant: 'forward' as const },
    }
    const normalChip = resolvedDamage({
      attacker: { ...state.player, attack: { kind: 'light', frame: 4, impacted: false } },
      defence: { fighter: state.opponent, blocked: true, parried: false, avoided: false, invulnerable: false },
      base: 20,
      zone: 'hands',
      kind: 'light',
      damageScale: 1,
      openingMultiplier: 1,
    })
    const drillChip = resolvedDamage({
      attacker: drill,
      defence: { fighter: state.opponent, blocked: true, parried: false, avoided: false, invulnerable: false },
      base: 20,
      zone: 'hands',
      kind: 'special',
      damageScale: 1,
      openingMultiplier: 1,
    })
    expect(drillChip).toBeGreaterThan(normalChip)

    const afterDrill = strikeDefender({
      fighter: state.opponent,
      attacker: drill,
      damage: 10,
      blocked: false,
      zone: 'hands',
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
    })
    expect(afterDrill.bodyMemory?.hits.hands).toBe(2)

    const axe = {
      ...state.player,
      attack: { kind: 'special' as const, frame: 8, impacted: false, variant: 'down' as const },
    }
    const afterAxe = strikeDefender({
      fighter: state.opponent,
      attacker: axe,
      damage: 12,
      blocked: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
    })
    expect(afterAxe.openWounds).toBe(1)
  })

  it('3. Theta hides stress on Living Portrait without Gyo/Melody/Furykov and reloads silently in Zetsu', () => {
    const state = beginFight(createFight('theta', 'hisoka', { mode: 'versus-local' }))
    expect(thetaPortraitHidesStress(state.player, state.opponent)).toBe(true)
    const melody = beginFight(createFight('theta', 'melody', { mode: 'versus-local' })).opponent
    expect(thetaPortraitHidesStress(state.player, melody)).toBe(false)

    const zetsuEmpty = {
      ...state.player,
      firearmAmmo: 0,
      nen: { ...state.player.nen, mode: 'zetsu' as const },
    }
    const reloading = startThetaSilentReload(zetsuEmpty)
    expect(reloading.silentReload).toBe(true)
    expect(reloading.nen.mode).toBe('zetsu')
    expect(reloading.firearmReloadFrames).toBeGreaterThan(0)
  })

  it('4. Longhi Moonlight Act grants +15 aura on refusal, or activates no-Ken pact with Zetsu breach', () => {
    let state = beginFight(createFight('longhi', 'hisoka', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, aura: 40 } }
    const offered = proposeMoonlightContract(state, 'player')
    expect(resolveContextInput(offered, 'opponent', { ...EMPTY_INPUT, context: true }).acceptContract).toBe(
      true,
    )

    const declined = declineMoonlightContract(offered)
    expect(declined.moonlightOffer).toBeUndefined()
    expect(declined.player.aura).toBe(40 + LONGHI_REFUSE_AURA_GAIN)

    const accepted = advanceFinalFiveUpgrades(offered, {
      player: EMPTY_INPUT,
      opponent: { ...EMPTY_INPUT, context: true },
    })
    expect(moonlightContractActive(accepted)).toBe(true)

    const breached = advanceFinalFiveUpgrades(
      { ...accepted, opponent: { ...accepted.opponent, nen: { ...accepted.opponent.nen, ken: true } } },
      { player: EMPTY_INPUT, opponent: EMPTY_INPUT },
    )
    expect(breached.opponent.burstZetsuFrames).toBe(LONGHI_BREACH_ZETSU_FRAMES)
  })

  it('5. Beyond Netero Ren saturates Gyo and doubles Ren Malice range against Zetsu', () => {
    const state = beginFight(createFight('beyond', 'hisoka', { mode: 'versus-local' }))
    const renBeyond = { ...state.player, x: 40, nen: { ...state.player.nen, mode: 'ren' as const } }
    expect(beyondSaturatesGyo(renBeyond)).toBe(true)
    expect(beyondRenMaliceRange(renBeyond)).toBe(REN_MALICE_RANGE * 2)

    const farZetsu = {
      ...state,
      player: renBeyond,
      opponent: { ...state.opponent, x: 44, nen: { ...state.opponent.nen, mode: 'zetsu' as const } },
    }
    const feared = advanceNenPillars(farZetsu)
    expect(feared.opponent.hitStun).toBeGreaterThan(0)
  })
})
