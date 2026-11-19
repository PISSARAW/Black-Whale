import { describe, expect, it } from 'vitest'
import { prosthesisScenario } from '../../../ui-tests/fighting-preparation/prostheses'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpSetup } from './pvp/protocol'
import { privatePvpState } from './pvp/view'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

describe('the facial injury premise and actual reconstruction commands cross P2 and replay boundaries', () => {
  it('validates the explicit setup and keeps canonical support IDs in P2 prediction', () => {
    const base = prosthesisScenario('opponent', 'face-and-neck')
    const parsed = parsePvpSetup({
      player: 'theta',
      opponent: 'hisoka',
      formatId: 'knockout',
      environment: base.environment,
    })
    expect(parsed?.environment.preparation?.injuries).toEqual({ opponent: 'face-and-neck' })
    const actual = needleCommand(base, { action: 'gum-prosthesis' }, 'opponent')
    const local = needleCommand(privatePvpState(base, 'opponent'), { action: 'gum-prosthesis' })
    expect(local.player.bodyDamage).toEqual(actual.opponent.bodyDamage)
    expect(local.player.gumProstheses).toEqual(actual.opponent.gumProstheses)
    expect(local.environment.preparation?.injuries).toEqual({ player: 'face-and-neck' })
  })
  it('records and reproduces formation, exposed recovery, surface selection, Texture and release', () => {
    let state = prosthesisScenario('opponent', 'post-explosion')
    const recorder = createReplayRecorder(state)!
    const plan: Record<number, ArsenalCommand> = {
      0: { action: 'gum-prosthesis' },
      30: { action: 'texture-target', target: 'gum-prostheses' },
      31: { action: 'texture-apply' },
      85: { action: 'gum-prosthesis-release' },
    }
    for (let frame = 0; frame < 100; frame++) {
      const action = plan[frame]
      const preview = action ? needleCommand(state, action, 'opponent') : state
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
      if (frame === 80)
        expect(state.opponent.textureSurprise?.supportId).toBe(state.opponent.gumProstheses?.id)
    }
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let frame = 0; frame < 100 && !replay.done; frame++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})
