import { describe, expect, it } from 'vitest'
import { COMBAT_FIGHTERS } from './combatRoutes'
import { hasCancelGrammar } from './duelComboProfiles'
import { beginFight, createFight, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { cornerPushbackTransfer } from './combatDamage'
import { linkWindow, moveFrameAdvantage } from './moveFrameAdvantage'
import { moveForSlot } from './movesets'
import type { FighterMove } from './movesetTypes'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const GROUND: readonly MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]

function groundMoves(fighter: string): FighterMove[] {
  return GROUND.map((slot) => moveForSlot(fighter as never, slot)).filter(
    (move): move is FighterMove => Boolean(move && moveFrameAdvantage(move)),
  )
}

/** Whether `to` can be reached from `from` through on-hit cancels between ground normals. */
function chainsBack(moves: readonly FighterMove[], from: FighterMove, to: FighterMove): boolean {
  const byId = new Map(moves.map((move) => [move.id, move]))
  const seen = new Set<string>()
  const stack = [from.id]
  while (stack.length) {
    const id = stack.pop()!
    if (id === to.id) return true
    if (seen.has(id)) continue
    seen.add(id)
    for (const next of byId.get(id)?.cancelInto ?? []) if (byId.has(next)) stack.push(next)
  }
  return false
}

describe('grounded links never close a chain loop for fighters without hitstun decay', () => {
  // groundedComboStun skips grammar fighters: their combos are bounded only by an acyclic
  // cancel graph, so a link back into a move that chains to the linking move is an infinite.
  for (const fighter of COMBAT_FIGHTERS.filter(hasCancelGrammar))
    it(fighter, () => {
      const moves = groundMoves(fighter)
      const loops: string[] = []
      for (const first of moves)
        for (const next of moves)
          if (
            linkWindow(moveFrameAdvantage(first)!, next.tuning) > 0 &&
            chainsBack(moves, next, first)
          )
            loops.push(`${first.slot} > ${next.slot}`)
      expect(loops).toEqual([])
    })
})

function feitanFight(): FightState {
  const state = beginFight(
    createFight('feitan', 'chrollo', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { stageId: 'heavens-arena', arenaInteractions: false },
    }),
  )
  return {
    ...state,
    phase: 'fighting',
    player: { ...state.player, x: 46 },
    opponent: { ...state.opponent, x: 50 },
  }
}

/** Plays slots as early as the engine accepts each one, against a guard held after the first hit. */
function playRoute(slots: readonly MoveSlot[], start: FightState = feitanFight()) {
  let state = start
  let index = 0
  let hits = 0
  let blocked = 0
  let last = state.impact?.sequence ?? 0
  for (let frame = 0; frame < 240; frame++) {
    const move = index < slots.length ? moveForSlot('feitan', slots[index]) : null
    if (move && (index === 0 || hits + blocked >= index)) {
      if (canStartFighterAttack(state.player, move.kind, move.id)) {
        state = performTrainingAction({
          state,
          side: 'player',
          action: combatRouteAction(slots[index]),
          input: combatRouteInput(slots[index], state.player.facing),
        })
        index++
      }
    }
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: hits > 0 },
    })
    if (state.impact && state.impact.sequence !== last) {
      last = state.impact.sequence
      if (state.impact.attacker === 'player') {
        if (state.impact.blocked) blocked++
        else hits++
      }
    }
  }
  return { hits, blocked }
}

describe('Feitan jab loop', () => {
  it('lets the guard return before the jab after a forward light, instead of looping forever', () => {
    const loop: MoveSlot[] = ['standingLight', 'standingHeavy', 'forwardLight']
    const { hits } = playRoute([...loop, ...loop, ...loop])
    expect(hits).toBe(3)
  })
  it('keeps the authored chain itself', () => {
    expect(
      playRoute(['lowLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'lowHeavy']),
    ).toEqual({ hits: 5, blocked: 0 })
  })
})

describe('corner pushback', () => {
  it('hands the refused grounded pushback to the attacker instead of pinning the combo at the wall', () => {
    const base = feitanFight()
    const attacker = { ...base.player, x: 85 }
    const defender = { ...base.opponent, x: 92 }
    // The defender pushed against the right wall refuses more pushback than the space left.
    expect(defender.x + 7.5).toBeGreaterThan(93)
    // The refused pushback is taken by the attacker, pushed back away from the defender.
    expect(cornerPushbackTransfer(attacker, defender, 7.5).x).toBe(78.5)
    const pinned = cornerPushbackTransfer(attacker, { ...defender, x: 93 }, 7)
    expect(pinned.x).toBe(78)
  })

  it('keeps the pushback unrefused while the defender has room before the wall', () => {
    const base = feitanFight()
    const attacker = { ...base.player, x: 10 }
    const defender = { ...base.opponent, x: 40 }
    expect(cornerPushbackTransfer(attacker, defender, 7.5)).toEqual(attacker)
  })

  it('stops the repeating grounded route once the corner pushback transfers to the attacker', () => {
    // Same Feitan jab chain as the loop test, but with the defender already against the wall.
    let state = feitanFight()
    state = {
      ...state,
      phase: 'fighting',
      player: { ...state.player, x: 85 },
      opponent: { ...state.opponent, x: 92 },
    }
    const loop: MoveSlot[] = ['standingLight', 'standingHeavy', 'forwardLight']
    const { hits } = playRoute([...loop, ...loop, ...loop], state)
    expect(hits).toBeLessThanOrEqual(3)
  })
})
