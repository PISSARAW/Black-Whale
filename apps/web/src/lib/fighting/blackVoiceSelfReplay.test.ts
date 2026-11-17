import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import type { FightState } from './types'
import type { ArsenalActionId } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

describe('self-manipulation is a simulated mission in full replays', () => {
  it('replays the actual pin, phone, aura budget, autonomous kicks and aftermath without rewriting HP', () => {
    const base = beginFight(
      createFight('chrollo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        x: 44,
        aura: 100,
        chrolloBook: { ...base.player.chrolloBook!, page: 1 },
      },
      opponent: { ...base.opponent, x: 49 },
    }
    const recorder = createReplayRecorder(state)!
    function packet(entry: ReplayPacket) {
      const after = executeReplayPacket(state, entry)
      recorder.append(state, entry, after)
      state = after
    }
    function use(action: ArsenalActionId) {
      const after = performArsenalCommand(state, 'player', { action })
      expect(after).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, after)]])
    }
    for (const action of [
      'voice-arm',
      'voice-self-implant',
      'voice-phone',
      'voice-autopilot',
    ] as const)
      use(action)
    const health = state.opponent.health
    for (
      let frame = 0;
      frame < 1500 && state.phase === 'fighting' && state.player.blackVoiceAutopilot;
      frame++
    )
      packet([1 / 60, 0, 0, []])
    expect(state.opponent.health).toBeLessThan(health)
    expect(state.player.blackVoiceAutopilot).toBeUndefined()
    expect(state.player.blackVoiceAftermath?.memory).toBe('none')
    expect(recorder.error).toBe('')
    const playback = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    while (!playback.done) playback.advance(0.1)
    expect(playback.error).toBe('')
    expect(fightReplayHash(playback.state)).toBe(fightReplayHash(state))
  })
})
