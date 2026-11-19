import { describe, expect, it } from 'vitest'
import { ghostwriterSetup, fortuneSheet, FORTUNE_SHEET_ID } from './ghostwriterTestSetup'
import { performArsenalAction } from './arsenalExecution'
import { performAuraAttack } from './engine'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpSetup, parsePvpPacket } from './pvp/protocol'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightSide } from './types'

describe('the actual physical fortune survives the recorded command boundary', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'replays the full automatic writing and subsequent reading for %s',
    (side) => {
      let state = ghostwriterSetup(side)
      const recorder = createReplayRecorder(state)!
      for (let frame = 0; frame < 110; frame++) {
        const command =
          frame === 0
            ? { action: 'history-ghostwriter' as const, target: FORTUNE_SHEET_ID }
            : frame === 95
              ? { action: 'document-read' as const, target: FORTUNE_SHEET_ID }
              : undefined
        const preview = command
          ? performArsenalAction({ state, side, command }, performAuraAttack)
          : state
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
      expect(fortuneSheet(state).document?.fortuneWritten?.weeks).toBe(4)
      expect(state[side].documentReading?.text).toContain('Le mois s’achève')
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let i = 0; i < 110 && !replay.done; i++) replay.advance(0.05, 2)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    },
  )
  it('accepts the authored monthly scenario and existing typed action, never a client-written forecast', () => {
    const state = ghostwriterSetup()
    const setup = parsePvpSetup({
      player: 'chrollo',
      opponent: 'theta',
      formatId: 'knockout',
      environment: state.environment,
    })
    expect(setup?.environment.preparation?.resources).toContain('fortunes')
    const packet = {
      sequence: 0,
      input: 0,
      commands: [
        { kind: 'arsenal', command: { action: 'history-ghostwriter', target: FORTUNE_SHEET_ID } },
      ],
    }
    expect(parsePvpPacket(packet)).not.toBeNull()
    expect(
      parsePvpPacket({ ...packet, commands: [{ ...packet.commands[0], verses: 'I win' }] }),
    ).toBeNull()
  })
})
