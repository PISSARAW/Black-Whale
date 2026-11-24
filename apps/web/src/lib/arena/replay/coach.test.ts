import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../../combat/reducer'
import type { CombatEvent, CombatState } from '../../combat/types'
import { moveForSlot } from '../../fighting/movesets'
import { createArenaReplayCoachObserver } from './coach'
import { scanReplayFrames } from './player'
import { ARENA_REPLAY_VERSION, DEFAULT_REPLAY_MATCH, type ArenaReplay } from './types'

const base = positionedState()
const replay: ArenaReplay = {
  version: ARENA_REPLAY_VERSION,
  tickRate: 60,
  ticks: 3,
  setup: {
    playerAt: base.player.position,
    opponentAt: base.opponent.position,
    terrain: base.terrain,
  },
  doctrine: 'counter',
  difficulty: 'initiate',
  match: { ...DEFAULT_REPLAY_MATCH, fighterId: 'kurapika', opponentFighterId: 'hisoka' },
  initialState: base,
  commands: [],
  checksum: '',
}

describe('Arena replay coach', () => {
  it('reports a block recovery that the player light can punish', () => {
    const observer = createArenaReplayCoachObserver(replay)
    const move = moveForSlot('hisoka', 'lowHeavy')
    expect(move).not.toBeNull()
    const after = withEvent(base, combatEvent('blocked', move?.id))
    observer.observe({ tick: 12, before: base, after })

    expect(observer.findings).toEqual([
      expect.objectContaining({
        kind: 'recovery-opportunity',
        eventTick: 12,
        resumeTick: 11,
        moveId: move?.id,
        responseFrames: 4,
      }),
    ])
  })

  it('resumes before the player move whose recovery was punished', () => {
    const observer = createArenaReplayCoachObserver(replay)
    const move = moveForSlot('kurapika', 'standingHeavy')
    expect(move).not.toBeNull()
    const intent = {
      zone: 'torso' as const,
      remaining: 0.2,
      targetAt: base.opponent.position,
      moveId: move?.id,
    }
    const committed = { ...base, player: { ...base.player, intent, cooldown: 0.3 } }
    observer.observe({ tick: 5, before: base, after: committed })
    const hit = combatEvent('clean', 'hisoka:standingLight')
    observer.observe({ tick: 11, before: committed, after: withEvent(committed, hit) })

    expect(observer.findings).toEqual([
      expect.objectContaining({
        kind: 'recovery-punished',
        eventTick: 11,
        resumeTick: 4,
        moveId: move?.id,
      }),
    ])
  })

  it('visits replay frames in one deterministic pass', () => {
    const ticks: number[] = []
    const scanned = scanReplayFrames(replay, (frame) => ticks.push(frame.tick))

    expect(ticks).toEqual([1, 2, 3])
    expect(scanned.clock).toBeGreaterThan(base.clock)
  })
})

function positionedState(): CombatState {
  const state = initialCombatState()
  return {
    ...state,
    player: { ...state.player, position: [0, 0] },
    opponent: { ...state.opponent, position: [1, 0] },
  }
}

function combatEvent(impact: CombatEvent['impact'], moveId?: string): CombatEvent {
  return {
    at: 1,
    attacker: 'opponent',
    zone: 'torso',
    impact,
    points: impact === 'blocked' ? 0 : 1,
    technique: 'strike',
    moveId,
  }
}

function withEvent(state: CombatState, event: CombatEvent): CombatState {
  return { ...state, lastEvent: event }
}
