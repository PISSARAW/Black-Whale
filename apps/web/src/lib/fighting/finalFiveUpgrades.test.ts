import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT } from './types'
import { SENSE_BITS } from './saiyuSenses'
import { swearSeiyaku } from './seiyaku'
import { readMelodyHeartbeat } from './blackWhaleCanonUpgrades'
import { REN_MALICE_RANGE } from './nenPillars'
import {
  advanceFinalFiveUpgrades,
  beyondRenMaliceRange,
  beyondSaturatesGyo,
  declineMoonlightContract,
  LONGHI_REFUSE_AURA_GAIN,
  moonlightContractActive,
  PADAILLE_HAMMER_KEN_DRAIN,
  padailleAxeOpensWound,
  padailleDrillBodyMemoryStack,
  padailleDrillPiercesTen,
  padailleHammerKenDrain,
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
    expect(
      readMelodyHeartbeat({ ...state, opponent: deafened }, 'opponent', EMPTY_INPUT),
    ).toBeNull()

    const muted = {
      ...state.opponent,
      hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: SENSE_BITS.speech },
    }
    expect(swearSeiyaku(muted, 'speed').seiyaku).toBeUndefined()
  })

  it('2. Padaille tools keep ordinary guard, Body Memory, and wound rules', () => {
    const state = beginFight(createFight('padaille', 'hisoka', { mode: 'versus-local' }))
    const hammer = {
      ...state.player,
      attack: {
        kind: 'special' as const,
        moveId: 'padaille:neutralSpecial',
        frame: 8,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: 'padaille' as const,
        projectileSpawned: false,
        reversal: false,
      },
    }
    const kenFoe = { ...state.opponent, aura: 50, nen: { ...state.opponent.nen, ken: true } }
    expect(padailleHammerKenDrain(hammer, kenFoe, true)).toBe(PADAILLE_HAMMER_KEN_DRAIN)

    const drill = {
      ...state.player,
      attack: { ...hammer.attack, moveId: 'padaille:forwardSpecial' },
    }
    expect(padailleDrillPiercesTen(drill, state.opponent, true)).toBe(false)
    expect(padailleDrillBodyMemoryStack(drill)).toBe(1)

    const axe = {
      ...state.player,
      attack: { ...hammer.attack, moveId: 'padaille:downSpecial' },
    }
    expect(padailleAxeOpensWound(axe, false, 12)).toBe(false)
  })

  it('3. Theta has no invented stress-hiding power and can reload her material firearm in Zetsu', () => {
    const state = beginFight(createFight('theta', 'hisoka', { mode: 'versus-local' }))
    expect(thetaPortraitHidesStress(state.player, state.opponent)).toBe(false)
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

  it('4. does not duplicate Moonlight Act with an unsigned no-Ken pact', () => {
    let state = beginFight(createFight('longhi', 'hisoka', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, aura: 40 } }
    const offered = proposeMoonlightContract(state, 'player')
    expect(offered).toBe(state)

    const declined = declineMoonlightContract(offered)
    expect(declined.moonlightOffer).toBeUndefined()
    expect(declined.player.aura).toBe(40 + LONGHI_REFUSE_AURA_GAIN)

    const accepted = advanceFinalFiveUpgrades(offered, {
      player: EMPTY_INPUT,
      opponent: { ...EMPTY_INPUT, context: true },
    })
    expect(moonlightContractActive(accepted)).toBe(false)
  })

  it('5. does not invent Gyo saturation or extended Ren Malice for Beyond', () => {
    const state = beginFight(createFight('beyond', 'hisoka', { mode: 'versus-local' }))
    const renBeyond = { ...state.player, x: 40, nen: { ...state.player.nen, mode: 'ren' as const } }
    expect(beyondSaturatesGyo(renBeyond)).toBe(false)
    expect(beyondRenMaliceRange(renBeyond)).toBe(REN_MALICE_RANGE)
  })
})
