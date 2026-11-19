import { describe, expect, it } from 'vitest'
import {
  needleFaceSetup,
  needleCommand,
  beginNeedleFace,
  needleFrames,
} from './illumiNeedleFaceTestSetup'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { privatePvpState } from './pvp/view'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

describe('three forehead pins use actual commands in replays and P2 prediction', () => {
  it('reproduces P2’s selected attack and P1’s physical removal without recording an outcome', () => {
    let state = needleFaceSetup('opponent')
    const recorder = createReplayRecorder(state)!
    for (let frame = 0; frame < 90; frame++) {
      const action: ArsenalCommand | undefined =
        frame === 0
          ? { action: 'illumi-needle-mode', target: 'face-warp' }
          : frame === 1
            ? { action: 'illumi-needle-apply' }
            : frame === 60
              ? { action: 'needle-face-remove' }
              : undefined
      const side = frame === 60 ? 'player' : 'opponent'
      const preview = action ? needleCommand(state, action, side) : state
      if (action) expect(preview).not.toBe(state)
      const packet: ReplayPacket = [
        1 / 60,
        0,
        0,
        action ? [panelReplayCommand(state, preview)] : [],
      ]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
      if (frame === 50) expect(state.player.needleFace?.needles).toHaveLength(3)
    }
    const player = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; index < 100 && !player.done; index++) player.advance(0.05, 2)
    expect(player.error).toBe('')
    expect(player.done).toBe(true)
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
  })
  it('retains canonical physical pin IDs when P2 starts the same real attack locally', () => {
    const base = needleFaceSetup('opponent')
    const actual = needleFrames(beginNeedleFace(base, 'opponent'))
    const predicted = needleFrames(beginNeedleFace(privatePvpState(base, 'opponent')))
    expect(predicted.opponent.needleFace?.needles).toEqual(actual.player.needleFace?.needles)
    expect(predicted.opponent.needleFace?.owner).toBe('player')
    expect(predicted.opponent.needlePuppet).toBeUndefined()
  })
})
