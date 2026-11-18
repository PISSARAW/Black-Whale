import { describe, expect, it } from 'vitest'
import { createBaselineTape } from '../combatBaselineTape'
import { createFight } from '../engine'
import { packReplayInput } from '../fightReplayInput'
import { createReplayRecorder } from '../fightReplayRecorder'
import { EMPTY_INPUT } from '../types'
import type { FightInput } from '../types'
import type { ReplayPacket } from '../fightReplayTypes'
import { withKameos } from './state'

const pack = (input: FightInput) => packReplayInput(input)

describe('kameo replays (lot 8)', () => {
  it('records a match with kameos from its very first frame', () => {
    const state = withKameos(createFight('kurapika', 'hisoka', { mode: 'versus-local' }), {
      player: 'luzurus',
      opponent: 'tubeppa',
    })
    expect(createReplayRecorder(state)).not.toBeNull()
  })

  it('plays a kameo call back to the very same state, at two playback cadences', () => {
    const initial = withKameos(createFight('kurapika', 'hisoka', { mode: 'versus-local' }), {
      player: 'luzurus',
      opponent: 'tubeppa',
    })
    const tape = createBaselineTape(initial)
    tape.step([1 / 60, 0, 0, [{ kind: 'start' }]] as ReplayPacket)
    const call = pack({ ...EMPTY_INPUT, kameo: true, right: true })
    const heal = pack({ ...EMPTY_INPUT, kameo: true })
    tape.step([1 / 60, call, heal, []] as ReplayPacket)
    for (let frame = 0; frame < 160; frame++)
      tape.step([1 / 60, pack({ ...EMPTY_INPUT, right: frame < 40 }), 0, []] as ReplayPacket)
    const result = tape.finish()
    expect(result.measurement.replayVerified).toBe(true)
    expect(tape.state.kameos?.player?.phase).toBe('reserve')
    expect(tape.state.kameos?.player?.cooldownFrames).toBeGreaterThan(0)
    expect(tape.state.kameos?.opponent?.cooldownFrames).toBeGreaterThan(0)
  })
})
