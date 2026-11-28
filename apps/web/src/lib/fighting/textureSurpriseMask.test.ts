import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { createTextureSurprise } from './hisokaTextureOrigin'
import {
  TEXTURE_MASK_UPKEEP,
  TEXTURE_SURPRISE_COST,
  textureSurpriseDrain,
  textureSurpriseView,
  updateTextureOnHit,
} from './textureSurpriseMask'
import { bodyMemoryAttackFactor, rememberBodyHit } from './bodyMemory'
import { auraFlowRate } from './nen'
import { moveForSlot } from './movesets'

describe('Texture Surprise POV mask and mindgame mechanics', () => {
  it('costs 12 aura with 12f startup, 0/s normal upkeep, and -1/s when masking Body Memory', () => {
    const move = moveForSlot('hisoka', 'downSpecial')!
    expect(move.auraCost).toBe(TEXTURE_SURPRISE_COST)
    expect(move.tuning.startup).toBe(12)

    const state = createFightState('hisoka', 'kurapika')
    const cleanMasked = {
      ...state.player,
      textureSurprise: createTextureSurprise(state.player),
    }
    expect(textureSurpriseDrain(cleanMasked)).toBe(0)

    let weakened = state.player
    for (let i = 0; i < 3; i++)
      weakened = rememberBodyHit(weakened, { zone: 'hands', damage: 10, blocked: false })
    const maskedWeak = {
      ...weakened,
      textureSurprise: createTextureSurprise(weakened),
    }
    expect(maskedWeak.textureSurprise?.maskedLimbs).toEqual(['hands'])
    expect(maskedWeak.textureSurprise?.bungeeTrapLimb).toBe('hands')
    expect(textureSurpriseDrain(maskedWeak)).toBe(TEXTURE_MASK_UPKEEP)
    // Still suffers real Body Memory -18% attack penalty
    expect(bodyMemoryAttackFactor(maskedWeak, 'hands')).toBe(0.82)
    // Upkeep is subtracted from aura flow rate
    expect(auraFlowRate(maskedWeak)).toBeCloseTo(auraFlowRate(weakened) - TEXTURE_MASK_UPKEEP)
  })

  it('smooths displayedHp at 50% on light hits and snaps immediately on Heavy, Ko, or Throw', () => {
    const state = createFightState('hisoka', 'kurapika')
    const hisoka = {
      ...state.player,
      health: 200,
      textureSurprise: createTextureSurprise({ ...state.player, health: 200 }),
    }
    const afterLight = updateTextureOnHit({
      fighter: hisoka,
      attacker: state.opponent,
      damage: 20,
      blocked: false,
      zone: 'torso',
      kind: 'light',
    })
    expect(afterLight.trapped).toBe(false)
    expect(afterLight.textureSurprise?.displayedHp).toBe(190) // 200 - 20 * 0.5

    const afterHeavy = updateTextureOnHit({
      fighter: hisoka,
      attacker: state.opponent,
      damage: 30,
      blocked: false,
      zone: 'torso',
      kind: 'heavy',
    })
    expect(afterHeavy.textureSurprise).toBeUndefined()

    const afterThrow = updateTextureOnHit({
      fighter: hisoka,
      attacker: state.opponent,
      damage: 25,
      blocked: false,
      zone: 'torso',
      kind: 'heavy',
      variant: 'throw',
    })
    expect(afterThrow.textureSurprise).toBeUndefined()

    const koAttacker = {
      ...state.opponent,
      nen: { ...state.opponent.nen, ko: 'hands' as const },
    }
    const afterKo = updateTextureOnHit({
      fighter: hisoka,
      attacker: koAttacker,
      damage: 25,
      blocked: false,
      zone: 'torso',
      kind: 'light',
    })
    expect(afterKo.textureSurprise).toBeUndefined()
  })

  it('triggers the hidden Bungee Gum prosthesis trap when the weakened limb is struck', () => {
    const state = createFightState('hisoka', 'kurapika')
    let weakened = state.player
    for (let i = 0; i < 3; i++)
      weakened = rememberBodyHit(weakened, { zone: 'feet', damage: 10, blocked: false })
    const masked = {
      ...weakened,
      textureSurprise: createTextureSurprise(weakened),
    }
    expect(masked.textureSurprise?.bungeeTrapLimb).toBe('feet')

    const hitTrap = updateTextureOnHit({
      fighter: masked,
      attacker: state.opponent,
      damage: 12,
      blocked: false,
      zone: 'feet',
      kind: 'light',
    })
    expect(hitTrap.trapped).toBe(true)
    expect(hitTrap.textureSurprise).toBeUndefined()
  })

  it('renders asymmetric POV: owner sees truth, opponent sees falsified HP, full Gyo reveals ghost HP + seeping aura, Zetsu collapses it', () => {
    const state = createFightState('hisoka', 'kurapika')
    const hisoka = {
      ...state.player,
      health: 120,
      textureSurprise: {
        ...createTextureSurprise(state.player)!,
        displayedHp: 170,
        maskedLimbs: ['hands' as const],
      },
    }

    const ownerView = textureSurpriseView(hisoka, hisoka, 'owner')
    expect(ownerView.maskActive).toBe(true)
    expect(ownerView.displayedHp).toBe(120)
    expect(ownerView.maskBodyMemory).toBe(false)

    const opponentView = textureSurpriseView(hisoka, state.opponent, 'opponent')
    expect(opponentView.displayedHp).toBe(170)
    expect(opponentView.maskBodyMemory).toBe(true)
    expect(opponentView.maskWounds).toBe(true)
    expect(opponentView.showGhostHp).toBe(false)
    expect(opponentView.auraSeeping).toBe(false)

    const fullGyoObserver = {
      ...state.opponent,
      nen: { ...state.opponent.nen, gyo: true },
      gyoLow: undefined,
    }
    const gyoView = textureSurpriseView(hisoka, fullGyoObserver, 'opponent')
    expect(gyoView.maskActive).toBe(true)
    expect(gyoView.displayedHp).toBe(170)
    expect(gyoView.showGhostHp).toBe(true)
    expect(gyoView.realHp).toBe(120)
    expect(gyoView.auraSeeping).toBe(true)

    const exhausted = { ...hisoka, auraExhausted: true }
    const collapsedView = textureSurpriseView(exhausted, state.opponent, 'opponent')
    expect(collapsedView.maskActive).toBe(false)
    expect(collapsedView.displayedHp).toBe(120)
    expect(collapsedView.maskBodyMemory).toBe(false)
  })
})
