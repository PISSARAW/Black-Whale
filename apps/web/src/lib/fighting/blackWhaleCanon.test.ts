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
  TSERRIEDNICH_PUNISH_ZETSU_FRAMES,
  VOCONTE_DEFAULT_DESTINATION,
} from './blackWhaleCanonUpgrades'

describe('6 canonical Black Whale upgrades: Camilla, Kurapika, Melody, Benjamin, Tserriednich, Voconte', () => {
  it('Camilla Cat’s Name activates only in Zetsu or under TSK-17 poison, not in Ten/Ken', () => {
    const base = beginFight(createFight('camilla', 'hisoka', { mode: 'versus-local' }))
    const deadInTen = { ...base, player: { ...base.player, health: 0 } }
    expect(camillaCatsNameEligible(deadInTen.player)).toBe(false)
    expect(
      camillaHatsu.onDeath?.({ state: deadInTen, victimSide: 'player', killerSide: 'opponent' }).catsName,
    ).toBeUndefined()

    const deadInZetsu = {
      ...deadInTen,
      player: { ...deadInTen.player, nen: { ...deadInTen.player.nen, mode: 'zetsu' as const } },
    }
    expect(camillaCatsNameEligible(deadInZetsu.player)).toBe(true)
    expect(
      camillaHatsu.onDeath?.({ state: deadInZetsu, victimSide: 'player', killerSide: 'opponent' }).catsName,
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
          held: { source: 'cluck' as const, ability: 'birds', used: false, loanedTo: null },
        },
      },
    }
    expect(kurapikaDolphinTrapped(trapped.player)).toBe(true)
    const ticked = advanceBlackWhaleCanonUpgrades(trapped, { player: EMPTY_INPUT, opponent: EMPTY_INPUT })
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
        seiyaku: { kind: 'no-ken-surge' as const, active: true },
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

  it('Benjamin inherits royal guard Kameo Hatsu (Musse, Furykov, Rihan) and ignores non-guards', () => {
    const benjamin = beginFight(createFight('benjamin', 'hisoka', { mode: 'versus-local' })).player
    const afterMusse = inheritBenjaminGuardKameo(benjamin, 'musse')
    expect(afterMusse.benjaminInheritedHatsus).toEqual(['musse'])
    const afterNonGuard = inheritBenjaminGuardKameo(afterMusse, 'hisoka')
    expect(afterNonGuard.benjaminInheritedHatsus).toEqual(['musse'])
  })

  it('Tserriednich Nen Beast marks liars (call/Texture Surprise/In) and seals Hatsu + forces Zetsu at 3 marks', () => {
    let state = beginFight(createFight('tserriednich', 'hisoka', { mode: 'versus-local' }))
    state = advanceBlackWhaleCanonUpgrades(state, {
      player: EMPTY_INPUT,
      opponent: { ...EMPTY_INPUT, call: true },
    })
    expect(state.opponent.tserriednichLieMarks).toBe(1)

    let foe = recordTserriednichLie(state.opponent, 2)
    foe = recordTserriednichLie(foe, 3)
    expect(foe.tserriednichLieMarks).toBe(TSERRIEDNICH_MAX_LIES)
    expect(foe.tserriednichBeastSealed).toBe(true)
    expect(foe.burstZetsuFrames).toBe(TSERRIEDNICH_PUNISH_ZETSU_FRAMES)

    const hatsuAttempt = {
      ...foe,
      attack: { kind: 'special' as const, frame: 5, impacted: false, hatsuSource: 'hisoka' as const },
    }
    expect(nenAttackFactor(hatsuAttempt, 'special')).toBe(0)
  })

  it('Voconte Door transitions the fight arena to another Black Whale room', () => {
    const state = beginFight(createFight('voconte', 'hisoka', { mode: 'versus-local' }))
    const transitioned = triggerVoconteArenaTransition(state)
    expect(transitioned.arenaId).toBe(VOCONTE_DEFAULT_DESTINATION)
    expect(transitioned.voconteRoomTransitionCount).toBe(1)
  })
})
