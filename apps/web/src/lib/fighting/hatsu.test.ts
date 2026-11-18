import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performAuraAttack, tickFight } from './engine'
import { commandMary } from './bloodyMaryAction'
import { FIGHT_HATSU_AURA_COST } from './hatsu'
import { moveForSlot } from './movesets'
import { recordFightInjuries } from './feitanPain'
import { FIGHTING_ROSTER } from './roster'
import { createBattlefield } from './preparationWorld'
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
    next = tickFight(next, EMPTY_INPUT, { dt: 0.02, opponentInput: EMPTY_INPUT })
  }
  return next
}

describe.each(FIGHTING_ROSTER)('$name Hatsu', ({ id }) => {
  it.each<FightSide>(['player', 'opponent'])(
    'respects the %s side’s Hatsu activation contract',
    (side) => {
      const player = side === 'player' ? id : opponentFor(id)
      const opponent = side === 'opponent' ? id : opponentFor(id)
      const ready = inRange(beginFight(createFight(player, opponent, { mode: 'versus-local' })))
      const auraBefore = ready[side].aura

      const armed = performAttack(ready, side, 'special')
      const target = side === 'player' ? 'opponent' : 'player'
      if (id === 'kalluto') {
        expect(armed[side].attack?.hatsuSource).toBe('kalluto')
        expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
        expect(
          advance(armed, 0.8)[target].plantedPaper?.some((paper) => paper.owner === side),
        ).toBe(true)
        return
      }
      if (id === 'padaille') {
        expect(armed[side].padailleTool).toBe('hammer')
        expect(armed[side].attack?.hatsuSource).toBe('padaille')
        expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
        expect(advance(armed, 0.6)[side].padailleTool).toBe('hammer')
        return
      }
      if (id === 'tserriednich') {
        expect(armed.parallelFuture).toMatchObject({ owner: side, phase: 'preparing' })
        expect(armed[side]).toMatchObject({
          attack: null,
          parallelEyesClosed: true,
          nen: { mode: 'zetsu' },
          aura: auraBefore,
        })
        expect(armed[target].health).toBe(ready[target].health)
        return
      }
      if (id === 'phinks') {
        expect(armed[side].cyclotronWindup).toEqual({ frame: 0 })
        expect(armed[side].attack).toBeNull()
        expect(armed[side].aura).toBe(auraBefore)
        const wound = advance(armed, 0.6)
        expect(wound[side].hatsuEffects.cyclotronTurns).toBe(1)
        expect(wound[target].health).toBe(ready[target].health)
        return
      }
      if (id === 'mizaistom') {
        expect(armed[target].crossGame).toMatchObject({ owner: side, phase: 'warning' })
        expect(armed[side].attack).toBeNull()
        expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
        expect(advance(armed, 0.4)[target].health).toBe(ready[target].health)
        return
      }
      if (id === 'zakuro') {
        expect(armed).toBe(ready) // No blood can leave an unwounded body.
        const wounded = commandMary({ state: ready, side, command: 'bleed' }, performAuraAttack)
        const deployed = performAttack(wounded, side, 'special')
        expect(deployed[side].bloodyMary?.tendril?.phase).toBe('flying')
        expect(deployed[side].attack).toBeNull()
        expect(deployed[side].aura).toBe(
          wounded[side].aura - moveForSlot(id, 'neutralSpecial')!.auraCost,
        )
        expect(advance(deployed, 0.7)[target].maryCapture?.owner).toBe(side)
        expect(deployed[target].health).toBe(ready[target].health)
        return
      }
      if (id === 'basho') {
        expect(armed[side].bashoPoem).toMatchObject({
          ready: false,
          effect: 'ignite-punched-target',
        })
        expect(armed[side].attack).toBeNull()
        expect(armed[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
        expect(advance(armed, 1.1)[side].bashoPoem?.ready).toBe(true)
        expect(armed[target].health).toBe(ready[target].health)
        return
      }
      if (id === 'longhi') {
        expect(armed.moonlight?.offer).toMatchObject({ issuer: side, recipient: target })
        expect(armed.moonlight?.active).toBeUndefined()
        expect(armed[side].attack).toBeNull()
        expect(armed[side].aura).toBe(auraBefore)
        expect(armed[target].health).toBe(ready[target].health)
        return
      }
      if (id === 'machi') {
        expect(armed).toBe(ready)
        const wounded = {
          ...ready,
          [side]: { ...ready[side], openWounds: 1, health: ready[side].health - 15 },
        }
        const suturing = performAttack(wounded, side, 'special')
        expect(suturing[side].attack?.moveId).toBe('machi:neutralSpecial')
        expect(suturing[side].aura).toBe(auraBefore - moveForSlot(id, 'neutralSpecial')!.auraCost)
        expect(advance(suturing, 0.6).impact).toBeNull()
        return
      }
      if (id === 'voconte') {
        expect(armed[side].x).toBe(ready[side].x)
        expect(armed.voconteDoors?.networks[side]?.pending?.open).toBe(true)
        return
      }
      if (['sayird', 'cluck', 'luini', 'halkenburg'].includes(id)) {
        expect(armed).toBe(ready)
        expect(armed[side].aura).toBe(auraBefore)
        return // These abilities require real scenario resources, tested in preparation.test.ts.
      }
      if (id === 'lynch') {
        expect(armed[side].attack).toBeNull()
        expect(armed[side].lynchQuestion?.id).toBe('identity')
        expect(armed[side].aura).toBe(auraBefore)
        expect(advance(armed, 0.4).impact).toBeNull()
        return
      }
      if (id === 'bonolenov') {
        expect(armed[side].attack).toBeNull()
        expect(armed[side].battleCantabile?.preparation?.piece).toBe('prologue')
        expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
        expect(advance(armed, 0.4).impact).toBeNull()
        return
      }
      if (id === 'illumi') {
        expect(armed[side].attack?.kind).toBe('special')
        expect(armed[side].aura).toBe(auraBefore - 40)
        expect(armed[side].attack?.hatsuSource).toBe('illumi')
        expect(moveForSlot('illumi', 'neutralSpecial')?.tuning.damage).toBe(0)
        return
      }
      if (id === 'rihan') {
        expect(armed[side].predator?.watching).toBe(true)
        expect(armed[side].attack).toBeNull()
        expect(armed[side].aura).toBe(auraBefore)
        expect(advance(armed, 0.4).impact).toBeNull()
        return
      }

      if (id === 'furykov') {
        expect(armed[side].comboMaster).toEqual({ alert: null })
        expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
        expect(advance(armed, 0.4).impact).toBeNull()
        return
      }
      if (id === 'bill') {
        expect(armed).toBe(ready)
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

      if (id === 'camilla') {
        expect(armed).toBe(ready)
        expect(armed[side].aura).toBe(auraBefore)
        return
      }

      if (id === 'hinrigh') {
        expect(armed[side].attack).toBeNull()
        expect(armed[side].aura).toBe(auraBefore - 20)
        expect(armed[side].biohazard?.objects[0].phase).toBe('transforming')
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
        home.battlefield = createBattlefield(home.environment)
        const summoned = performAttack(home, side, 'special')
        expect(summoned.lsdf?.[side]).toBeDefined()
        expect(summoned[side].attack).toBeNull()
        expect(summoned[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
        expect(advance(summoned, 0.4).impact).toBeNull()
        return
      }

      if (id === 'feitan') {
        expect(armed).toBe(ready)
        const wounded = recordFightInjuries(ready, {
          ...ready,
          [side]: { ...ready[side], health: ready[side].health - 20 },
        })
        const wrapped = advance(performAttack(wounded, side, 'special'), 0.4)
        expect(wrapped[side].hatsuEffects.painPacker).toMatchObject({
          armour: true,
          packedDamage: 20,
        })
        expect(wrapped[side].health).toBe(ready[side].health - 20)
        expect(wrapped.impact).toBeNull()
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

      if (id === 'leorio') {
        expect(armed[side].attack?.moveId).toBe('leorio:neutralSpecial')
        expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
        const travelling = advance(armed, 0.4)
        expect(travelling.projectiles.some((projectile) => projectile.remotePunch)).toBe(true)
        expect(travelling.impact).toBeNull()
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
    },
  )
})
