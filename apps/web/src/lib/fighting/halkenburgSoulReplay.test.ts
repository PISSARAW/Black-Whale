import { describe, expect, it } from 'vitest'
import { soulDuel, shootSoul } from './halkenburgSoulTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightSide } from './types'

describe('a transferred consciousness commands its host through the real network and replay entry points', () => {
  it.each([
    ['player', 0],
    ['player', 1],
    ['opponent', 0],
    ['opponent', 1],
  ] as const)(
    'records sleep priority and both occupied bodies for %s with seed %s',
    (side, seed) => {
      let state = mapFrames(shootSoul(soulDuel(side, seed), side), 35)
      const victim = side === 'player' ? 'opponent' : 'player'
      const id = state[victim].halkenburgSoul!.id
      const recorder = createReplayRecorder(state)!
      const left = side === 'player' ? 'left' : 'right'
      const right = side === 'player' ? 'right' : 'left'
      const plan = {
        0: { side, action: 'halkenburg-soul-rest', target: `${id}|sleep` },
        1: { side: victim, action: 'halkenburg-soul-rest', target: `${id}|wake` },
        2: { side: victim, action: 'halkenburg-host-motion', target: `${id}|${left}` },
        8: { side, action: 'halkenburg-soul-rest', target: `${id}|wake` },
        10: { side, action: 'halkenburg-host-motion', target: `${id}|${right}` },
        14: { side, action: 'halkenburg-host-motion', target: `${id}|stay` },
      } as const
      for (let frame = 0; frame < 20; frame++) {
        const entry = plan[frame as keyof typeof plan]
        const preview = entry
          ? applyPvpCommand(state, entry.side, {
              kind: 'arsenal',
              command: { action: entry.action, target: entry.target },
            })
          : state
        const packet: ReplayPacket = [
          1 / 60,
          0,
          0,
          preview !== state ? [panelReplayCommand(state, preview)] : [],
        ]
        const next = executeReplayPacket(state, packet)
        recorder.append(state, packet, next)
        state = next
        if (frame === 1) expect(state[victim].halkenburgSoul?.victimAwake).toBe(true)
        if (frame === 8) expect(state[victim].halkenburgSoul?.victimAwake).toBe(false)
      }
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let frame = 0; frame < 40 && !replay.done; frame++) replay.advance(0.05, 2)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it.each<FightSide>(['player', 'opponent'])(
    'records and predicts ordinary host movement for %s while the original sleeps',
    (side) => {
      let state = mapFrames(shootSoul(soulDuel(side, 1), side), 90)
      const host = side === 'player' ? 'opponent' : 'player'
      const id = state[host].halkenburgSoul!.id
      const direction = side === 'player' ? 'right' : 'left'
      const command = {
        kind: 'arsenal' as const,
        command: {
          action: 'halkenburg-host-motion' as const,
          target: `${id}|${direction}`,
        },
      }
      const actual = applyPvpCommand(state, side, command)
      const predicted = applyPvpCommand(privatePvpState(state, side), 'player', command)
      expect(actual).not.toBe(state)
      expect(predicted.opponent.halkenburgSoul).toEqual(
        privatePvpState(actual, side).opponent.halkenburgSoul,
      )
      const recorder = createReplayRecorder(state)!
      const start = state[host].x
      for (let frame = 0; frame < 16; frame++) {
        const input =
          frame === 0
            ? command
            : { ...command, command: { ...command.command, target: `${id}|stay` } }
        const preview = frame === 0 || frame === 8 ? applyPvpCommand(state, side, input) : state
        const packet: ReplayPacket = [
          1 / 60,
          0,
          0,
          preview !== state ? [panelReplayCommand(state, preview)] : [],
        ]
        const next = executeReplayPacket(state, packet)
        recorder.append(state, packet, next)
        state = next
      }
      expect((state[host].x - start) * (direction === 'right' ? 1 : -1)).toBeGreaterThan(0)
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let frame = 0; frame < 40 && !replay.done; frame++) replay.advance(0.05, 2)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
})
