import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { toggleEmperorTime, advanceEmperorClock } from './kurapikaActions'
import { EMPEROR_BLACKOUT_THRESHOLD, EMPEROR_BLACKOUT_FRAMES } from './kurapika'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { CAT_CAPTURE_END, CATS_NAME_FRAMES } from './camillaCat'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function catSequence(kurapika: FightSide = 'player'): FightState {
  const victim = kurapika === 'player' ? 'opponent' : 'player'
  const base = beginFight(
    createFight(
      kurapika === 'player' ? 'kurapika' : 'camilla',
      kurapika === 'player' ? 'camilla' : 'kurapika',
      {
        mode: 'versus-local',
        formatId: 'knockout',
      },
    ),
  )
  const active = toggleEmperorTime(base, kurapika)
  return resolveFightOutcome(
    recordFightDeath(
      {
        ...active,
        [victim]: { ...active[victim], health: 0 },
      },
      { victimSide: victim, killerSide: kurapika, cause: 'strike' },
    ),
  )
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Emperor Time pays for living time during a post-mortem sequence', () => {
  it.each(['player', 'opponent'] as const)(
    'counts actual living frames for %s, then stops at the cat’s fatal capture',
    (side) => {
      const start = catSequence(side)
      const beforeCapture = frames(start, CAT_CAPTURE_END - 1)
      expect(beforeCapture[side].health).toBeGreaterThan(0)
      expect(beforeCapture[side].kurapika?.lifespanFrames).toBe(CAT_CAPTURE_END - 1)
      const captured = frames(beforeCapture, 1)
      expect(captured[side].health).toBe(0)
      expect(captured[side].kurapika?.lifespanFrames).toBe(CAT_CAPTURE_END)
      const done = frames(captured, CATS_NAME_FRAMES - CAT_CAPTURE_END)
      expect(done[side].kurapika?.lifespanFrames).toBe(CAT_CAPTURE_END)
      expect(done[side].kurapika?.emperorTime).toBe(false)
      expect(done.time).toBe(start.time)
      expect(done[side].x).toBe(start[side].x)
    },
  )
  it('does not activate Emperor Time just because the cat is running', () => {
    const active = catSequence()
    const off = {
      ...active,
      player: { ...active.player, kurapika: { ...active.player.kurapika!, emperorTime: false } },
    }
    expect(frames(off, 24).player.kurapika?.lifespanFrames).toBe(0)
  })
  it('retains the real collapse threshold and continues paying while unconscious and alive', () => {
    const start = catSequence()
    const nearLimit = {
      ...start,
      player: {
        ...start.player,
        kurapika: {
          ...start.player.kurapika!,
          continuousFrames: EMPEROR_BLACKOUT_THRESHOLD - 1,
        },
      },
    }
    const collapsed = frames(nearLimit, 1)
    expect(collapsed.player.kurapika?.blackoutFrames).toBe(EMPEROR_BLACKOUT_FRAMES)
    const waiting = frames(collapsed, 10)
    expect(waiting.player.kurapika?.lifespanFrames).toBe(11)
    expect(waiting.player.kurapika?.blackoutFrames).toBe(EMPEROR_BLACKOUT_FRAMES - 10)
  })
  it('never invents post-mortem Emperor Time from a still-loaded Dolphin or blackout', () => {
    const state = catSequence()
    const dead = {
      ...state,
      player: {
        ...state.player,
        health: 0,
        kurapika: {
          ...state.player.kurapika!,
          lifespanFrames: 17,
          blackoutFrames: 50,
          held: {
            source: 'basho' as const,
            victim: 'opponent' as const,
            moveId: 'basho:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const next = advanceEmperorClock(dead)
    expect(next.player.kurapika).toMatchObject({
      lifespanFrames: 17,
      emperorTime: false,
      blackoutFrames: 50,
    })
    expect(next.player.health).toBe(0)
  })
  it('re-simulates the same paid lifespan under different replay frame batches', () => {
    let state = catSequence()
    const recorder = createReplayRecorder(state)!
    for (let i = 0; i < CATS_NAME_FRAMES; i++) {
      const packet: ReplayPacket = [1 / 60, 0, 0, []]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    const replay = createReplayPlayer(recorder.snapshot()!)
    while (!replay.done) replay.advance(0.1)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    expect(replay.state.player.kurapika?.lifespanFrames).toBe(CAT_CAPTURE_END)
  })
})
