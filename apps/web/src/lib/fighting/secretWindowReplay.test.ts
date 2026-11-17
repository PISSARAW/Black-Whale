import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack } from './engine'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightState } from './types'

function recordedDuel(far = false) {
  const base = beginFight(
    createFight('hisoka', 'musse', { mode: 'versus-local', formatId: 'knockout' }),
  )
  let state: FightState = {
    ...base,
    player: { ...base.player, x: far ? 22 : 42 },
    opponent: { ...base.opponent, x: 48 },
  }
  const recorder = createReplayRecorder(state)!
  function packet(entry: ReplayPacket) {
    const next = executeReplayPacket(state, entry)
    recorder.append(state, entry, next)
    state = next
  }
  return {
    recorder,
    get state() {
      return state
    },
    command(run: (state: FightState) => FightState) {
      const next = run(state)
      expect(next).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, next)]])
    },
    frames(count: number) {
      for (let index = 0; index < count; index++) packet([1 / 60, 0, 0, []])
    },
  }
}

describe('Secret Window P2 and replay boundaries', () => {
  it('replays the P2 shoulder application, actual remote words and a voluntary stop', () => {
    const run = recordedDuel(true)
    run.command((state) =>
      applyPvpCommand(state, 'opponent', { kind: 'arsenal', command: { action: 'window-listen' } }),
    )
    run.frames(35)
    run.command((state) =>
      applyPvpCommand(state, 'player', { kind: 'talk', words: 'Une voix derrière la porte.' }),
    )
    expect(privatePvpState(run.state, 'opponent').player.secretWindowListening?.heard?.text).toBe(
      'Une voix derrière la porte.',
    )
    expect(privatePvpState(run.state, 'player').opponent.secretWindowListening).toBeUndefined()
    run.command((state) =>
      applyPvpCommand(state, 'opponent', {
        kind: 'arsenal',
        command: { action: 'window-stop-listening' },
      }),
    )
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(run.recorder.snapshot())))
    for (let index = 0; !replay.done && index < 100; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(run.state))
  })
  it('records physical touch, real speech, private P2 observation and explicit recall deterministically', () => {
    const run = recordedDuel()
    run.command((state) => performAttack(state, 'opponent', 'special'))
    run.frames(35)
    expect(run.state.opponent.secretWindow?.targetMember).toBe(0)
    run.command((state) => applyPvpCommand(state, 'player', { kind: 'talk', words: 'Bonjour' }))
    const view = privatePvpState(run.state, 'opponent')
    expect(view.player.secretWindow?.target).toBe('opponent')
    expect(view.player.secretWindow?.heard?.text).toBe('Bonjour')
    expect(privatePvpState(run.state, 'player').opponent.secretWindow).toBeUndefined()
    run.command((state) =>
      applyPvpCommand(state, 'opponent', {
        kind: 'arsenal',
        command: { action: 'window-recall' },
      }),
    )
    expect(run.state.opponent.secretWindow).toBeUndefined()
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(run.recorder.snapshot())))
    for (let index = 0; !replay.done && index < 100; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(run.state))
  })
})
