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
      parried: true,
      points: 0,
    })
    expect(compareParityEvents(arena, clash)).toEqual([])
    expect(compareParityResults(arena, clash)).toEqual([])
  })

  it('keeps an older guard as a block without upgrading it to a parry', () => {
    const scenario = kurapikaJab()
    const attack = scenario.commands[0]!
    scenario.commands = [
      { frame: 0, action: { type: 'GUARD', side: 'opponent' } },
      { ...attack, frame: 4 },
    ]

    const arena = runArenaParityScenario(scenario)
    const clash = runClashParityScenario(scenario)

    expect(arena.events[0]).toMatchObject({ impact: 'blocked', parried: false })
    expect(compareParityResults(arena, clash)).toEqual([])
  })

  it('matches the unguarded pilot exchange across Arena and Clash', () => {
    const scenario = kurapikaJab()
    const arena = runArenaParityScenario(scenario)
    const clash = runClashParityScenario(scenario)

    expect(clash.events).toHaveLength(1)
    expect(compareParityEvents(arena, clash)).toEqual([])
    expect(compareParityResults(arena, clash)).toEqual([])
    expect(arena.player.position[0]).toBeGreaterThan(setup.playerAt[0])
    expect(arena.opponent.position[0]).toBeGreaterThan(setup.opponentAt[0])
  })

  it('projects Clash lane movement onto Arena local 3D attack axis', () => {
    const scenario = kurapikaJab()
    const opponentAt = [0, 1.5] as const
    scenario.setup = { ...setup, opponentAt }
    scenario.commands = [
      {
        frame: 0,
        action: {
          type: 'FIGHTING_MOVE',
          side: 'player',
          fighterId: 'kurapika',
          slot: 'standingLight',
          targetAt: opponentAt,
        },
      },
    ]

    const arena = runArenaParityScenario(scenario)
    const clash = runClashParityScenario(scenario)

    expect(compareParityResults(arena, clash)).toEqual([])
    expect(arena.player.position[0]).toBe(0)
    expect(arena.player.position[1]).toBeGreaterThan(0)
  })
})
