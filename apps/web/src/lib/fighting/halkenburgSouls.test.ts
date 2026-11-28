import { describe, expect, it } from 'vitest'
import { soulDuel, shootSoul } from './halkenburgSoulTestSetup'
import { halkenburgSoulPool, reconcileHalkenburgSouls } from './halkenburgSouls'
import { mapFrames } from './dowsingMapTestSetup'
import { nextRound, tickFight, performAuraAttack, createFight } from './engine'
import { projectHanzo } from './hanzoProjection'
import { guestProjection, mergeGuestProjection, type RosterGuest } from './rosterGuests'
import { arsenalOptions } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import type { ArsenalCommand } from './retrospectiveTypes'
import { privatePvpState } from './pvp/view'
import { halkenburgHatsu } from './hatsu/halkenburg'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function performArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}

describe('Halkenburg exchanges the chosen consciousness with the real pierced body', () => {
  it('includes Halkenburg and each real ready supporter in the random pool', () => {
    const state = soulDuel()
    expect(halkenburgSoulPool(state, 'player')).toEqual([
      { kind: 'fighter', owner: 'player', member: 0 },
      { kind: 'supporter', id: 'player:supporter:0' },
      { kind: 'supporter', id: 'player:supporter:1' },
      { kind: 'supporter', id: 'player:supporter:2' },
    ])
  })
  it('does not donate an experimental guest’s real team leader as a proxy for that guest', () => {
    const base = soulDuel()
    const state = { ...base, player: createFight('kurapika', 'hisoka').player }
    const guest: RosterGuest = {
      id: 'guest:halkenburg',
      owner: 'player',
      role: 'puppet',
      phase: 'acting',
      fighter: base.player,
      frames: 1000,
      cooldown: 0,
    }
    const projected = guestProjection(state, guest)
    expect(halkenburgSoulPool(projected, 'player').every((body) => body.kind === 'supporter')).toBe(
      true,
    )
    const struck = shootSoul(projected)
    const merged = mergeGuestProjection({ ...state, rosterGuests: [guest] }, struck, guest)
    expect(merged.opponent.halkenburgSoul?.id).toContain('guest:halkenburg')
    expect(merged.player.halkenburgSleeping).toBeUndefined()
    expect(merged.rosterGuestContext).toBeUndefined()
  })
  it.each<FightSide>(['player', 'opponent'])(
    'keeps a supporter asleep beyond 120 frames for %s',
    (side) => {
      const target = side === 'player' ? 'opponent' : 'player'
      const base = soulDuel(side, 0)
      const struck = shootSoul(base, side)
      const exchange = struck[target].halkenburgSoul!
      expect(exchange.donor).toEqual({ kind: 'supporter', id: `${side}:supporter:2` })
      expect(struck[target].health).toBe(base[target].health)
      expect(struck[target].knockdownFrames).toBe(0)
      expect(struck.impact?.damage).toBe(0)
      expect(struck.impact?.points).toBe(0)
      const held = mapFrames(struck, 240)
      expect(held[target].halkenburgSoul).toEqual(exchange)
      expect(held[target].hatsuEffects.possessedFrames).toBe(1)
      expect(
        held.battlefield!.entities.find((entry) => entry.id === `${side}:supporter:2`),
      ).toMatchObject({
        sleepingFrames: 1,
        halkenburgSleeping: exchange.id,
      })
      expect(held[side].halkenburgSleeping).toBeUndefined()
      expect(held[target].id).toBe(base[target].id)
      expect(held[target].health).toBe(struck[target].health)
    },
  )
  it.each<FightSide>(['player', 'opponent'])(
    'sleeps Halkenburg’s actual body and lets his consciousness move its host for %s',
    (side) => {
      const target = side === 'player' ? 'opponent' : 'player'
      const struck = mapFrames(shootSoul(soulDuel(side, 1), side), 90)
      const exchange = struck[target].halkenburgSoul!
      expect(exchange.donor).toEqual({ kind: 'fighter', owner: side, member: 0 })
      expect(struck[side].halkenburgSleeping).toBe(exchange.id)
      const direction = side === 'player' ? 'right' : 'left'
      const command = {
        action: 'halkenburg-host-motion' as const,
        target: `${exchange.id}|${direction}`,
      }
      expect(
        arsenalOptions(struck, side).find((option) => option.command.target === command.target)
          ?.ready,
      ).toBe(true)
      const walking = performArsenalCommand(struck, side, command)
      const moved = mapFrames(walking, 6)
      expect(
        (moved[target].x - walking[target].x) * (direction === 'right' ? 1 : -1),
      ).toBeGreaterThan(0)
      expect(moved[side].x).toBe(walking[side].x)
      expect(moved[target].health).toBe(walking[target].health)
      const stopped = performArsenalCommand(moved, side, {
        ...command,
        target: `${exchange.id}|stay`,
      })
      expect(mapFrames(stopped, 3)[target].x).toBe(stopped[target].x)
      expect(performArsenalCommand(moved, target, command)).toBe(moved)
    },
  )
  it('keeps the victim’s original controls and Hatsu from commanding the occupied body', () => {
    const state = mapFrames(shootSoul(soulDuel()), 90)
    const changed = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, left: true, aura: true, hatsu: true },
    })
    expect(changed.opponent.x).toBe(state.opponent.x)
    expect(changed.opponent.nen).toEqual(state.opponent.nen)
    expect(
      performAuraAttack({
        state,
        side: 'opponent',
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(state)
    const recovered = { ...state, opponent: { ...state.opponent, hitStun: 0 } }
    expect(halkenburgHatsu.onFrame(recovered).opponent.hitStun).toBe(0)
  })
  it('occupies Hanzo’s actual sleeping body instead of his distant projection', () => {
    const base = soulDuel()
    const projected = projectHanzo({ ...createFight('halkenburg', 'hanzo').opponent, x: 49 })
    const state = { ...base, player: { ...base.player, x: 40 }, opponent: { ...projected, x: 80 } }
    expect(state.opponent.hanzoProjection?.bodyX).toBe(49)
    const struck = shootSoul(state)
    expect(struck.opponent.halkenburgSoul).toBeDefined()
    expect(struck.opponent.hanzoProjection).toBeUndefined()
    expect(struck.opponent.x).toBe(49)
    expect(struck.opponent.health).toBe(state.opponent.health)
  })
  it('keeps the exact exchange and real sleeping supporter across a round and hitstop', () => {
    const state = shootSoul(soulDuel())
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.opponent.halkenburgSoul).toEqual(state.opponent.halkenburgSoul)
    expect(
      next.battlefield!.entities.find((entry) => entry.halkenburgSleeping)?.halkenburgSleeping,
    ).toBe(state.opponent.halkenburgSoul?.id)
    const frozen = reconcileHalkenburgSouls({ ...next, hitstop: 50 })
    expect(frozen.opponent.hatsuEffects.possessedFrames).toBe(1)
  })
  it('keeps P2’s exchange ID canonical and conceals the donor from the displaced victim', () => {
    const base = soulDuel('opponent', 1)
    const actual = shootSoul(base, 'opponent')
    const local = shootSoul(privatePvpState(base, 'opponent'))
    expect(local.opponent.halkenburgSoul).toEqual(
      privatePvpState(actual, 'opponent').opponent.halkenburgSoul,
    )
    expect(privatePvpState(actual, 'player').player.halkenburgSoul?.donor).toBeUndefined()
    expect(actual.player.halkenburgSoul?.donor).toBeDefined()
  })
})
