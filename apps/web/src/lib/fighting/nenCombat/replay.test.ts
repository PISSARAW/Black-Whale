import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { EMPTY_INPUT } from '../types'
import { createReplayRecorder } from '../fightReplayRecorder'
import { executeReplayPacket } from '../fightReplayCommands'
import { packReplayInput } from '../fightReplayInput'
import { decodeFightReplay } from '../fightReplayCodec'
import { createReplayPlayer } from '../fightReplayPlayer'
import { fightReplayHash } from '../fightReplayHash'
import type { ReplayPacket } from '../fightReplayTypes'

describe('advanced Nen input playback', () => {
  it('reconstructs focused Gyo, weak sight, paid defensive Ko and En from recorded inputs', () => {
    let state = beginFight(createFight('hinrigh', 'hisoka', { mode: 'versus-local' }))
    const recorder = createReplayRecorder(state)!
    const choices = [
      { gyo: true, focusHands: true },
      { gyo: true, down: true },
      { aura: true, gyo: true, focusHead: true },
      { aura: true, guard: true, gyo: true, focusTorso: true },
      { en: true },
    ]
    for (const choice of choices) {
      const packet: ReplayPacket = [1 / 60, packReplayInput({ ...EMPTY_INPUT, ...choice }), 0, []]
      const after = executeReplayPacket(state, packet)
      recorder.append(state, packet, after)
      state = after
      const replay = decodeFightReplay(JSON.stringify(recorder.snapshot()))
      const player = createReplayPlayer(replay)
      while (!player.done) player.advance(1 / 60)
      expect(player.error).toBe('')
      expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
    }
    expect(state.player.nen.en).not.toBeNull()
  })
})
