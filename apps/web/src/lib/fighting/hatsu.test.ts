import { recordFightInjuries } from './feitanPain'
import { moveForSlot } from './movesets'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { FIGHT_HATSU_AURA_COST } from './hatsu'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FightSide, type FightState, type FighterId } from './types'

function opponentFor(id: FighterId): FighterId {
  return id === 'kurapika' ? 'chrollo' : 'kurapika'
}

function inRange(state: FightState): FightState {
  return {
    ...state,
    player: { ...state.player, x: 40 },
    opponent: { ...state.opponent, x: 50 },
  }
}

function advance(state: FightState, seconds: number): FightState {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, EMPTY_INPUT, 0.02)
  }
  return next
}

describe.each(FIGHTING_ROSTER)('$name Hatsu', ({ id }) => {
  it.each<FightSide>(['player', 'opponent'])('is usable by the %s side', (side) => {
    const player = side === 'player' ? id : opponentFor(id)
    const opponent = side === 'opponent' ? id : opponentFor(id)
    const ready = inRange(beginFight(createFight(player, opponent)))
    const auraBefore = ready[side].aura

    const armed = performAttack(ready, side, 'special')
    if (id === 'lynch') {
      expect(armed[side].attack).toBeNull()
      expect(armed[side].lynchQuestion?.id).toBe('identity')
      expect(armed[side].aura).toBe(auraBefore)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }
    if (id === 'rihan') {
      expect(armed[side].predator?.watching).toBe(true)
      expect(armed[side].attack).toBeNull()
      expect(armed[side].aura).toBe(auraBefore)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }


    if (id === 'melody') {
      expect(armed[side].attack).toBeNull()
      expect(armed[side].melodyPerformance).toBeDefined()
      expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
      const singing = advance(armed, 0.4)
      const listener = side === 'player' ? 'opponent' : 'player'
      expect(singing[listener].hatsuEffects.entrancedFrames).toBe(1)
      expect(singing.impact).toBeNull()
      return
    }

    if (id === 'furykov') {
      expect(armed[side].comboMaster).toEqual({ alert: null })
      expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }
    if (id === 'shizuku') {
      expect(armed[side].attack?.hatsuSource).toBe('shizuku')
      expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
      expect(advance(armed, 0.8).impact).toBeNull()
      return
    }

    if (id === 'theta') {
      expect(armed[side].attack?.kind).toBe('ranged')
      expect(armed[side].attack?.hatsuSource).toBeNull()
      expect(armed[side].aura).toBe(auraBefore)
      return
    }

    if (id === 'bill') {
      expect(armed).toBe(ready)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }

    if (id === 'camilla') {
      expect(armed).toBe(ready)
      expect(armed[side].aura).toBe(auraBefore)
      return
    }

    if (id === 'feitan') {
      expect(armed).toBe(ready)
      const wounded = recordFightInjuries(ready, {
        ...ready,
        [side]: { ...ready[side], health: 80 },
      })
      const wrapped = advance(performAttack(wounded, side, 'special'), 0.4)
      expect(wrapped[side].hatsuEffects.painPacker).toMatchObject({
        armour: true,
        packedDamage: 20,
      })
      expect(wrapped[side].health).toBe(80)
      expect(wrapped.impact).toBeNull()
      return
    }

    if (id === 'chrollo') {
      expect(armed[side].attack?.moveId).toBe('chrollo:neutralSpecial')
      expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
      const close = {
        ...armed,
        player: { ...armed.player, x: 40 },
        opponent: { ...armed.opponent, x: 46 },
      }
      expect(advance(close, 0.4).impact?.attacker).toBe(side)
      return
    }

    if (id === 'leorio') {
      expect(armed[side].attack?.moveId).toBe('leorio:neutralSpecial')
      expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
      const travelling = advance(armed, 0.4)
      expect(travelling.projectiles.some((projectile) => projectile.remotePunch)).toBe(true)
      expect(travelling.impact).toBeNull()
      return
    }

    if (id === 'yokotani') {
      expect(armed).toBe(ready)
      const home: FightState = {
        ...ready,
        environment: {
          stageId: 'heilly-hideout',
          morenaPresent: true,
          unlawfulIntruders: { player: side !== 'player', opponent: side !== 'opponent' },
        },
      }
      const summoned = performAttack(home, side, 'special')
      expect(summoned.lsdf?.[side]).toBeDefined()
      expect(summoned[side].attack).toBeNull()
      expect(summoned[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
      expect(advance(summoned, 0.4).impact).toBeNull()
      return
    }

    if (id === 'biscuit') {
      expect(armed[side].biscuitTrueForm).toBe(true)
      expect(armed[side].attack).toBeNull()
      expect(armed[side].aura).toBe(auraBefore)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }
    if (id === 'musse') {
      expect(armed[side].aura).toBe(auraBefore - moveForSlot('musse', 'neutralSpecial')!.auraCost)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }
    if (id === 'hanzo') {
      expect(armed[side].hanzoProjection).toBeDefined()
      expect(armed[side].attack).toBeNull()
      expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
      expect(advance(armed, 0.4).impact).toBeNull()
      return
    }
    expect(armed[side].attack?.kind).toBe('special')
    expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
    expect(advance(armed, 0.4).impact?.attacker).toBe(side)
  })
})
