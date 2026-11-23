import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT } from './types'
import { nenTransferFrames } from './nenTransfer'
import { nenAttackFactor } from './nen'
import { resolvedDamage } from './combatDamage'
import { resolveContextInput } from './contextInput'
import { SENSE_BITS } from './saiyuSenses'
import { blinkySwallowNonNen } from './shizukuHanzoKallutoUpgrades'
import {
  activateMetamorphosen,
  applyHalkenburgBodySwap,
  applyJupiterAcousticImpact,
  canUseMetamorphosen,
  HALKENBURG_GUARD_TRANSFER_FRAMES,
  JUPITER_TRANSFER_PENALTY,
  recordVocalExchange,
} from './halkenburgBonolenovUpgrades'
import {
  advanceHinrighZakuroLuiniUpgrades,
  applyHinrighHandcuffs,
  breakHinrighHandcuffs,
  deployHinrighBioPigeon,
  hinrighBlocksHandAction,
  luiniPortalVisibleTo,
  placeLuiniExitPortal,
  placeZakuroBloodDrops,
  ZAKURO_BLEED_REACH_FACTOR,
  zakuroBloodReachFactor,
} from './hinrighZakuroLuiniUpgrades'

describe('5-fighter upgrades: Halkenburg, Bonolenov, Hinrigh, Zakuro, Luini', () => {
  it('Halkenburg arrow pierces Ken/Ko and body swap locks Hatsu & slows nenTransferFrames to 6f', () => {
    const state = beginFight(createFight('halkenburg', 'hisoka', { mode: 'versus-local' }))
    const archer = {
      ...state.player,
      attack: { kind: 'special' as const, frame: 10, impacted: false, variant: 'forward' as const },
    }
    const kenDefender = { ...state.opponent, nen: { ...state.opponent.nen, ken: true } }
    const unblocked = resolvedDamage({
      attacker: archer,
      defence: { fighter: kenDefender, blocked: false, parried: false, avoided: false, invulnerable: false },
      base: 20,
      zone: 'torso',
      kind: 'special',
      damageScale: 1,
      openingMultiplier: 1,
    })
    const blocked = resolvedDamage({
      attacker: archer,
      defence: { fighter: kenDefender, blocked: true, parried: false, avoided: false, invulnerable: false },
      base: 20,
      zone: 'torso',
      kind: 'special',
      damageScale: 1,
      openingMultiplier: 1,
    })
    expect(blocked).toBe(unblocked)

    const swapped = applyHalkenburgBodySwap(state, 'player')
    expect(nenTransferFrames(swapped.opponent)).toBe(HALKENBURG_GUARD_TRANSFER_FRAMES)
    const hatsuAttempt = {
      ...swapped.opponent,
      attack: { kind: 'special' as const, frame: 5, impacted: false, hatsuSource: 'hisoka' as const },
    }
    expect(nenAttackFactor(hatsuAttempt, 'special')).toBe(0)
  })

  it('Bonolenov Jupiter slows transfer by +2f unless coverEars; Metamorphosen needs vocal exchange & speech', () => {
    const state = beginFight(createFight('bonolenov', 'hisoka', { mode: 'versus-local' }))
    const baseTransfer = nenTransferFrames(state.opponent)
    const covered = applyJupiterAcousticImpact(state.opponent, true)
    expect(nenTransferFrames(covered)).toBe(baseTransfer)
    const stunned = applyJupiterAcousticImpact(state.opponent, false)
    expect(nenTransferFrames(stunned)).toBe(baseTransfer + JUPITER_TRANSFER_PENALTY)

    expect(canUseMetamorphosen(state.player)).toBe(false)
    const spoke = recordVocalExchange(state.player)
    expect(canUseMetamorphosen(spoke)).toBe(true)
    const muted = { ...spoke, hatsuEffects: { ...spoke.hatsuEffects, senseSeals: SENSE_BITS.speech } }
    expect(canUseMetamorphosen(muted)).toBe(false)

    const copied = activateMetamorphosen({ ...state, player: spoke }, 'player')
    expect(copied.player.metamorphosenCopiedId).toBe('hisoka')
  })

  it('Hinrigh handcuffs lock hands/Throw (Padaille breaks instantly), and Blinky can swallow Biohazard pigeons', () => {
    let state = beginFight(createFight('hinrigh', 'hisoka', { mode: 'versus-local' }))
    const cuffed = applyHinrighHandcuffs(state.opponent)
    expect(hinrighBlocksHandAction(cuffed, 'throw')).toBe(true)
    expect(hinrighBlocksHandAction(cuffed, 'light', 'hands')).toBe(true)
    expect(hinrighBlocksHandAction(cuffed, 'heavy', 'feet')).toBe(false)

    state = { ...state, opponent: cuffed }
    expect(resolveContextInput(state, 'opponent', { ...EMPTY_INPUT, context: true }).breakCuffs).toBe(true)
    const brokenHisoka = breakHinrighHandcuffs(cuffed)
    expect(brokenHisoka.hinrighCuffed).toBeUndefined()
    expect(brokenHisoka.hitStun).toBeGreaterThan(0)

    const padaille = applyHinrighHandcuffs(beginFight(createFight('hinrigh', 'padaille', { mode: 'versus-local' })).opponent)
    const brokenPadaille = breakHinrighHandcuffs(padaille)
    expect(brokenPadaille.hinrighCuffed).toBeUndefined()
    expect(brokenPadaille.hitStun).toBe(0)

    const withPigeon = deployHinrighBioPigeon(beginFight(createFight('shizuku', 'hinrigh', { mode: 'versus-local' })), 'opponent')
    const closePigeon = { ...withPigeon, hinrighBioPigeon: { ...withPigeon.hinrighBioPigeon!, x: withPigeon.player.x + 5 } }
    const rejected = blinkySwallowNonNen(closePigeon, 'player')
    expect(rejected.hinrighBioPigeon?.active).toBe(true)
    expect(rejected.player.shizukuSwallowed).toBeUndefined()
  })

  it('Zakuro gains +30% reach while wounded and blood-eye drops reveal In/Zetsu foes without Gyo', () => {
    let state = beginFight(createFight('zakuro', 'hisoka', { mode: 'versus-local' }))
    expect(zakuroBloodReachFactor(state.player)).toBe(1)
    const wounded = { ...state.player, openWounds: 1 }
    expect(zakuroBloodReachFactor(wounded)).toBe(ZAKURO_BLEED_REACH_FACTOR)

    state = placeZakuroBloodDrops({ ...state, player: wounded }, 'player')
    const stepped = advanceHinrighZakuroLuiniUpgrades({
      ...state,
      opponent: { ...state.opponent, x: state.zakuroBloodDrops!.x, nen: { ...state.opponent.nen, in: true } },
    })
    expect(stepped.opponent.nen.in).toBe(false)
    expect(stepped.opponent.zakuroRevealedFrames).toBeGreaterThan(0)
  })

  it('Luini conceals exit portal under In; full Gyo or En reveals it and En grants 1f reflex punish', () => {
    let state = beginFight(createFight('luini', 'hinrigh', { mode: 'versus-local' }))
    state = placeLuiniExitPortal(
      { ...state, player: { ...state.player, nen: { ...state.player.nen, in: true } } },
      'player',
      { x: state.opponent.x - 4, y: 0 },
    )
    expect(luiniPortalVisibleTo(state, 'opponent')).toBe(false)

    const gyoState = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, gyo: true }, gyoLow: false },
    }
    expect(luiniPortalVisibleTo(gyoState, 'opponent')).toBe(true)

    const enState = advanceHinrighZakuroLuiniUpgrades({
      ...state,
      opponent: {
        ...state.opponent,
        nen: { ...state.opponent.nen, mode: 'ren' as const, en: { radius: 15 } },
      },
    })
    expect(enState.luiniPortal?.concealedIn).toBe(false)
    expect(enState.opponent.enReflexActive).toBe(true)
    expect(nenTransferFrames(enState.opponent)).toBe(1)
  })
})
