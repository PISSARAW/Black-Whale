import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT } from './types'
import { auraFlowRate } from './nen'
import { bodyMemoryRyuDrain, rememberBodyHit } from './bodyMemory'
import { tsk17TickDamage } from './tsk17'
import { advanceBashoHaiku, BASHO_BURN_AURA_DPS, BASHO_BURN_HP_DPS } from './bashoHaiku'
import { FIGHT_FPS } from './fightClock'
import { nenTransferFrames } from './nenTransfer'
import { resolvedDamage } from './combatDamage'
import { syncChrolloBook } from './chrolloDeck'
import { buildTextureMask } from './textureSurpriseMask'
import { attachMusseOwl } from './musseWindowUpgrades'
import {
  activateErigeronSurge,
  advanceZodiacAndHeirUpgrades,
  applyBodyAndSoulTruth,
  applyErigeronCatalyst,
  applyGelConstriction,
  applyGelVenom,
  ERIGERON_BODY_MEMORY_DRAIN,
  GEL_CONSTRICTION_DRAIN,
  GEL_VENOM_TRANSFER_PENALTY,
  issueCrossGameYellow,
  lynchConfessionIntent,
  MIZAISTOM_RED_STASIS_FRAMES,
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
  it('Bill Erigeron Surge doubles Ten regen and forced Zetsu recovery', () => {
    const base = beginFight(createFight('bill', 'hisoka', { mode: 'versus-local' })).player
    expect(auraFlowRate(base)).toBeCloseTo(1.4, 5)
    const surged = activateErigeronSurge(base)
    expect(auraFlowRate(surged)).toBeCloseTo(2.8, 5)

    const exhaustedZetsu = {
      ...surged,
      auraExhausted: true,
      nen: { ...surged.nen, mode: 'zetsu' as const },
    }
    expect(auraFlowRate(exhaustedZetsu)).toBe(20)
  })

  it('Bill Erigeron Catalyst doubles poison/burn ticks and raises Body Memory Ryu drain to +5/s', () => {
    const fight = beginFight(createFight('bill', 'hisoka', { mode: 'versus-local' }))
    let victim = fight.opponent
    for (let i = 0; i < 3; i++) victim = rememberBodyHit(victim, 'hands', 10, false)
    victim = { ...victim, nen: { ...victim.nen, ryu: { hands: 0.7 } }, tskPoisoned: true, haikuBurn: true }

    expect(bodyMemoryRyuDrain(victim)).toBe(3)
    const normalPoison = tsk17TickDamage(victim)

    const catalyzed = applyErigeronCatalyst(victim)
    expect(bodyMemoryRyuDrain(catalyzed)).toBe(ERIGERON_BODY_MEMORY_DRAIN)
    expect(tsk17TickDamage(catalyzed)).toBeCloseTo(normalPoison * 2, 6)

    const burned = advanceBashoHaiku({ ...fight, opponent: catalyzed })
    expect(catalyzed.health - burned.opponent.health).toBeCloseTo((BASHO_BURN_HP_DPS * 2) / FIGHT_FPS, 6)
    expect(catalyzed.aura - burned.opponent.aura).toBeCloseTo((BASHO_BURN_AURA_DPS * 2) / FIGHT_FPS, 6)
  })

  it('Lynch Body and Soul strips In & Texture Surprise, reveals Chrollo deck, and telegraphs intent', () => {
    let state = beginFight(createFight('lynch', 'chrollo', { mode: 'versus-local' }))
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        nen: { ...state.opponent.nen, in: true, ko: 'hands' },
        textureSurprise: {
          ...buildTextureMask(state.opponent),
          deceivedName: 'Chrollo',
          deceivedCategory: 'specialist',
          appliedFrame: 0,
        },
        chrolloBook: syncChrolloBook({ pages: [], page: 0, open: true, bookmark: null }),
      },
    }
    const revealed = applyBodyAndSoulTruth(state, 'player')
    expect(revealed.opponent.nen.in).toBe(false)
    expect(revealed.opponent.textureSurprise).toBeUndefined()
    expect(revealed.opponent.chrolloBook?.revealedSlots).toEqual([0, 1, 2, 3])
    expect(lynchConfessionIntent(revealed, 'player')).toBe('ko')
  })

  it('Mizaistom Cross Game turns Yellow into Red stasis on breach and prevents direct hits', () => {
    let state = beginFight(createFight('mizaistom', 'hisoka', { mode: 'versus-local' }))
    state = issueCrossGameYellow(state, 'player')
    expect(state.crossGameCard?.phase).toBe('yellow')

    // Retreating / blocking is legal (facing -1 for opponent, so right = retreat)
    const obeyed = advanceZodiacAndHeirUpgrades(state, {
      player: EMPTY_INPUT,
      opponent: { ...EMPTY_INPUT, right: true, guard: true },
    })
    expect(obeyed.crossGameCard?.phase).toBe('yellow')

    // Advancing (left for facing -1) triggers Red Card stasis
    const breached = advanceZodiacAndHeirUpgrades(obeyed, {
      player: EMPTY_INPUT,
      opponent: { ...EMPTY_INPUT, left: true },
    })
    expect(breached.crossGameCard?.phase).toBe('red')
    expect(breached.crossGameCard?.remainingFrames).toBe(MIZAISTOM_RED_STASIS_FRAMES)
    expect(breached.opponent.crossGameStasis).toBe(true)

    const damage = resolvedDamage({
      attacker: breached.player,
      defence: {
        fighter: breached.opponent,
        blocked: false,
        parried: false,
        avoided: false,
        invulnerable: false,
      },
      base: 20,
      zone: 'torso',
      kind: 'heavy',
      damageScale: 1,
      openingMultiplier: 1,
    })
    expect(damage).toBe(0)
  })

  it('Rihan Predator observes persistent constructs and releases weak (1.5s) or lethal (3s) Predator', () => {
    let state = beginFight(createFight('rihan', 'musse', { mode: 'versus-local' }))
    state = attachMusseOwl(state, 'opponent')
    expect(observableAuraManifestation(state, 'opponent')).toBe('musse-owl')

    const weakReady = { ...state, player: { ...state.player, predatorStudyFrames: PREDATOR_EARLY_FRAMES } }
    expect(predatorCertaintyTier(weakReady.player)).toBe('weak')
    const afterWeak = releaseCertaintyPredator(weakReady, 'player')
    expect(predatorHatsuFactor(afterWeak.opponent)).toBe(PREDATOR_WEAK_FACTOR)
    expect(afterWeak.musseOwl?.active).toBe(true)

    const lethalReady = { ...state, player: { ...state.player, predatorStudyFrames: PREDATOR_FULL_FRAMES } }
    expect(predatorCertaintyTier(lethalReady.player)).toBe('lethal')
    const afterLethal = releaseCertaintyPredator(lethalReady, 'player')
    expect(predatorHatsuFactor(afterLethal.opponent)).toBe(0)
    expect(afterLethal.musseOwl).toBeUndefined()
  })

  it('Gel Venom slows nenTransferFrames by +2f and Constriction drains 15 aura', () => {
    const state = beginFight(createFight('gel', 'hisoka', { mode: 'versus-local' }))
    const baseTransfer = nenTransferFrames(state.opponent)
    const poisoned = applyGelVenom(state.opponent)
    expect(nenTransferFrames(poisoned)).toBe(baseTransfer + GEL_VENOM_TRANSFER_PENALTY)

    const ready = {
      ...state,
      player: { ...state.player, aura: 40 },
      opponent: { ...state.opponent, aura: 60 },
    }
    const constricted = applyGelConstriction(ready, 'player')
    expect(constricted.player.aura).toBe(40 + GEL_CONSTRICTION_DRAIN)
    expect(constricted.opponent.aura).toBe(60 - GEL_CONSTRICTION_DRAIN)
  })
})
