import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT, type ArcadeFighter } from './types'
import { bodyMemoryWeak, rememberBodyHit } from './bodyMemory'
import { applyAuraContext, focusAttackRyu } from './nen'
import { nenOutputCapacity } from './nenBudget'
import { resolveContextInput } from './contextInput'
import { strikeDefender } from './combatDamage'
import {
  advanceTroupeUpgrades,
  applyMachiCombatSuture,
  applyPhinksRecoil,
  cancelCyclotronWithStorage,
  FRANKLIN_KEN_GUARD_DRAIN,
  franklinSalvoProfile,
  MACHI_SUTURE_AURA_COST,
  machiTripwireVisibleTo,
  PHINKS_OVERDRIVE_THRESHOLD,
  phinksDisplayedTurns,
  placeMachiInTripwire,
  plantMachiTrackingThread,
  pullMachiTrackedTarget,
} from './troupeUpgrades'
import {
  applyBiscuitInterRoundCare,
  applyIllumiMotorParasite,
  BISCUIT_TRUE_FORM_RYU_SHARE,
  hasIllumiNeedleOrder,
  implantIllumiNeedleOrder,
  removeIllumiNeedle,
  toggleBiscuitForm,
} from './illumiBiscuitUpgrades'

describe('5-fighter upgrades: Machi, Phinks, Franklin, Illumi, Biscuit', () => {
  it('Machi sutures wounds without erasing strain; In-tripwire cuts runners; tracking thread pulls', () => {
    let state = beginFight(createFight('machi', 'hisoka', { mode: 'versus-local' }))
    let machi: ArcadeFighter = { ...state.player, aura: 40, openWounds: 2 }
    for (let i = 0; i < 3; i++) machi = rememberBodyHit(machi, 'hands', 10, false)
    expect(bodyMemoryWeak(machi, 'hands')).toBe(true)

    const sutured = applyMachiCombatSuture(machi)
    expect(sutured.aura).toBe(40 - MACHI_SUTURE_AURA_COST)
    expect(sutured.openWounds).toBe(0)
    expect(bodyMemoryWeak(sutured, 'hands')).toBe(true)

    state = placeMachiInTripwire(state, 'player')
    expect(machiTripwireVisibleTo(state, 'opponent')).toBe(false)
    const gyoState = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, gyo: true }, gyoLow: false },
    }
    expect(machiTripwireVisibleTo(gyoState, 'opponent')).toBe(true)

    const tripped = advanceTroupeUpgrades({
      ...state,
      opponent: { ...state.opponent, x: state.machiTripwire!.x, y: 4, velocityY: 2 },
    })
    expect(tripped.machiTripwire).toBeUndefined()
    expect(tripped.opponent.openWounds).toBe(1)
    expect(tripped.opponent.velocityY).toBe(0)

    const stealthState = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, mode: 'zetsu' as const } },
    }
    const tracked = plantMachiTrackingThread(stealthState, 'player')
    expect(tracked.opponent.nen.mode).toBe('zetsu')
    const startX = tracked.opponent.x
    const pulled = pullMachiTrackedTarget(tracked, 'player')
    expect(Math.abs(pulled.opponent.x - pulled.player.x)).toBeLessThan(
      Math.abs(startX - pulled.player.x),
    )
    expect(pulled.opponent.machiTrackedBy).toBeUndefined()
  })

  it('Phinks hides turns under In without invented charge storage or automatic recoil', () => {
    const state = beginFight(createFight('phinks', 'hisoka', { mode: 'versus-local' }))
    const winding = {
      ...state.player,
      nen: { ...state.player.nen, in: true },
      hatsuEffects: { ...state.player.hatsuEffects, cyclotronTurns: 8 },
    }
    expect(phinksDisplayedTurns(winding, state.opponent)).toBeNull()
    const gyoFoe = { ...state.opponent, nen: { ...state.opponent.nen, gyo: true }, gyoLow: false }
    expect(phinksDisplayedTurns(winding, gyoFoe)).toBe(8)

    const cancelled = cancelCyclotronWithStorage(winding)
    expect(cancelled.hatsuEffects.cyclotronTurns).toBe(0)
    expect(cancelled.phinksStoredTurnsFrames).toBeUndefined()

    const recoiled = applyPhinksRecoil(cancelled, PHINKS_OVERDRIVE_THRESHOLD)
    expect(bodyMemoryWeak(recoiled, 'hands')).toBe(false)
  })

  it('Franklin uses ordinary Ken drain while distinguishing suppression and heavy salvos', () => {
    const state = beginFight(createFight('franklin', 'hisoka', { mode: 'versus-local' }))
    const attacker = {
      ...state.player,
      attack: {
        kind: 'special' as const,
        moveId: 'franklin:forwardSpecial',
        frame: 5,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: 'franklin' as const,
        projectileSpawned: false,
        reversal: false,
      },
    }
    const kenDefender = {
      ...state.opponent,
      aura: 50,
      nen: { ...state.opponent.nen, ken: true },
    }
    const blocked = strikeDefender({
      fighter: kenDefender,
      attacker,
      damage: 10,
      blocked: true,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: false,
      comboHits: 1,
    })
    expect(50 - blocked.aura).toBeGreaterThanOrEqual(FRANKLIN_KEN_GUARD_DRAIN + 2)
    expect(franklinSalvoProfile('neutral').keepsHitstun).toBe(true)
    expect(franklinSalvoProfile('forward').breaksRenAdvance).toBe(true)
    expect(franklinSalvoProfile('forward').cancelsWeakerProjectiles).toBe(true)
  })

  it('Illumi Needle orders reverse advance/Ko or block Ken/Ren until pulled via Contexte', () => {
    let state = beginFight(createFight('illumi', 'hisoka', { mode: 'versus-local' }))
    const retreatVictim = implantIllumiNeedleOrder({ ...state.opponent, facing: -1 }, 'retreat')
    const parasited = applyIllumiMotorParasite(retreatVictim, {
      ...EMPTY_INPUT,
      left: true,
      guard: true,
      aura: true,
      jump: true,
    })
    expect(parasited.right).toBe(true)
    expect(parasited.left).toBe(false)
    expect(parasited.down).toBe(true)

    const zetsuVictim = implantIllumiNeedleOrder(state.opponent, 'zetsu')
    const triedKen = applyAuraContext(zetsuVictim, { ...EMPTY_INPUT, guard: true, aura: true })
    expect(triedKen.nen.ken).toBe(false)

    state = { ...state, opponent: zetsuVictim }
    expect(hasIllumiNeedleOrder(state.opponent)).toBe(true)
    const ctx = resolveContextInput(state, 'opponent', { ...EMPTY_INPUT, context: true })
    expect(ctx.removeNeedle).toBe(true)

    const freed = removeIllumiNeedle(zetsuVictim)
    expect(hasIllumiNeedleOrder(freed)).toBe(false)
    expect(freed.hitStun).toBeGreaterThan(0)
  })

  it('Biscuit toggles form reversibly, gets 80% Ryu & Ko clash edge in true form, and heals fatigue between rounds', () => {
    const state = beginFight(createFight('biscuit', 'hisoka', { mode: 'versus-local' }))
    const girl = state.player
    const adult = toggleBiscuitForm(girl)
    expect(adult.biscuitTrueForm).toBe(true)
    expect(toggleBiscuitForm(adult).biscuitTrueForm).toBe(false)

    expect(nenOutputCapacity(adult)).toBeGreaterThan(nenOutputCapacity(girl))
    const focused = focusAttackRyu(adult, 'light')
    const targetShare = focused.nenTransfer?.to.hands ?? focused.nen.ryu.hands
    expect(targetShare).toBeCloseTo(BISCUIT_TRUE_FORM_RYU_SHARE, 3)

    const tired = rememberBodyHit({ ...adult, nenMentalFatigue: 4000 }, 'hands', 10, false)
    const rested = applyBiscuitInterRoundCare(tired)
    expect(rested.nenMentalFatigue).toBeLessThan(4000)
    expect(rested.bodyMemory?.hits.hands).toBe(0)
  })
})
