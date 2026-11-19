import { describe, expect, it } from 'vitest'
import { paperSetup, paperCommand, paperFrames, note } from './paperDocumentTestSetup'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpPacket } from './pvp/protocol'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

describe('semantic paper commands in PvP and recorded fights', () => {
  it('replays the actual sheet, private text preparation, cast, reading and removal', () => {
    let state = paperSetup()
    const recorder = createReplayRecorder(state)!
    const plan: Record<number, ArsenalCommand> = {
      0: { action: 'document-take', target: 'player:scenario-document' },
      1: { action: 'texture-paper', target: 'player:scenario-document' },
      2: { action: 'texture-paper-text', target: 'La surface apparente' },
      3: { action: 'texture-apply' },
      60: { action: 'document-read', target: 'player:scenario-document' },
      61: { action: 'texture-paper-remove', target: 'player:scenario-document' },
    }
    for (let index = 0; index < 90; index++) {
      const command = plan[index]
      const preview = command ? paperCommand(state, command) : state
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
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let step = 0; step < 100 && !replay.done; step++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    expect(note(state).document!.text).toBe('Document 01 · 18:00')
    expect(state.player.documentReading?.text).toBe('La surface apparente')
    expect(note(state).document!.textures).toBeUndefined()
  })
  it('keeps the same physical sheet ID when P2 predicts drawing from an actual kit', () => {
    let state = paperSetup('theta', 'basho')
    state = { ...state, opponent: { ...state.opponent, x: 74 } }
    const command: ArsenalCommand = { action: 'document-draw' }
    const actual = paperCommand(state, command, 'opponent')
    const local = privatePvpState(state, 'opponent')
    const predicted = applyPvpCommand(local, 'player', { kind: 'arsenal', command })
    const actualSheet = actual.battlefield!.entities.find(
      (entry) => entry.document?.holder?.owner === 'opponent',
    )!
    const predictedSheet = predicted.battlefield!.entities.find(
      (entry) => entry.document?.holder?.owner === 'player',
    )!
    expect(predictedSheet.id).toBe(actualSheet.id)
    expect(predicted.player.writingKit?.sheets).toBe(actual.opponent.writingKit?.sheets)
  })
  it('rejects oversized text and client supplied document bodies', () => {
    const packet = {
      sequence: 0,
      input: 0,
      commands: [
        { kind: 'arsenal', command: { action: 'texture-paper-text', target: 'x'.repeat(240) } },
      ],
    }
    expect(parsePvpPacket(packet)).toEqual(packet)
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          { kind: 'arsenal', command: { action: 'texture-paper-text', target: 'x'.repeat(241) } },
        ],
      }),
    ).toBeNull()
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          {
            kind: 'arsenal',
            command: { action: 'document-draw', document: { text: 'free paper' } },
          },
        ],
      }),
    ).toBeNull()
  })
  it('keeps a P2 paper coating’s physical identity in client prediction and authoritative simulation', () => {
    let state = paperSetup('theta', 'hisoka')
    state = { ...state, opponent: { ...state.opponent, x: 26 }, player: { ...state.player, x: 50 } }
    state = paperCommand(
      state,
      { action: 'document-take', target: 'player:scenario-document' },
      'opponent',
    )
    state = paperCommand(
      state,
      { action: 'texture-paper', target: 'player:scenario-document' },
      'opponent',
    )
    state = paperCommand(state, { action: 'texture-paper-text', target: 'P2 surface' }, 'opponent')
    const command: ArsenalCommand = { action: 'texture-apply' }
    const actual = paperFrames(paperCommand(state, command, 'opponent'))
    const local = privatePvpState(state, 'opponent')
    const predicted = paperFrames(applyPvpCommand(local, 'player', { kind: 'arsenal', command }))
    const layer = note(actual).document!.textures![0]
    const predictedLayer = note(predicted).document!.textures![0]
    expect(predictedLayer.id).toBe(layer.id)
    expect(predictedLayer.text).toBe(layer.text)
    expect(predictedLayer.source).toBe('personal')
    expect(predicted.player.aura).toBe(actual.opponent.aura)
  })
})
