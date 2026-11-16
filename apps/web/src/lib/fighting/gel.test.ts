import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { hatsuFor, hatsuSourceFor } from './hatsu'
import { activeHitbox } from './frameData'
import { addChrolloPage, CHROLLO_USE } from './chrolloBook'
import { finisherReady, moveById, moveForSlot, movesetFor } from './movesets'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

function duel(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'gel' : 'hisoka', side === 'player' ? 'hisoka' : 'gel', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function advance(state: FightState, frames: number, opponentInput: FightInput = EMPTY_INPUT) {
  for (let i = 0; i < frames; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput })
  }
  return state
}
const SPECIALS = ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial'] as const

describe('Gel’s confirmed snake arm', () => {
  it('retains four extended arm strikes, with no invented finisher or defensive ability', () => {
    const moveset = movesetFor('gel')!
    expect(moveset.moves).toHaveLength(14)
    expect(moveset.moves.filter((move) => move.category === 'special')).toHaveLength(4)
    expect(moveForSlot('gel', 'finisher')).toBeNull()
    expect(moveById('gel:finisher')).toBeNull()
    const light = moveForSlot('gel', 'standingLight')!
    for (const slot of SPECIALS) {
      const move = moveForSlot('gel', slot)!
      expect(move.kind).toBe('special')
      expect(move.tuning.reach).toBeGreaterThan(light.tuning.reach)
      expect(move.canon.evidence).toBe('gameplay-abstraction')
      expect(move.nameEn).not.toMatch(/venom|poison|lethal|protect|shedding/i)
    }
    expect(hatsuSourceFor(duel().player, 'gel:neutralSpecial')).toBe('gel')
  })

  it.each(['player', 'opponent'] as const)(
    'applies no poison, aura drain or lasting restraint for %s',
    (side) => {
      for (const slot of SPECIALS) {
        const state = duel(side)
        const target = side === 'player' ? 'opponent' : 'player'
        const move = moveForSlot('gel', slot)!
        const started = performAuraAttack({
          state,
          side,
          kind: move.kind,
          moveId: move.id,
          auraCharged: false,
        })
        expect(started[side].attack?.moveId).toBe(move.id)
        expect(started[side].aura).toBe(100 - move.auraCost)
        const struck = advance(started, 55)
        expect(struck[target].health).toBeLessThan(state[target].health)
        expect(struck.projectiles).toHaveLength(0)
        const wound = struck[target].health
        const result = advance(struck, 180)
        expect(result[target].health).toBe(wound)
        expect(result[target].aura).toBe(100)
        expect(result[target].hatsuEffects).not.toHaveProperty('venomFrames')
        expect(result[target].hatsuEffects.restrainedFrames).toBe(0)
        expect(result[target].hatsuEffects.forcedZetsuFrames).toBe(0)
        expect(result[target].nen.mode).toBe('ten')
      }
    },
  )

  it('does not recreate venom when Skill Hunter uses the copied arm', () => {
    const state = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    state.player = {
      ...state.player,
      x: 40,
      aura: 100,
      chrolloBook: addChrolloPage(state.player.chrolloBook!, 'gel'),
    }
    state.opponent = { ...state.opponent, x: 50, aura: 100 }
    const started = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: CHROLLO_USE,
      auraCharged: false,
    })
    expect(started.player.attack?.hatsuSource).toBe('gel')
    const result = advance(started, 220)
    expect(result.opponent.health).toBeLessThan(state.opponent.health)
    expect(result.opponent.aura).toBe(100)
    expect(result.opponent.hatsuEffects).not.toHaveProperty('venomFrames')
    expect(result.opponent.hatsuEffects.restrainedFrames).toBe(0)
  })

  it('hits with the arm beyond normal jab range, without firing a projectile', () => {
    const state = duel()
    state.opponent.x = 60
    const jab = advance(performMove({ state, side: 'player', action: 'light' }), 60)
    expect(jab.opponent.health).toBe(state.opponent.health)
    const reach = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(reach.player.attack?.moveId).toBe('gel:forwardSpecial')
    const active = {
      ...reach.player,
      attack: {
        ...reach.player.attack!,
        frame: moveForSlot('gel', 'forwardSpecial')!.tuning.startup,
      },
    }
    expect(activeHitbox(active)).not.toBeNull()
    const hit = advance(reach, 60)
    expect(hit.opponent.health).toBeLessThan(state.opponent.health)
    expect(hit.projectiles).toHaveLength(0)
  })

  it('allows ordinary guard and startup interruption of the arm', () => {
    const state = advance(duel(), 12, { ...EMPTY_INPUT, guard: true })
    const arm = performMove({ state, side: 'player', action: 'special' })
    const guarded = advance(arm, 55, { ...EMPTY_INPUT, guard: true })
    const hit = advance(performMove({ state: duel(), side: 'player', action: 'special' }), 55)
    expect(guarded.opponent.health).toBeGreaterThan(hit.opponent.health)
    expect(guarded.impact?.blocked).toBe(true)
    const close = duel()
    close.opponent.x = 46
    const startup = performMove({ state: close, side: 'player', action: 'special' })
    const faster = performMove({ state: startup, side: 'opponent', action: 'light' })
    const interrupted = advance(faster, 55)
    expect(interrupted.player.health).toBeLessThan(close.player.health)
    expect(interrupted.opponent.health).toBe(close.opponent.health)
  })

  it('does not create buffs, debuffs or drain through its Hatsu hooks', () => {
    const ready = duel()
    const hatsu = hatsuFor('gel')
    for (const blocked of [false, true]) {
      const struck = hatsu.onImpact({
        state: ready,
        side: 'player',
        defenderSide: 'opponent',
        source: 'gel',
        blocked,
        concealed: false,
      })
      expect(struck).toBe(ready)
      expect(hatsu.onFrame(struck)).toBe(ready)
    }
    expect(hatsu.onTrigger({ state: ready, side: 'player', source: 'gel' })).toBe(ready)
  })

  it.each(['player', 'opponent'] as const)(
    'rejects H and the removed legacy finisher, even while buffering for %s',
    (side) => {
      const state = duel(side)
      expect(finisherReady(state, side)).toBe(false)
      expect(performMove({ state, side, action: 'finisher' })).toBe(state)
      for (const hitStun of [0, 10]) {
        const interrupted = { ...state, [side]: { ...state[side], hitStun } }
        const result = performAuraAttack({
          state: interrupted,
          side,
          kind: 'special',
          moveId: 'gel:finisher',
          auraCharged: false,
        })
        expect(result).toBe(interrupted)
      }
    },
  )
})
