import { expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { nenCombatDoctrine, nenSpacingDirection } from './nenCombatDoctrine'
import { prioritiseNenSlots, doctrineOpponentNen } from './nenDoctrineActions'
import { moveOpponent } from './opponentMovement'
import { ARSENAL_AI, arsenalAttackSlots } from './arsenalAi'
import { martialSlots } from './arsenalAiTypes'
import { forceZetsu } from './nen'
import { moveForSlot } from './movesets'
import type { FighterId, MoveSlot } from './types'

function duel(id: FighterId, gap = 8) {
  const state = beginFight(createFight('hisoka', id, { mode: 'versus-ai' }))
  return {
    ...state,
    frame: 80,
    player: { ...state.player, x: 30 },
    opponent: { ...state.opponent, x: 30 + gap, aura: 100 },
  }
}

it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s uses its Nen range in real movement while keeping only its authored actions',
  (id) => {
    const state = duel(id)
    const [near, far] = nenCombatDoctrine(state.opponent).range
    for (const [gap, direction] of [
      [near - 1, -1],
      [(near + far) / 2, 0],
      [far + 2, 1],
    ]) {
      const fighter = { ...state.opponent, x: 30 + gap }
      const next = moveOpponent(fighter, state.player)
      expect(Math.sign(next.x - fighter.x), `${id}:${gap}`).toBe(-direction || 0)
      expect(nenSpacingDirection(fighter, { gap, health: 100 })).toBe(direction)
    }
    const context = { state, gap: 8, roll: 0.7 }
    const authored = [...new Set([...(ARSENAL_AI[id]?.(context) ?? []), ...martialSlots(context)])]
    expect([...arsenalAttackSlots(context)].sort()).toEqual(authored.sort())
  },
)

it('makes emission keep distance, reinforcement close in, and preserves personal exceptions', () => {
  const franklin = duel('franklin').opponent
  const phinks = duel('phinks').opponent
  expect(nenSpacingDirection(franklin, { gap: 14, health: 100 })).toBe(-1)
  expect(nenSpacingDirection(phinks, { gap: 14, health: 100 })).toBe(1)
  expect(nenCombatDoctrine(duel('leorio').opponent).range[0]).toBeLessThan(
    nenCombatDoctrine(franklin).range[0],
  )
  expect(nenCombatDoctrine(duel('bill').opponent).range).not.toEqual(
    nenCombatDoctrine(phinks).range,
  )
  expect(nenCombatDoctrine(duel('theta').opponent).affinity).toBe('unknown')
  expect(nenCombatDoctrine(duel('theta').opponent).range[0]).toBeGreaterThan(10)
  expect(nenSpacingDirection({ ...franklin, aura: 5 }, { gap: 14, health: 100 })).toBe(1)
  expect(nenSpacingDirection(forceZetsu(franklin), { gap: 14, health: 100 })).toBe(1)
})

it('prefers real ranged applications and close heavy strikes without manufacturing a new slot', () => {
  const slots: MoveSlot[] = ['standingLight', 'standingHeavy', 'neutralSpecial']
  const ranged = prioritiseNenSlots({ state: duel('franklin', 25), gap: 25, roll: 0.5 }, slots)
  expect(ranged[0]).toBe('neutralSpecial')
  const close = prioritiseNenSlots({ state: duel('phinks', 7), gap: 7, roll: 0.5 }, slots)
  expect(close[0]).toBe('standingHeavy')
  expect([...close].sort()).toEqual([...slots].sort())
})

it('can target an observed weak zone with Gyo, without reading hidden commands or affinity', () => {
  const state = duel('hisoka', 8)
  const slots: MoveSlot[] = ['standingLight', 'lowLight', 'standingHeavy', 'lowHeavy']
  const zone = moveForSlot('hisoka', slots[1])!.tuning.targetZone
  const shares = { head: 0.3, torso: 0.3, hands: 0.3, feet: 0.3, [zone]: 0.1 }
  state.player = { ...state.player, nen: { ...state.player.nen, ryu: shares, in: true } }
  const context = { state, gap: 8, roll: 0.5 }
  expect(prioritiseNenSlots(context, slots)).toEqual(slots)
  const watched = {
    ...state,
    opponent: { ...state.opponent, nen: { ...state.opponent.nen, gyo: true } },
  }
  const observed = prioritiseNenSlots({ ...context, state: watched }, slots)
  expect(moveForSlot('hisoka', observed[0])!.tuning.targetZone).toBe(zone)
  const hidden = {
    ...state,
    player: {
      ...state.player,
      nenOwner: 'franklin' as const,
      nen: { ...state.player.nen, ryu: { head: 1 } },
    },
  }
  expect(prioritiseNenSlots({ ...context, state: hidden }, slots)).toEqual(slots)
})

it('prepares reinforcement at contact and emission at range, while respecting availability', () => {
  const close = duel('phinks', 7)
  expect(doctrineOpponentNen(close)?.opponent.nen.ryu.hands).toBeGreaterThan(0.5)
  const ranged = duel('franklin', 25)
  expect(doctrineOpponentNen(ranged)?.opponent.nen.mode).toBe('ren')
  expect(doctrineOpponentNen({ ...ranged, opponent: { ...ranged.opponent, aura: 4 } })).toBeNull()
  expect(doctrineOpponentNen({ ...close, opponent: forceZetsu(close.opponent) })).toBeNull()
  expect(doctrineOpponentNen({ ...close, opponent: { ...close.opponent, hitStun: 12 } })).toBeNull()
})
