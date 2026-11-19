import { describe, expect, it } from 'vitest'
import { mapSetup, mapFrames, searchBodyKey } from './dowsingMapTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpSetup, parsePvpPacket } from './pvp/protocol'
import { privatePvpState } from './pvp/view'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

describe('map location crosses replay and P2 boundaries without an injected result', () => {
  it('accepts the real scenario plan and preserves the canonical searched body in P2 prediction', () => {
    const base = mapSetup('opponent')
    expect(
      parsePvpSetup({
        player: 'hisoka',
        opponent: 'kurapika',
        formatId: 'knockout',
        environment: base.environment,
      })?.environment.preparation?.resources,
    ).toContain('maps')
    const command: ArsenalCommand = {
      action: 'dowsing-locate',
      target: searchBodyKey(base, 'opponent'),
    }
    const actual = mapFrames(needleCommand(base, command, 'opponent'))
    const local = mapFrames(needleCommand(privatePvpState(base, 'opponent'), command))
    expect(actual.opponent.dowsingMapReading).toBeTruthy()
    expect(local.player.dowsingMapReading).toEqual(actual.opponent.dowsingMapReading)
    expect(local.player.dowsingMapSearch).toEqual(actual.opponent.dowsingMapSearch)
    const packet = { sequence: 0, input: 0, commands: [{ kind: 'arsenal', command }] }
    expect(parsePvpPacket(packet)).toEqual(packet)
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          {
            kind: 'arsenal',
            command: {
              ...command,
              point: { x: 1, y: 1 },
            },
          },
        ],
      }),
    ).toBeNull()
  })
  it('records actual focus and interruption commands and reproduces the dated point', () => {
    let state = mapSetup('opponent')
    const recorder = createReplayRecorder(state)!
    for (let index = 0; index < 70; index++) {
      const command: ArsenalCommand | undefined =
        index === 0
          ? {
              action: 'dowsing-locate',
              target: searchBodyKey(state, 'opponent'),
            }
          : index === 50
            ? { action: 'dowsing-stop' }
            : undefined
      const preview = command ? needleCommand(state, command, 'opponent') : state
      if (command) expect(preview).not.toBe(state)
      const packet: ReplayPacket = [
        1 / 60,
        0,
        0,
        command ? [panelReplayCommand(state, preview)] : [],
      ]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    expect(state.opponent.dowsingMapReading?.bodyKey).toBe('player:0')
    expect(state.opponent.dowsingMapSearch).toBeUndefined()
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; index < 100 && !replay.done; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})
