import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import { runClashParityScenario } from './clashParity'
import {
  compareParityEvents,
  compareParityResults,
  runArenaParityScenario,
  type ArenaParityScenario,
} from './parity'

const setup = {
  playerAt: [0, 0] as const,
  opponentAt: [1.5, 0] as const,
  terrain: initialCombatState().terrain,
}

function kurapikaJab(): ArenaParityScenario {
  return {
    id: 'kurapika-hisoka-standing-light',
    fighters: { player: 'kurapika', opponent: 'hisoka' },
    setup,
    frames: 30,
    commands: [
      {
        frame: 0,
        action: {
          type: 'FIGHTING_MOVE',
          side: 'player',
          fighterId: 'kurapika',
          slot: 'standingLight',
          targetAt: setup.opponentAt,
        },
      },
    ],
  }
}

describe('Arena and Clash parity traces', () => {
  it('records a normalized event for the pilot exchange', () => {
    const trace = runArenaParityScenario(kurapikaJab())

    expect(trace.events).toEqual([
      expect.objectContaining({ attacker: 'player', zone: 'head', technique: 'strike' }),
    ])
    expect(trace.player.score).toBeGreaterThan(0)
  })

  it('is deterministic for identical commands and fixed-step timing', () => {
    expect(runArenaParityScenario(kurapikaJab())).toEqual(runArenaParityScenario(kurapikaJab()))
  })

  it('captures the guard result through the same neutral event contract', () => {
    const scenario = kurapikaJab()
    scenario.commands = [
      { frame: 0, action: { type: 'GUARD', side: 'opponent' } },
      ...scenario.commands,
    ]

    const arena = runArenaParityScenario(scenario)
    const clash = runClashParityScenario(scenario)

    expect(arena.events[0]).toMatchObject({
      attacker: 'player',
      impact: 'blocked',
      points: 0,
    })
    expect(compareParityEvents(arena, clash)).toEqual([])
    // Clash's held guard engages Ken and drains aura; Arena's guard window is currently free.
    expect(compareParityResults(arena, clash).map(({ path }) => path)).toEqual(['opponent.aura'])
  })

  it('matches the unguarded pilot exchange across Arena and Clash', () => {
    const scenario = kurapikaJab()
    const arena = runArenaParityScenario(scenario)
    const clash = runClashParityScenario(scenario)

    expect(clash.events).toHaveLength(1)
    expect(compareParityEvents(arena, clash)).toEqual([])
    expect(compareParityResults(arena, clash)).toEqual([])
  })
})
