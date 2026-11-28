import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { auraFlowRate } from './nen'
import { bodyMemoryRyuDrain, rememberBodyHit } from './bodyMemory'
import { tsk17TickDamage } from './tsk17'
import { advanceBashoHaiku, BASHO_BURN_AURA_DPS, BASHO_BURN_HP_DPS } from './bashoHaiku'
import { FIGHT_FPS } from './fightClock'
import { nenTransferFrames } from './nenTransfer'
import { syncChrolloBook } from './chrolloDeck'
import { buildTextureMask } from './textureSurpriseMask'
import { attachMusseOwl } from './musseWindowUpgrades'
import {
  activateErigeronSurge,
  applyBodyAndSoulTruth,
  applyErigeronCatalyst,
  applyGelConstriction,
  applyGelVenom,
  ERIGERON_BODY_MEMORY_DRAIN,
  GEL_CONSTRICTION_DRAIN,
  GEL_VENOM_TRANSFER_PENALTY,
  issueCrossGameYellow,
  lynchConfessionIntent,
} from './zodiacAndHeirUpgrades'
import {
  observableAuraManifestation,
  PREDATOR_EARLY_FRAMES,
  PREDATOR_FULL_FRAMES,
  PREDATOR_WEAK_FACTOR,
  predatorCertaintyTier,
  predatorHatsuFactor,
  releaseCertaintyPredator,
} from './predatorUpgrades'

describe('5-fighter upgrades: Bill, Lynch, Mizaistom, Rihan, Gel', () => {
  it('does not turn Bill Erigeron into a personal aura-recovery buff', () => {
    const base = beginFight(createFight('bill', 'hisoka', { mode: 'versus-local' })).player
    expect(auraFlowRate(base)).toBeCloseTo(1.4, 5)
    const surged = activateErigeronSurge(base)
    expect(surged).toBe(base)
    expect(auraFlowRate(surged)).toBeCloseTo(1.4, 5)

    const exhaustedZetsu = {
      ...surged,
      auraExhausted: true,
      nen: { ...surged.nen, mode: 'zetsu' as const },
    }
    expect(auraFlowRate(exhaustedZetsu)).toBe(10)
  })

  it('does not let Erigeron catalyse poison, burns, or Body Memory', () => {
    const fight = beginFight(createFight('bill', 'hisoka', { mode: 'versus-local' }))
    let victim = fight.opponent
    for (let i = 0; i < 3; i++)
      victim = rememberBodyHit(victim, { zone: 'hands', damage: 10, blocked: false })
    victim = {
      ...victim,
      nen: { ...victim.nen, ryu: { hands: 0.7 } },
      tskPoisoned: true,
      haikuBurn: true,
    }

    expect(bodyMemoryRyuDrain(victim)).toBe(3)
    const normalPoison = tsk17TickDamage(victim)

    const catalyzed = applyErigeronCatalyst(victim)
    expect(bodyMemoryRyuDrain(catalyzed)).toBe(ERIGERON_BODY_MEMORY_DRAIN)
    expect(catalyzed).toBe(victim)
    expect(tsk17TickDamage(catalyzed)).toBeCloseTo(normalPoison, 6)

    const burned = advanceBashoHaiku({ ...fight, opponent: catalyzed })
    expect(catalyzed.health - burned.opponent.health).toBeCloseTo(BASHO_BURN_HP_DPS / FIGHT_FPS, 6)
    expect(catalyzed.aura - burned.opponent.aura).toBeCloseTo(BASHO_BURN_AURA_DPS / FIGHT_FPS, 6)
  })

  it('Lynch Body and Soul does not strip In, expose a disguise or deck, or predict intent', () => {
    let state = beginFight(createFight('lynch', 'chrollo', { mode: 'versus-local' }))
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        nen: { ...state.opponent.nen, in: true, ko: 'hands' },
        textureSurprise: {
          surface: 'cloth' as const,
          source: 'personal' as const,
          ...buildTextureMask(state.opponent),
        },
        chrolloBook: syncChrolloBook({ pages: [], page: 0, open: true, bookmark: null }),
      },
    }
    const revealed = applyBodyAndSoulTruth(state, 'player')
    expect(revealed.opponent.nen.in).toBe(true)
    expect(revealed.opponent.textureSurprise).toBeDefined()
    expect(revealed.opponent.chrolloBook?.revealedSlots).toBeUndefined()
    expect(lynchConfessionIntent(revealed, 'player')).toBeNull()
  })

  it('does not duplicate canonical Cross Game with a second red-card stun engine', () => {
    const state = beginFight(createFight('mizaistom', 'hisoka', { mode: 'versus-local' }))
    expect(issueCrossGameYellow(state, 'player')).toBe(state)
  })

  it('does not replace Rihan canonical observation sheet with timed weak or lethal tiers', () => {
    let state = beginFight(createFight('rihan', 'musse', { mode: 'versus-local' }))
    state = attachMusseOwl(state, 'opponent')
    expect(observableAuraManifestation(state, 'opponent')).toBe('musse-owl')

    const weakReady = {
      ...state,
      player: { ...state.player, predatorStudyFrames: PREDATOR_EARLY_FRAMES },
    }
    expect(predatorCertaintyTier(weakReady.player)).toBe('none')
    const afterWeak = releaseCertaintyPredator(weakReady, 'player')
    expect(predatorHatsuFactor(afterWeak.opponent)).toBe(PREDATOR_WEAK_FACTOR)
    expect(afterWeak.musseOwl?.active).toBe(true)

    const lethalReady = {
      ...state,
      player: { ...state.player, predatorStudyFrames: PREDATOR_FULL_FRAMES },
    }
    expect(predatorCertaintyTier(lethalReady.player)).toBe('none')
    const afterLethal = releaseCertaintyPredator(lethalReady, 'player')
    expect(predatorHatsuFactor(afterLethal.opponent)).toBe(1)
    expect(afterLethal.musseOwl?.active).toBe(true)
  })

  it('does not invent venom or aura drain for Gel snake arm', () => {
    const state = beginFight(createFight('gel', 'hisoka', { mode: 'versus-local' }))
    const baseTransfer = nenTransferFrames(state.opponent)
    const poisoned = applyGelVenom(state.opponent)
    expect(poisoned).toBe(state.opponent)
    expect(nenTransferFrames(poisoned)).toBe(baseTransfer + GEL_VENOM_TRANSFER_PENALTY)

    const ready = {
      ...state,
      player: { ...state.player, aura: 40 },
      opponent: { ...state.opponent, aura: 60 },
    }
    const constricted = applyGelConstriction(ready, 'player')
    expect(constricted).toBe(ready)
    expect(constricted.player.aura).toBe(40 + GEL_CONSTRICTION_DRAIN)
    expect(constricted.opponent.aura).toBe(60 - GEL_CONSTRICTION_DRAIN)
  })
})
