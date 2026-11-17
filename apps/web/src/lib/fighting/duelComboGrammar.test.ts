import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { TIERED_SUPER_FLOOR, tieredComboScale } from './comboDamageScale'
import { DUEL_COMBO_FIGHTERS, hasCancelGrammar } from './duelComboProfiles'
import { groundedComboStun } from './groundedComboStun'
import { linkWindow, moveFrameAdvantage } from './moveFrameAdvantage'
import { moveForSlot, movesetFor } from './movesets'
import { setTrainingDummy } from './trainingSession'
import type { FighterMove } from './movesetTypes'
import { EMPTY_INPUT, type FightState, type FighterId, type MoveAction } from './types'

const GRAMMAR_FIGHTERS = DUEL_COMBO_FIGHTERS.filter(hasCancelGrammar)
const slot = (id: string) => id.split(':')[1]

/** Cancel edges plus every link the frame data allows between ground moves. */
function comboGraph(fighter: FighterId): Map<string, string[]> {
  const moves = movesetFor(fighter)!.moves
  const grounded = moves.filter((move) => moveFrameAdvantage(move))
  return new Map(
    moves.map((move) => {
      const frames = moveFrameAdvantage(move)
      const links = frames
        ? grounded.filter((next) => linkWindow(frames, moveFrameAdvantage(next)!) > 0)
        : []
      return [move.id, [...move.cancelInto, ...links.map((next) => next.id)]]
    }),
  )
}

function findCycle(graph: Map<string, string[]>): string[] | null {
  const state = new Map<string, 'open' | 'done'>()
  const visit = (id: string, path: string[]): string[] | null => {
    if (state.get(id) === 'open') return [...path, id]
    if (state.get(id) === 'done') return null
    state.set(id, 'open')
    for (const next of graph.get(id) ?? []) {
      const cycle = visit(next, [...path, id])
      if (cycle) return cycle
    }
    state.set(id, 'done')
    return null
  }
  for (const id of graph.keys()) {
    const cycle = visit(id, [])
    if (cycle) return cycle
  }
  return null
}

function move(fighter: FighterId, name: Parameters<typeof moveForSlot>[1]): FighterMove {
  return moveForSlot(fighter, name)!
}

describe('tiered cancel grammar', () => {
  it('covers every profile except the four recovery links into slow techniques', () => {
    const outside = DUEL_COMBO_FIGHTERS.filter((fighter) => !hasCancelGrammar(fighter))
    expect(outside.sort()).toEqual(['bonolenov', 'leorio', 'padaille', 'phinks'])
  })

  it.each(GRAMMAR_FIGHTERS)('%s: cancels, links and chains never loop', (fighter) => {
    expect(findCycle(comboGraph(fighter))).toBeNull()
  })

  it.each(GRAMMAR_FIGHTERS)('%s: no ground normal links into itself', (fighter) => {
    for (const candidate of movesetFor(fighter)!.moves) {
      const frames = moveFrameAdvantage(candidate)
      if (frames) expect(linkWindow(frames, frames), candidate.id).toBeLessThanOrEqual(0)
    }
  })

  it.each([
    ['kurapika', 'forwardSpecial'],
    ['benjamin', 'neutralSpecial'],
  ] as const)('%s: normal → special → super on hit, special on block', (fighter, superSlot) => {
    const heavy = move(fighter, 'standingHeavy')
    expect(heavy.cancelInto.map(slot)).toEqual(['lowHeavy', 'forwardHeavy', superSlot])
    expect(heavy.cancelOnBlockInto.map(slot)).toEqual(['lowHeavy', 'forwardHeavy'])
    expect(move(fighter, 'standingLight').cancelOnBlockInto.map(slot)).toEqual([
      'standingHeavy',
      'forwardLight',
      'lowHeavy',
      'forwardHeavy',
    ])
    for (const ender of ['lowHeavy', 'forwardHeavy'] as const) {
      expect(move(fighter, ender).cancelInto.map(slot)).toEqual([superSlot])
      expect(move(fighter, ender).cancelOnBlockInto).toEqual([])
    }
    expect(move(fighter, superSlot).cancelInto).toEqual([])
    expect(move(fighter, 'airLight').cancelInto.map(slot)).toEqual(['airHeavy'])
  })

  it('scales damage after two full hits, with a higher floor for supers', () => {
    expect([1, 2, 3, 4, 6].map((hits) => tieredComboScale(hits, false))).toEqual([
      1, 1, 0.9, 0.8, 0.6,
    ])
    expect(tieredComboScale(20, false)).toBe(0.1)
    expect(tieredComboScale(20, true)).toBe(TIERED_SUPER_FLOOR)
  })

  it('keeps full grounded hitstun for the grammar and decays it for others', () => {
    const fight = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
    const options = { defender: fight.opponent, hitstun: 20, comboHits: 6 }
    const attacking = (state: FightState, side: 'player' | 'opponent'): FightState['player'] => ({
      ...state[side],
      attack: { ...state[side].attack!, moveId: `${state[side].id}:standingLight` },
    })
    const kurapika = performMove({ state: fight, side: 'player', action: 'light' })
    expect(groundedComboStun({ ...options, attacker: attacking(kurapika, 'player') })).toBe(20)
    const phinks = beginFight(createFight('phinks', 'kurapika', { mode: 'versus-local' }))
    const struck = performMove({ state: phinks, side: 'player', action: 'light' })
    expect(groundedComboStun({ ...options, attacker: attacking(struck, 'player') })).toBe(8)
  })
})

/** Plays each step as soon as the engine admits it, against a guarding dummy. */
function blockString(fighter: FighterId, steps: readonly [MoveAction, object][]): string[] {
  let state = beginFight(createFight(fighter, 'bill', { mode: 'training' }))
  state = setTrainingDummy(state, { behavior: 'guard' })
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 49 } }
  // Guard well before the first strike, so it is an ordinary block and not a parry.
  for (let i = 0; i < 20; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  const played: string[] = []
  for (let i = 0; i < 240 && played.length < steps.length; i++) {
    const [action, held] = steps[played.length]
    const input = { ...EMPTY_INPUT, ...held }
    const next = performMove({ state, side: 'player', action, input })
    if (next.player.attack && next.player.attack !== state.player.attack) {
      // A follow-up must interrupt the previous attack: a cancel, not a restart.
      const cancelled = played.length === 0 || state.player.attack !== null
      played.push(`${slot(next.player.attack.moveId!)}${cancelled ? '' : ' (after recovery)'}`)
      state = next
    }
    state = tickFight(state, input, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  }
  return played
}

describe('tiered grammar in the engine', () => {
  it.each(GRAMMAR_FIGHTERS)('%s: cancels a blocked chain into the sweep', (fighter) => {
    const played = blockString(fighter, [
      ['light', {}],
      ['heavy', {}],
      ['heavy', { down: true }],
    ])
    expect(played).toEqual(['standingLight', 'standingHeavy', 'lowHeavy'])
  })
})
