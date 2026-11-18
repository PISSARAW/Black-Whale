import { describe, expect, it } from 'vitest'
import { createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { commandMary } from './bloodyMaryAction'
import { panelReplayCommand } from './fightReplayPanels'
import { createFightEnvironment } from './fightEnvironment'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpPacket } from './pvp/protocol'
import type { ReplayCommand, ReplayPacket } from './fightReplayTypes'

describe('two-encounter commands through the replay and network boundaries', () => {
  it.each(['luini', 'zakuro'] as const)(
    'deterministically replays %s’s newly available application',
    (id) => {
      const environment = createFightEnvironment({
        preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
      })
      let state = createFight(id, 'hisoka', { mode: 'versus-local', environment })
      const recorder = createReplayRecorder(state)!
      function packet(commands: ReplayCommand[] = [], dt = 1 / 60) {
        const packet: ReplayPacket = [dt, 0, 0, commands]
        const after = executeReplayPacket(state, packet)
        recorder.append(state, packet, after)
        state = after
      }
      packet([{ kind: 'start' }], 0)
      if (id === 'luini') {
        const select = performArsenalAction(
          {
            state,
            side: 'player',
            command: { action: 'luini-select', target: 'door:player:destination' },
          },
          performAuraAttack,
        )
        packet([panelReplayCommand(state, select)], 0)
        const anchor = performArsenalAction(
          { state, side: 'player', command: { action: 'luini-travel' } },
          performAuraAttack,
        )
        packet([panelReplayCommand(state, anchor)], 0)
        for (let i = 0; i < 20; i++) packet()
        const depart = performArsenalAction(
          { state, side: 'player', command: { action: 'luini-travel' } },
          performAuraAttack,
        )
        packet([panelReplayCommand(state, depart)], 0)
        expect(state.player.luiniPassage).toBeDefined()
      } else {
        const bleed = commandMary({ state, side: 'player', command: 'bleed' }, performAuraAttack)
        packet([panelReplayCommand(state, bleed)], 0)
        const scouts = commandMary(
          { state, side: 'player', command: 'scout-wall' },
          performAuraAttack,
        )
        packet([panelReplayCommand(state, scouts)], 0)
        expect(state.player.bloodyMary?.drops).toHaveLength(3)
      }
      for (let i = 0; i < 100; i++) packet()
      const data = decodeFightReplay(JSON.stringify(recorder.snapshot()))
      const replay = createReplayPlayer(data)
      for (let i = 0; i < 500 && !replay.done; i++) replay.advance(0.05, 3)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it('validates commands without accepting a client-supplied body or observation', () => {
    for (const command of [
      { kind: 'mary', command: 'scout-wall' },
      {
        kind: 'arsenal',
        command: { action: 'luini-select', target: 'ceiling:player:destination' },
      },
      { kind: 'arsenal', command: { action: 'luini-emerge' } },
    ]) {
      const packet = { sequence: 0, input: 0, commands: [command] }
      expect(parsePvpPacket(packet)).toEqual(packet)
      expect(
        parsePvpPacket({ ...packet, commands: [{ ...command, luiniPassage: { x: 99 } }] }),
      ).toBeNull()
    }
  })
})
