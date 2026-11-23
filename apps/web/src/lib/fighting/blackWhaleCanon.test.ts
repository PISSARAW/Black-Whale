import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT } from './types'
import { camillaHatsu } from './hatsu/camilla'
import { createKurapika } from './kurapika'
import { nenAttackFactor } from './nen'
import { FIGHT_FPS } from './fightClock'
import {
  advanceBlackWhaleCanonUpgrades,
  camillaCatsNameEligible,
  inheritBenjaminGuardKameo,
  kurapikaDolphinTrapped,
  readMelodyHeartbeat,
  recordTserriednichLie,
  STEALTH_DOLPHIN_LIFE_DPS,
  triggerVoconteArenaTransition,
  TSERRIEDNICH_MAX_LIES,
} from './blackWhaleCanonUpgrades'

describe('6 canonical Black Whale upgrades: Camilla, Kurapika, Melody, Benjamin, Tserriednich, Voconte', () => {
  it('Camilla Cat’s Name follows an attributed death without inventing a Zetsu condition', () => {
    const base = beginFight(createFight('camilla', 'hisoka', { mode: 'versus-local' }))
    const deadInTen = { ...base, player: { ...base.player, health: 0 } }
    expect(camillaCatsNameEligible(deadInTen.player)).toBe(true)
    expect(
      camillaHatsu.onDeath?.({ state: deadInTen, victimSide: 'player', killerSide: 'opponent' })
        .catsName,
    ).toBeDefined()

    const deadInZetsu = {
      ...deadInTen,
      player: { ...deadInTen.player, nen: { ...deadInTen.player.nen, mode: 'zetsu' as const } },
    }
    expect(camillaCatsNameEligible(deadInZetsu.player)).toBe(true)
    expect(
      camillaHatsu.onDeath?.({ state: deadInZetsu, victimSide: 'player', killerSide: 'opponent' })
        .catsName,
    ).toBeDefined()

    const deadByTsk = { ...deadInTen, player: { ...deadInTen.player, tskPoisoned: true } }
    expect(camillaCatsNameEligible(deadByTsk.player)).toBe(true)
  })

  it('Kurapika Stealth Dolphin locks Emperor Time and continuously drains HP while holding an unused stolen Hatsu', () => {
    const state = beginFight(createFight('kurapika', 'cluck', { mode: 'versus-local' }))
    const trapped = {
      ...state,
      player: {
        ...state.player,
        kurapika: {
          ...createKurapika(),
          emperorTime: false,
          held: {
            source: 'cluck' as const,
            victim: 'opponent' as const,
            moveId: 'cluck:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    expect(kurapikaDolphinTrapped(trapped.player)).toBe(true)
    const ticked = advanceBlackWhaleCanonUpgrades(trapped, {
      player: EMPTY_INPUT,
      opponent: EMPTY_INPUT,
    })
    expect(ticked.player.kurapika?.emperorTime).toBe(true)
    expect(trapped.player.health - ticked.player.health).toBeCloseTo(
      STEALTH_DOLPHIN_LIFE_DPS / FIGHT_FPS,
      6,
    )
  })

  it('Melody passively reads heartbeat for bluffs, critical On, mental fatigue, and active Seiyaku', () => {
    const state = beginFight(createFight('melody', 'hisoka', { mode: 'versus-local' }))
    const stressed = {
      ...state,
      opponent: {
        ...state.opponent,
        health: 25,
        nenMentalFatigue: 4500,
        seiyaku: {
          kind: 'speed' as const,
          remainingFrames: 120,
          backHoldFrames: 0,
          breached: false,
        },
      },
    }
    const reading = readMelodyHeartbeat(stressed, 'player', { ...EMPTY_INPUT, call: true })
    expect(reading).toEqual({
      bluffing: true,
      onNearCritical: true,
      mentalFatigueHigh: true,
      seiyakuActive: true,
    })
  })

  it('Benjamin inherits only from a dead eligible royal guard', () => {
    const benjamin = beginFight(createFight('benjamin', 'hisoka', { mode: 'versus-local' })).player
    expect(inheritBenjaminGuardKameo(benjamin, 'musse')).toBe(benjamin)
    const afterMusse = inheritBenjaminGuardKameo(benjamin, 'musse', true)
    expect(afterMusse.benjaminInheritedHatsus).toEqual(['musse'])
    const afterNonGuard = inheritBenjaminGuardKameo(afterMusse, 'hisoka', true)
    expect(afterNonGuard.benjaminInheritedHatsus).toEqual(['musse'])
  })

  it('Tserriednich Nen Beast records two warnings without inventing the unknown third effect', () => {
    let state = beginFight(createFight('tserriednich', 'hisoka', { mode: 'versus-local' }))
    state = advanceBlackWhaleCanonUpgrades(state, {
      player: EMPTY_INPUT,
      opponent: { ...EMPTY_INPUT, call: true },
    })
    expect(state.opponent.tserriednichLieMarks).toBe(1)

    let foe = recordTserriednichLie(state.opponent, 2)
    foe = recordTserriednichLie(foe, 3)
    expect(foe.tserriednichLieMarks).toBe(TSERRIEDNICH_MAX_LIES)
    expect(foe.tserriednichBeastSealed).toBeUndefined()
    expect(foe.burstZetsuFrames).toBe(0)

    const hatsuAttempt = {
      ...foe,
      attack: {
        kind: 'special' as const,
        frame: 5,
        impacted: false,
        hatsuSource: 'hisoka' as const,
        auraCharged: false,
        concealed: false,
        projectileSpawned: false,
        reversal: false,
      },
    }
    expect(nenAttackFactor(hatsuAttempt, 'special')).toBeGreaterThan(0)
  })

  it('does not bypass Voconte real frames with a direct arena transition', () => {
    const state = beginFight(createFight('voconte', 'hisoka', { mode: 'versus-local' }))
    const transitioned = triggerVoconteArenaTransition(state)
    expect(transitioned).toBe(state)
  })
})
