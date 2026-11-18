import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from '../roster'
import { beginFight, createFight, tickFight } from '../engine'
import { canUseMovesetMove } from '../movesets'
import { applyReplayCommand, executeReplayPacket, initialReplayState } from '../fightReplayCommands'
import { packReplayInput } from '../fightReplayInput'
import { createReplayRecorder } from '../fightReplayRecorder'
import { fightReplayHash } from '../fightReplayHash'
import { observeCombat, supportsQwenDuel } from './observation'
import { createFastController } from './execution'
import { isQwenFighter, offeredMoves, allowedNen } from './catalogue'
import { availableUtilities, plannedUtility, utilityKey } from './utilities'
import { performArsenalAction } from '../arsenalExecution'
import { performAuraAttack } from '../engine'
import { panelReplayCommand } from '../fightReplayPanels'
import type { FightSide, FightState } from '../types'
import type { TacticalPlan } from './protocol'
import type { ReplayCommand } from '../fightReplayTypes'

const roster = FIGHTING_ROSTER.map((fighter) => fighter.id)
const sides = ['player', 'opponent'] as const
describe('Qwen covers the selected roster', () => {
  it('contains exactly 40 real selectable fighters, with no guessed identifiers', () => {
    expect(roster).toHaveLength(40)
    expect(roster.every(isQwenFighter)).toBe(true)
    expect(isQwenFighter('netero')).toBe(false)
  })
  it.each(roster)('%s is available in both seats with native resource checks', (id) => {
    const state = beginFight(createFight(id, id, { mode: 'versus-local' }))
    expect(supportsQwenDuel(state)).toBe(true)
    for (const side of sides) {
      const before = JSON.stringify(state)
      const observed = observeCombat(state, side)
      expect(observed.fighter).toBe(id)
      for (const move of offeredMoves(observed))
        expect(canUseMovesetMove(state, side, move)).toBe(true)
      expect(JSON.stringify(state)).toBe(before)
      state[side].aura = 0
      for (const move of offeredMoves(observeCombat(state, side))) {
        expect(move.auraCost).toBe(0)
        expect(canUseMovesetMove(state, side, move)).toBe(true)
      }
    }
  })
  it('never turns the En policy into a new ability for unqualified fighters', () => {
    expect(allowedNen('hisoka')).not.toContain('en')
    expect(allowedNen('bill')).not.toContain('en')
    expect(allowedNen('hinrigh')).toContain('en')
    expect(allowedNen('phinks')).toContain('en')
  })
  it('keeps Chain Jail unavailable against a non-Spider', () => {
    const state = beginFight(createFight('kurapika', 'bill', { mode: 'versus-local' }))
    state.player.aura = 100
    expect(offeredMoves(observeCombat(state, 'player')).map((move) => move.slot)).not.toContain(
      'neutralSpecial',
    )
  })
})

describe('native panel actions and stale targets', () => {
  it.each(roster)('%s can only select its own currently enabled native panel choices', (id) => {
    const state = beginFight(createFight(id, 'machi', { mode: 'versus-local' }))
    for (const option of availableUtilities(state, 'player')) {
      expect(
        plannedUtility(state, 'player', { goal: 'bait', nen: 'ten', move: option.key }),
      ).toEqual(option.command)
    }
    const forbidden = utilityKey({ action: 'history-use', target: 'invented-hatsu' })
    expect(
      plannedUtility(state, 'player', { goal: 'pressure', nen: 'ten', move: forbidden }),
    ).toBeNull()
  })
  it('cannot turn an old slot into a different target or give Chrollo an unowned Hatsu', () => {
    const state = beginFight(createFight('bill', 'chrollo', { mode: 'versus-local' }))
    const move = utilityKey({ action: 'copied-move', target: 'hisoka:neutralSpecial' })
    expect(plannedUtility(state, 'player', { goal: 'pressure', nen: 'ten', move })).toBeNull()
    expect(plannedUtility(state, 'opponent', { goal: 'pressure', nen: 'ten', move })).toBeNull()
  })
})

describe('40 native controller/replay matchups', () => {
  it.each(roster)(
    '%s advances real combat and replays both sides without state divergence',
    (id) => {
      const opponent = roster[(roster.indexOf(id) + 1) % roster.length]
      let state = createFight(id, opponent, { mode: 'versus-local', formatId: 'knockout' })
      const recorder = createReplayRecorder(state)!
      const initial = state
      state = applyReplayCommand(state, { kind: 'start' })
      recorder.append(initial, [0, 0, 0, [{ kind: 'start' }]], state)
      const controllers = {
        player: createFastController('player'),
        opponent: createFastController('opponent', 42),
      }
      for (let frame = 0; frame < 180 && state.phase === 'fighting'; frame++) {
        const before = state
        const commands: ReplayCommand[] = []
        const inputs = sides.map((side) => controllers[side](state, nativePlan(state, side, frame)))
        for (const decision of inputs) {
          if (decision.command) {
            commands.push(decision.command)
            state = applyReplayCommand(state, decision.command)
          }
          if (decision.utility) {
            const changed = performArsenalAction({ state, ...decision.utility }, performAuraAttack)
            if (changed !== state) commands.push(panelReplayCommand(state, changed))
            state = changed
          }
        }
        state = tickFight(state, inputs[0].input, {
          dt: 1 / 60,
          ai: false,
          opponentInput: inputs[1].input,
        })
        recorder.append(
          before,
          [1 / 60, packReplayInput(inputs[0].input), packReplayInput(inputs[1].input), commands],
          state,
        )
        expect(recorder.error).toBe('')
      }
      const replay = recorder.snapshot()!
      let verified = initialReplayState(replay.setup)
      for (const packet of replay.packets) verified = executeReplayPacket(verified, packet)
      expect(fightReplayHash(verified)).toBe(fightReplayHash(state))
      for (const side of sides) {
        expect(Number.isFinite(state[side].health)).toBe(true)
        expect(state[side].aura).toBeGreaterThanOrEqual(0)
        expect(state[side].aura).toBeLessThanOrEqual(100)
      }
    },
  )
})

function nativePlan(state: FightState, side: FightSide, frame: number): TacticalPlan {
  const observed = observeCombat(state, side)
  const moves = offeredMoves(observed)
  const utilities = observed.utilities ?? []
  if (frame % 120 < 15 && utilities.length)
    return { goal: 'pressure', nen: 'ten', move: utilities[0].key }
  return { goal: 'pressure', nen: 'ten', move: moves[0]?.slot ?? 'none' }
}
